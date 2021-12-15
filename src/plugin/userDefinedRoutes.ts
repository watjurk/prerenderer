import { Plugin, PrerenderInstance } from '@/instance';
import { Route } from '@/lib/render';

export class UserDefinedRoutes implements Plugin {
	readonly name = 'UserDefinedRoutes';

	routes: Route[];
	constructor(routes: Route[]) {
		this.routes = routes;
	}

	async execute(prerenderInstance: PrerenderInstance): Promise<void> {
		prerenderInstance.render.routes = this.routes;
	}
}
