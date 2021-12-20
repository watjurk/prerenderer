import { isIgnored } from './ignore';
import { DeepProperty } from './objectHelpers';

export type ObserveDescriptor = Partial<{
	[Property in keyof NObserveDescriptor]: (...args: Parameters<NObserveDescriptor[Property]>) => ReturnType<NObserveDescriptor[Property]> | void;
}>;

interface FunctionCallContext {
	before: () => void;
	after: (returnValue: unknown) => void;
}
interface PropertyGetContext {
	before: () => void;
	after: (value: unknown) => void;
}
interface PropertySetContext {
	before: () => void;
	after: () => void;
}
interface PropertySetContext {
	before: () => void;
	after: () => void;
}

export interface NObserveDescriptor {
	onFunctionCallContext(target: any, property: PropertyKey, thisArg: unknown, argArray: unknown[]): FunctionCallContext;
	onPropertyGetContext(target: any, property: PropertyKey): PropertyGetContext;
	onPropertySetContext(target: any, property: PropertyKey, value: unknown): PropertySetContext;

	onDeepFunctionCallContext(target: any, deepTarget: any, deepProperty: DeepProperty, thisArg: unknown, argArray: unknown[]): FunctionCallContext;
	onDeepPropertyGetContext(target: any, deepTarget: any, deepProperty: DeepProperty): PropertyGetContext;
	onDeepPropertySetContext(target: any, deepTarget: any, deepProperty: DeepProperty, value: unknown): PropertySetContext;
}

const noopContextFunction = () => ({
	before: () => undefined,
	after: () => undefined,
});
const noopContext = noopContextFunction();

type NObserveDescriptorKeyType = keyof NObserveDescriptor;
const NObserveDescriptorKeys = [
	'onFunctionCallContext',
	'onPropertyGetContext',
	'onPropertySetContext',
	'onDeepFunctionCallContext',
	'onDeepPropertyGetContext',
	'onDeepPropertySetContext',
] as NObserveDescriptorKeyType[];

export function normalizeObserveDescriptor(observeDescriptor: ObserveDescriptor): NObserveDescriptor {
	let nObserveDescriptor = {} as NObserveDescriptor;

	let key: NObserveDescriptorKeyType;
	for (key of NObserveDescriptorKeys) {
		const originalFn = observeDescriptor[key];
		if (originalFn === undefined) {
			nObserveDescriptor[key] = noopContextFunction;
			continue;
		}

		// @ts-ignore
		nObserveDescriptor[key] = function () {
			if (isIgnored()) return noopContext;

			// @ts-ignore
			const originalReturnValue = originalFn.apply(this, arguments);

			return originalReturnValue ?? noopContext;
		};
	}

	return nObserveDescriptor;
}
