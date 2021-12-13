import express, { RequestHandler } from 'express';
import http from 'http';
import parseUrl from 'parseurl';

export class ServerInstance {
	fileProvider: (path: string) => Promise<string> | string;

	async _validate(): Promise<void> {
		if (typeof this.fileProvider !== 'function') throw new Error('ServerInstance.fileProvider is not a function');
	}
}

export const defaultServerInstance = new ServerInstance();

export function start(serverInstance: ServerInstance): http.Server {
	const app = express();

	// Register file provider.
	app.use(fileProviderHandler(serverInstance.fileProvider));

	// You can bind to a random, free port assigned by the OS by specifying 0 for the port.
	return app.listen(0);
}

export function getPort(server: http.Server): number {
	const address = server.address();
	if (typeof address === 'object' && address !== null) {
		return address.port;
	}

	throw new Error('Unexpected address');
}

export function normalizeURL(urlPath: string): string {
	if (urlPath.endsWith('/')) urlPath += 'index.html';
	if (urlPath.startsWith('/')) urlPath = urlPath.substring(1);
	return urlPath;
}

function fileProviderHandler(fileProvider: ServerInstance['fileProvider']): RequestHandler {
	return async function (request, response): Promise<void> {
		const url = parseUrl(request);
		if (url === undefined) {
			response.send('Error: url is undefined');
			return;
		}
		if (url.pathname === null) {
			response.send('Error: url.pathname is null');
			return;
		}

		const path = normalizeURL(url.pathname);

		let file: string | null = null;
		try {
			file = await fileProvider(path);
		} catch (err: unknown) {}
		if (file === null) {
			response.sendStatus(404);
			return;
		}

		response.send(file);
	};
}
