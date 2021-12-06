import { isIgnored } from './ignore';

export type ObserveDescriptor = Partial<NObserveDescriptor>;
interface NObserveDescriptorInterface {
	onFunctionCallContext(target: any, property: PropertyKey, thisArg: unknown, argArray: unknown[]): { before: () => void; after: (returnValue: unknown) => void };
	onPropertyGetContext(target: any, property: PropertyKey): { before: () => void; after: (value: unknown) => void };
	onPropertySetContext(target: any, property: PropertyKey, value: unknown): { before: () => void; after: () => void };
}

export interface ObservationContext<beforeArgs extends any[] = [], afterArgs extends any[] = []> {
	before: (...args: beforeArgs) => void;
	after: (...args: afterArgs) => void;
}

const noopContext = () => ({
	before: () => undefined,
	after: () => undefined,
});

export class NObserveDescriptor implements NObserveDescriptorInterface {
	private observeDescriptor: NObserveDescriptorInterface;
	constructor(observeDescriptor: ObserveDescriptor) {
		this.observeDescriptor = normalizeObserveDescriptor(observeDescriptor);
	}

	onFunctionCallContext(target: any, property: PropertyKey, thisArg: unknown, argArray: unknown[]): ReturnType<NObserveDescriptorInterface['onFunctionCallContext']> {
		if (isIgnored()) return noopContext();
		return this.observeDescriptor.onFunctionCallContext.call(this, target, property, thisArg, argArray);
	}

	onPropertyGetContext(target: any, property: PropertyKey): ReturnType<NObserveDescriptorInterface['onPropertyGetContext']> {
		if (isIgnored()) return noopContext();
		return this.observeDescriptor.onPropertyGetContext.call(this, target, property);
	}

	onPropertySetContext(target: any, property: PropertyKey, value: unknown): ReturnType<NObserveDescriptorInterface['onPropertySetContext']> {
		if (isIgnored()) return noopContext();
		return this.observeDescriptor.onPropertySetContext.call(this, target, property, value);
	}
}

function normalizeObserveDescriptor(observeDescriptor: ObserveDescriptor): NObserveDescriptorInterface {
	const NObserveDescriptor: NObserveDescriptorInterface = {
		onFunctionCallContext: observeDescriptor.onFunctionCallContext ?? noopContext,
		onPropertyGetContext: observeDescriptor.onPropertyGetContext ?? noopContext,
		onPropertySetContext: observeDescriptor.onPropertySetContext ?? noopContext,
	};

	return NObserveDescriptor;
}
