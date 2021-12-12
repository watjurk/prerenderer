import { Plugin, PrerenderInstance } from '@/instance';

export class UserDefinedRoutes implements Plugin {
	readonly name = 'UserDefinedRoutes';

	routes: string[];
	constructor(routes: string[]) {
		this.routes = routes;
	}

	async execute(prerenderInstance: PrerenderInstance): Promise<void> {
		prerenderInstance.render.routes = this.routes;
	}
}
