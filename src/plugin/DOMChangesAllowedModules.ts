import { Plugin, PrerenderInstance } from '@/prerender';

export class AllowedModules implements Plugin {
	readonly name = 'AllowedModules';

	async execute(prerenderInstance: PrerenderInstance): Promise<void> {}
}
