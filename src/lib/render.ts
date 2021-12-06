import axios from 'axios';
import puppeteer from 'puppeteer';

import { modifyHtml } from './selectiveDOMChanges';

export interface RenderedRoute {
	html: string;
	path: string;
}

export class RenderInstance {
	routes: string[];
	isModuleAllowedForDOMChanges: (moduleName: string) => Promise<boolean>;

	// private pagePlugins = new Map<string, string>();
	// registerPagePlugin(name: string, source: string): void {
	// 	if (this.pagePlugins.has(name)) throw new Error(`Page plugin with name: ${name}, already registered`);
	// 	this.pagePlugins.set(name, source);
	// }

	// _getPagePlugins(): string[] {
	// 	return [...this.pagePlugins.values()];
	// }

	async _validate(): Promise<void> {
		if (this.routes === undefined) throw new Error('RenderInstance.routes is undefined');
	}
}

export async function render(serverPort: number, renderInstance: RenderInstance): Promise<RenderedRoute[]> {
	const browser = await puppeteer.launch({
		devtools: true,
	});
	const rootUrl = `localhost:${serverPort}`;

	const renderRoutesPromises = [];
	for (const route of renderInstance.routes) {
		renderRoutesPromises.push(renderRoute(browser, rootUrl, route, renderInstance));
	}
	const renderedRoutes = await Promise.all(renderRoutesPromises);

	// await browser.close();
	return renderedRoutes;
}

async function renderRoute(browser: puppeteer.Browser, rootUrl: string, route: string, renderInstance: RenderInstance): Promise<RenderedRoute> {
	const page = await browser.newPage();

	page.on('console', (message) => console.log(message.text()));
	page.on('pageerror', (err) => console.log(err));

	page.setRequestInterception(true);
	page.on('request', async (request) => {
		if (request.resourceType() !== 'document') {
			await request.continue();
			return;
		}

		const response = await axios.get(request.url());
		const html = String(response.data);
		const modifiedHtml = modifyHtml(html);

		await request.respond({ body: modifiedHtml });
	});

	await page.goto(`http://${rootUrl}${route}`);
	await page.waitForNetworkIdle();

	const content = await page.content();
	page;
	// await page.close();

	return { html: content, path: route };
}
