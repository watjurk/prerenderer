import { PrerenderInstance, Plugin } from './instance';
import { render, RenderedRoute } from './lib/render';
import { getPort, start as startServer } from './lib/server';
// Plugins to be exported so users have easy access to them
import { AllowedModules } from './plugin/allowedModules';
import { DiskFileProvider } from './plugin/diskFileProvider';
import { UserDefinedRoutes } from './plugin/userDefinedRoutes';

export async function prerender(plugins: Plugin[]): Promise<RenderedRoute[]> {
	const prerenderInstance = new PrerenderInstance();
	const pluginPromises = [];
	for (const plugin of plugins) pluginPromises.push(plugin.execute(prerenderInstance));
	await Promise.all(pluginPromises);
	await prerenderInstance._validate();

	const server = startServer(prerenderInstance.server);
	const port = getPort(server);
	const renderedRoutes = await render(port, prerenderInstance.render);

	server.close();
	return renderedRoutes;
}

export const plugins = {
	AllowedModules,
	DiskFileProvider,
	UserDefinedRoutes,
};
export { Plugin, PrerenderInstance };
