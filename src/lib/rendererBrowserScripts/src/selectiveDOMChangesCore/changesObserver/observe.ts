import { NObserveDescriptor, normalizeObserveDescriptor, ObserveDescriptor } from './descriptor';
import { isIgnored } from './ignore';
import * as objectHelpers from './objectHelpers';

const observedSymbol = Symbol('observe.already_observed');

export function observe(target: any, observeDescriptor: ObserveDescriptor, deep: boolean = false): void {
	// Don't observe object twice.
	if (target[observedSymbol] === true) {
		// TODO: Make something with observeDescriptor, connect it to the already observed one?
		return;
	}

	// Mark object as observed.
	Object.defineProperty(target, observedSymbol, {
		configurable: false,
		enumerable: false,
		writable: false,
		value: true,
	});

	const nObserveDescriptor = normalizeObserveDescriptor(observeDescriptor);

	// This section observes properties not owned by target, but by target prototypes.
	const targetPrototypePropertyKeys = objectHelpers.getPrototypePropertyKeys(target);
	const mockPrototype = Object.create(null);

	const mockPrototypeNameKey = Symbol('prototype_name');
	const mockPrototypeName = 'observe.mocking_prototype';
	Object.defineProperty(mockPrototype, mockPrototypeNameKey, {
		value: mockPrototypeName,
		configurable: false,
		enumerable: false,
		writable: false,
	});

	for (const propertyKey of targetPrototypePropertyKeys) {
		// When getters and setters on target are invoked, this context refers to invoker.
		// So if they are invoked by the target this refers to the target.
		// We need to find firs prototype after our mockPrototype so we won't fall in infinite loop,
		// this is exactly what getPrototypeAfter is doing.
		Object.defineProperty(mockPrototype, propertyKey, {
			get(): unknown {
				const onPropertyGetContext = nObserveDescriptor.onPropertyGetContext(target, propertyKey);

				onPropertyGetContext.before();
				const prototype = objectHelpers.getPrototypeAfter(this, mockPrototype);
				let v = getProperty(prototype, propertyKey, this);
				onPropertyGetContext.after(v);

				if (!isIgnored()) {
					if (deep && objectHelpers.isObject(v)) {
						deepObserve(v, target, propertyKey, nObserveDescriptor);
					}

					if (typeof v === 'function') {
						v = observeFunctionCall(v, target, propertyKey, nObserveDescriptor);
					}
				}

				return v;
			},

			set(v: unknown) {
				const onPropertySetContext = nObserveDescriptor.onPropertySetContext(target, propertyKey, v);

				onPropertySetContext.before();
				const prototype = objectHelpers.getPrototypeAfter(this, mockPrototype);
				setProperty(prototype, propertyKey, v, this);
				onPropertySetContext.after();

				if (deep && objectHelpers.isObject(v) && !isIgnored()) {
					deepObserve(v, target, propertyKey, nObserveDescriptor);
				}
			},
		});
	}

	// Prototype of target will be replaced with mockPrototype,
	// and prototype of mockPrototype will be replaced with target prototype.
	// And so the chain will remain intact.
	// Prototype chain before was looking like this:
	// target -> targetPrototype -> ...
	// Prototype chain after modifications looks like this:
	// target -> mockPrototype -> targetPrototype -> ...
	const targetPrototype = Object.getPrototypeOf(target);
	Object.setPrototypeOf(target, mockPrototype);
	Object.setPrototypeOf(mockPrototype, targetPrototype);

	// This section deals with properties owned by target.
	// We are mocking properties by defining new ones and storing the old ones in originalProperties.
	const targetPropertyKeys = objectHelpers.getOwnPropertyKeys(target);

	const originalProperties = {};
	const originalPropertiesKey = Symbol('observe.original_properties');

	for (const propertyKey of targetPropertyKeys) {
		const propertyDescriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
		if (propertyDescriptor === undefined) throw 'Undefined property descriptor, but keys are from getOwnPropertyKeys, should never happen.';
		Object.defineProperty(originalProperties, propertyKey, propertyDescriptor);

		// TODO: Provide fallback?
		// We are not able to redefine non configurable properties.
		if (propertyDescriptor.configurable === false) continue;

		// TODO: Provide fallback?
		// We are not able to redefine non writable properties.
		if (propertyDescriptor.writable === false) continue;

		Object.defineProperty(target, propertyKey, {
			get(): unknown {
				const onPropertyGetContext = nObserveDescriptor.onPropertyGetContext(target, propertyKey);

				onPropertyGetContext.before();
				const originalProperties = this[originalPropertiesKey];
				let v = getProperty(originalProperties, propertyKey, this);
				onPropertyGetContext.after(v);

				if (!isIgnored()) {
					if (deep && objectHelpers.isObject(v)) {
						deepObserve(v, target, propertyKey, nObserveDescriptor);
					}

					if (typeof v === 'function') {
						v = observeFunctionCall(v, target, propertyKey, nObserveDescriptor);
					}
				}

				return v;
			},
			set(v: unknown) {
				const onPropertySetContext = nObserveDescriptor.onPropertySetContext(target, propertyKey, v);

				onPropertySetContext.before();
				const originalProperties = this[originalPropertiesKey];
				setProperty(originalProperties, propertyKey, v, this);
				onPropertySetContext.after();

				if (deep && objectHelpers.isObject(v) && !isIgnored()) {
					deepObserve(v, target, propertyKey, nObserveDescriptor);
				}
			},
		});
	}

	Object.defineProperty(target, originalPropertiesKey, {
		value: originalProperties,
		configurable: false,
		enumerable: false,
		writable: false,
	});
}

