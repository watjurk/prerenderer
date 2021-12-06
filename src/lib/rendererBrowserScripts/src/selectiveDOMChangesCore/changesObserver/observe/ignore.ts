export function ignoreObservations<T extends (...args: any) => any>(callback: T): ReturnType<T> {
	return callback();
}

export function isIgnored(): boolean {
	return false;
}
