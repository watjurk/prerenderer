import axios from 'axios';
import puppeteer from 'puppeteer';

import { normalizeURL } from '@/lib/server';

import { StackTrace, StackFrame, SelectiveDOMChanges } from './selectiveDOMChanges';

export interface Route {
	name: string;
	serverPath: string;
	clientPath?: string;
}

export interface NormalizedRoute {
	name: string;
	serverPath: string;
	// Empty when there is no client part.
	clientPath: string;

	// Path to resource - serverPart and clientPart combined.
	path: string;
}

export function normalizeRoute(route: Route): NormalizedRoute {
	const clientPath = route.clientPath ?? '';
	return {
		...route,
		clientPath: clientPath,
		path: `${route.serverPath}${clientPath}`,
	};
}

export function validateRoute(route: Route): void {
	if (route.serverPath[0] !== '/') throw new Error(`RenderInstance.routes, route: ${route.name}, serverPart must start with a '/'`);
	if (route.clientPath) {
		if (route.serverPath[route.serverPath.length - 1] !== '/') {
			throw new Error(`RenderInstance.routes, route: ${route.name}, when clientRoute is set serverPart must end with a '/'`);
		}

		if (route.clientPath[0] === '/') throw new Error(`RenderInstance.routes, route: ${route.name}, clientRoute cannot start with a '/'`);
	}
}

export interface RenderedRoute {
	html: string;
	route: NormalizedRoute;
}

export { StackTrace, StackFrame };
export class RenderInstance {
	routes: Route[];
	// isAllowedDOMChangeFactory is called per render, because of that there should be no state sharing between returned functions.
	isAllowedDOMChangeFactory: () => (stackTrace: StackTrace) => Promise<boolean> | boolean;

	async _validate(): Promise<void> {
		if (!(this.routes instanceof Array)) throw new Error('RenderInstance.routes is set to invalid value');
		if (!(this.isAllowedDOMChangeFactory instanceof Function)) throw new Error('RenderInstance.isAllowedDOMChangeFactory is set to invalid value');

		for (const route of this.routes) {
			validateRoute(route);
		}
	}
}

export async function render(serverPort: number, renderInstance: RenderInstance): Promise<RenderedRoute[]> {
	const browser = await puppeteer.launch();
	const rootURL = `http://localhost:${serverPort}`;

	const renderRoutesPromises = [];
	for (const route of renderInstance.routes) {
		renderRoutesPromises.push(renderRoute(browser, rootURL, route, renderInstance));
	}
	const renderedRoutes = await Promise.all(renderRoutesPromises);

	await browser.close();
	return renderedRoutes;
}

// Keep in sync with src/lib/rendererBrowserScripts/src/selectiveDOMChangesCore/Allowed.ts
const isAllowedDOMChangeRoute = '__selectiveDOMChanges__/isAllowedDOMChange';

async function renderRoute(browser: puppeteer.Browser, rootURL: string, route: Route, renderInstance: RenderInstance): Promise<RenderedRoute> {
	const NRoute = normalizeRoute(route);

	const pageServerURL = `${rootURL}${NRoute.serverPath}`;
	const pageURL = `${rootURL}${NRoute.path}`;

	// When URL contains # then browser will only send a request with URL part before #.
	// We need to account for that.
	const nonHashPageURL = pageURL.split('#')[0];

	const pageHtml = String((await axios.get(pageServerURL)).data);
	const selectiveDOMChanges = new SelectiveDOMChanges(pageServerURL, pageHtml);

	const isAllowedDOMChange = renderInstance.isAllowedDOMChangeFactory();
	const page = await browser.newPage();

	page.setRequestInterception(true);
	page.on('request', async (request) => {
		const getResponse = async (): Promise<string> => {
			const response = await axios.get(request.url());
			return String(response.data);
		};

		const respond = async (body: string): Promise<void> => {
			await request.respond({ body });
		};

		switch (request.resourceType()) {
			case 'document': {
				if (request.url() !== nonHashPageURL) break;
				await respond(selectiveDOMChanges.getModifiedHtml());
				return;
			}

			case 'script': {
				const script = await getResponse();
				const modifiedScript = selectiveDOMChanges.modifyScriptSource(script);
				await respond(modifiedScript);
				return;
			}

			case 'xhr': {
				// Intercept only requests about stack strace.
				if (!request.url().includes(isAllowedDOMChangeRoute)) break;

				const postData = request.postData();
				if (postData === undefined) throw new Error('Invalid post data');
				let stackTrace = JSON.parse(postData) as StackTrace;
				stackTrace = selectiveDOMChanges.convertStackTrace(stackTrace);

				const isAllowed = await isAllowedDOMChange(stackTrace);
				await request.respond({ body: isAllowed === true ? '1' : '0' });
				return;
			}
		}

		await request.continue();
	});

	await page.goto(pageURL);
	await page.waitForNetworkIdle();

	const content = (await page.evaluate('window.selectiveDOMChangesCore.api.getVDomContent()')) as string;
	await page.close();

	return { html: selectiveDOMChanges.cleanupRenderedHtml(content), route: NRoute };
}
