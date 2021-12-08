import { isIgnored } from '@/selectiveDOMChangesCore/ignore';

export type ObserveDescriptor = Partial<NObserveDescriptorInterface>;
interface NObserveDescriptorInterface {
	onFunctionCallContext(target: any, property: PropertyKey, thisArg: unknown, argArray: unknown[]): { before: () => void; after: (returnValue: unknown) => void } | void;
	onPropertyGetContext(target: any, property: PropertyKey): { before: () => void; after: (value: unknown) => void } | void;
	onPropertySetContext(target: any, property: PropertyKey, value: unknown): { before: () => void; after: () => void } | void;
}

export interface ObservationContext<beforeArgs extends any[] = [], afterArgs extends any[] = []> {
	before: (...args: beforeArgs) => void;
	after: (...args: afterArgs) => void;
}

const noopContext = () => ({
	before: () => undefined,
	after: () => undefined,
});

type NonVoidable<T> = T extends void ? never : T;
export class NObserveDescriptor implements NObserveDescriptorInterface {
	private observeDescriptor: NObserveDescriptorInterface;
	constructor(observeDescriptor: ObserveDescriptor) {
		this.observeDescriptor = normalizeObserveDescriptor(observeDescriptor);
	}

	onFunctionCallContext(
		target: any,
		property: PropertyKey,
		thisArg: unknown,
		argArray: unknown[],
	): NonVoidable<ReturnType<NObserveDescriptorInterface['onFunctionCallContext']>> {
		if (isIgnored()) return noopContext();
		return this.observeDescriptor.onFunctionCallContext.call(this, target, property, thisArg, argArray) ?? noopContext();
	}

	onPropertyGetContext(target: any, property: PropertyKey): NonVoidable<ReturnType<NObserveDescriptorInterface['onPropertyGetContext']>> {
		if (isIgnored()) return noopContext();
		return this.observeDescriptor.onPropertyGetContext.call(this, target, property) ?? noopContext();
	}

	onPropertySetContext(target: any, property: PropertyKey, value: unknown): NonVoidable<ReturnType<NObserveDescriptorInterface['onPropertySetContext']>> {
		if (isIgnored()) return noopContext();
		return this.observeDescriptor.onPropertySetContext.call(this, target, property, value) ?? noopContext();
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