type UnknownFunction = (...args: unknown[]) => unknown;
function observeFunctionCall(fn: UnknownFunction, target: any, propertyKey: PropertyKey, nObserveDescriptor: NObserveDescriptor): UnknownFunction {
	const newFunction: UnknownFunction = function (this: unknown, ...args): unknown {
		const onFunctionCallContext = nObserveDescriptor.onFunctionCallContext(target, propertyKey, this, args);
		onFunctionCallContext.before();
		const returnValue = fn.apply(this, args);
		onFunctionCallContext.after(returnValue);
		return returnValue;
	};

	return newFunction;
}

function getProperty(object: any, propertyKey: PropertyKey, getterThisContext: any): any {
	let v: any;
	const propertyDescriptor = objectHelpers.getPropertyDescriptor(object, propertyKey);
	if (propertyDescriptor === undefined) v = undefined;
	else if (propertyDescriptor.get !== undefined) v = propertyDescriptor.get.call(getterThisContext);
	else v = propertyDescriptor.value;
	return v;
}

function setProperty(object: any, propertyKey: PropertyKey, v: any, setterThisContext: any) {
	const propertyDescriptor = objectHelpers.getPropertyDescriptor(object, propertyKey);
	if (propertyDescriptor === undefined) throw new Error('propertyDescriptor cannot be undefined');
	else if (propertyDescriptor.set !== undefined) propertyDescriptor.set.call(setterThisContext, v);
	else object[propertyKey] = v;
}

function deepObserve(object: any, target: any, propertyKey: PropertyKey, nObserveDescriptor: NObserveDescriptor): void {
	observe(
		object,
		{
			onFunctionCallContext(deepTarget, deepPropertyKey, thisArg, argArray) {
				const deepProperty = [propertyKey, deepPropertyKey];
				return nObserveDescriptor.onDeepFunctionCallContext(target, deepTarget, deepProperty, thisArg, argArray);
			},
			onPropertyGetContext(deepTarget, deepPropertyKey) {
				const deepProperty = [propertyKey, deepPropertyKey];
				return nObserveDescriptor.onDeepPropertyGetContext(target, deepTarget, deepProperty);
			},
			onPropertySetContext(deepTarget, deepPropertyKey, value) {
				const deepProperty = [propertyKey, deepPropertyKey];
				return nObserveDescriptor.onDeepPropertySetContext(target, deepTarget, deepProperty, value);
			},

			onDeepFunctionCallContext(middleTarget, deepTarget, deepProperty, thisArg, argArray) {
				deepProperty = [propertyKey, ...deepProperty];
				return nObserveDescriptor.onDeepFunctionCallContext(target, deepTarget, deepProperty, thisArg, argArray);
			},
			onDeepPropertyGetContext(middleTarget, deepTarget, deepProperty) {
				deepProperty = [propertyKey, ...deepProperty];
				return nObserveDescriptor.onDeepPropertyGetContext(target, deepTarget, deepProperty);
			},
			onDeepPropertySetContext(middleTarget, deepTarget, deepProperty, value) {
				deepProperty = [propertyKey, ...deepProperty];
				return nObserveDescriptor.onDeepPropertySetContext(target, deepTarget, deepProperty, value);
			},
		},
		true,
	);
}
