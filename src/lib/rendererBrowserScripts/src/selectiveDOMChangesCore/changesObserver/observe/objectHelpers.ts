export function isObject(o: any): boolean {
	return typeof o === 'object' && o !== null;
}

export function getPropertyDescriptor(object: any, propertyKey: PropertyKey): PropertyDescriptor | undefined {
	let obj: any = object;
	let descriptor = undefined;

	while (descriptor === undefined) {
		if (!isObject(obj)) return undefined;
		descriptor = Object.getOwnPropertyDescriptor(obj, propertyKey);
		obj = Object.getPrototypeOf(obj);
	}

	return descriptor;
}

// getOwnPropertyKeys returns combined propertyNames and propertySymbols.
export function getOwnPropertyKeys(object: any): PropertyKey[] {
	return [...Object.getOwnPropertyNames(object), ...Object.getOwnPropertySymbols(object)];
}

// getPrototypePropertyKeys returns properties that are found in objects prototype chain.
// This function combines propertyNames and propertySymbols.
export function getPrototypePropertyKeys(object: any): PropertyKey[] {
	const propertyKeys = new Set<PropertyKey>();
	let obj = Object.getPrototypeOf(object);

	while (isObject(obj)) {
		const objPrototype = Object.getPrototypeOf(obj);
		for (const propertyKey of getOwnPropertyKeys(obj)) {
			let skip = false;
			try {
				// Do not include __proto__, as it is only present as ownProperty in Object prototype.
				if (obj[propertyKey] === objPrototype) skip = true;
			} catch (e) {}

			if (skip) continue;
			propertyKeys.add(propertyKey);
		}

		obj = objPrototype;
	}

	return [...propertyKeys.values()];
}

// getValidPrototype returns the first prototype that occurs after afterPrototype.
// It is required that afterPrototype occurs exactly once inside prototype chain.
export function getPrototypeAfter(object: any, afterPrototype: any): any {
	let obj = object;

	while (obj !== afterPrototype) {
		obj = Object.getPrototypeOf(obj);
	}
	return Object.getPrototypeOf(obj);
}
