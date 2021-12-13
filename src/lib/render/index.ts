import axios from 'axios';
import puppeteer from 'puppeteer';

import { normalizeURL } from '@/lib/server';

import { cleanupHtml, modifyHtml, modifyScript, StackTrace, StackFrame, isInternalLine } from './selectiveDOMChanges';

export interface RenderedRoute {
	html: string;
	path: string;
}

export { StackTrace, StackFrame };
export class RenderInstance {
	routes: string[];
	// isAllowedDOMChangeFactory is called per render, because of that there should be no state sharing between returned functions.
	isAllowedDOMChangeFactory: () => (stackTrace: StackTrace) => Promise<boolean> | boolean;

	async _validate(): Promise<void> {
		if (!(this.routes instanceof Array)) throw new Error('RenderInstance.routes is set to invalid value');
		if (!(this.isAllowedDOMChangeFactory instanceof Function)) throw new Error('RenderInstance.isAllowedDOMChangeFactory is set to invalid value');
	}
}

export async function render(serverPort: number, renderInstance: RenderInstance): Promise<RenderedRoute[]> {
	const browser = await puppeteer.launch();
	const rootUrl = `localhost:${serverPort}`;

	const renderRoutesPromises = [];
	for (const route of renderInstance.routes) {
		renderRoutesPromises.push(renderRoute(browser, rootUrl, route, renderInstance));
	}
	const renderedRoutes = await Promise.all(renderRoutesPromises);

	await browser.close();
	return renderedRoutes;
}

// Keep in sync with src/lib/rendererBrowserScripts/src/selectiveDOMChangesCore/Allowed.ts
const isAllowedDOMChangeRoute = '__selectiveDOMChanges__/isAllowedDOMChange';

async function renderRoute(browser: puppeteer.Browser, rootUrl: string, route: string, renderInstance: RenderInstance): Promise<RenderedRoute> {
	const pageURL = normalizeURL(`http://${rootUrl}${route}`);
	const page = await browser.newPage();
	const isAllowedDOMChange = renderInstance.isAllowedDOMChangeFactory();

	let indexHTMLLines: string[];
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
				// Modify only root index.html.
				if (request.url() !== pageURL) break;
				const html = await getResponse();
				const modifiedHtml = modifyHtml(html);
				indexHTMLLines = modifiedHtml.split('\n');
				await respond(modifiedHtml);
				return;
			}

			case 'script': {
				const script = await getResponse();
				const modifiedScript = modifyScript(script);
				await respond(modifiedScript);
				return;
			}

			case 'xhr': {
				if (!request.url().includes(isAllowedDOMChangeRoute)) break;
				const postData = request.postData();
				if (postData === undefined) throw new Error('Invalid post data');
				const stackTrace = JSON.parse(postData) as StackTrace;

				const filteredStackTrace: StackTrace = [];
				for (const frame of stackTrace) {
					if (frame.fileName === pageURL) {
						// This -1 accounts for that that the page starts counting lines from 1, but array for 0.
						if (!isInternalLine(indexHTMLLines[frame.lineNumber - 1])) filteredStackTrace.push(frame);
					} else {
						filteredStackTrace.push(frame);
					}
				}

				const isAllowed = await isAllowedDOMChange(filteredStackTrace);
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

	return { html: cleanupHtml(content), path: route };
}
