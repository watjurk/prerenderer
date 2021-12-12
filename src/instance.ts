import { RenderInstance, StackTrace, StackFrame } from './lib/render';
import { ServerInstance } from './lib/server';
import { Plugin as BasePlugin } from './plugin';

export { StackTrace, StackFrame };
export class PrerenderInstance {
	readonly server = new ServerInstance();
	readonly render = new RenderInstance();

	async _validate(): Promise<void> {
		if (!(this.server instanceof ServerInstance)) throw new Error('ServerInstance is set to invalid value');
		if (!(this.render instanceof RenderInstance)) throw new Error('RenderInstance is set to invalid value');

		await Promise.all([this.server._validate(), this.render._validate()]);
	}
}

export type Plugin = BasePlugin<PrerenderInstance>;
