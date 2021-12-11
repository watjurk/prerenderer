import { render, RenderedRoute } from './lib/render';
import { getPort, start as startServer } from './lib/server';
import { PrerenderInstance, Plugin } from './prerender';

async function prerender(plugins: Plugin[]): Promise<RenderedRoute[]> {
	const prerenderInstance = new PrerenderInstance();
	const pluginPromises = [];
	for (const plugin of plugins) pluginPromises.push(plugin.execute(prerenderInstance));
	await Promise.all(pluginPromises);

	prerenderInstance.render.isAllowedDOMChangeFactory = () => (): boolean => {
		return true;
	};
	await prerenderInstance._validate();

	const server = startServer(prerenderInstance.server);
	const port = getPort(server);
	const renderedRoutes = await render(port, prerenderInstance.render);

	server.close();
	return renderedRoutes;
}

export default prerender;
