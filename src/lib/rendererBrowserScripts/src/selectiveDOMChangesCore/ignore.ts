import 'zone.js';

const isIgnoredKey = 'selective_dom_changes_core_is_ignored';

export function ignoreAllObservations<T extends (...args: any) => any, RType = ReturnType<T>>(callback: T): RType {
	const ignoreZone = Zone.current.fork({
		name: 'ignore_zone',
		properties: {
			[isIgnoredKey]: true,
		},
	});

	return ignoreZone.runGuarded<RType>(callback);
}

export function isIgnored(): boolean {
	if (Zone.current.get(isIgnoredKey) === true) return true;
	return false;
}
