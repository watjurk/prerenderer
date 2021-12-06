import { getSync } from 'stacktrace-js';

export function getStack(): string[] {
	const stack = getSync();
	const functionNames = [];
	for (const frame of stack) {
		if (frame.functionName === undefined) continue;
		functionNames.push(frame.functionName);
	}

	return functionNames;
}
