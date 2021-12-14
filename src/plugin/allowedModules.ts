import { Plugin, PrerenderInstance, StackFrame, StackTrace } from '@/instance';

export interface Options {
	moduleNameProvider: (stackFrame: StackFrame) => Promise<string> | string;

	isAllowed?: (moduleName: string) => Promise<boolean> | boolean;
	allowedModules?: string[];
}
function validateOptions(options: Options): void {
	if ((options.allowedModules === undefined && options.isAllowed === undefined) || (options.allowedModules !== undefined && options.isAllowed !== undefined)) {
		throw new Error('You need to set only one of following: allowedModules or isAllowed');
	}
}

export class AllowedModules implements Plugin {
	readonly name = 'AllowedModules';

	isAllowed: NonNullable<Options['isAllowed']>;
	moduleNameProvider: Options['moduleNameProvider'];
	constructor(options: Options) {
		validateOptions(options);
		this.moduleNameProvider = options.moduleNameProvider;
		if (options.isAllowed !== undefined) {
			this.isAllowed = options.isAllowed;
		} else {
			this.isAllowed = (moduleName: string): boolean => {
				// We know for sure that options.allowedModules is defined because of the validateOptions function.
				const allowedModules = options.allowedModules as string[];
				return allowedModules.includes(moduleName);
			};
		}
	}

	async execute(prerenderInstance: PrerenderInstance): Promise<void> {
		prerenderInstance.render.isAllowedDOMChangeFactory = () => {
			return async (stackTrace: StackTrace): Promise<boolean> => {
				const moduleName = await this.moduleNameProvider(stackTrace[0]);
				return this.isAllowed(moduleName);
			};
		};
	}
}
