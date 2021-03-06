import { getSync } from 'stacktrace-js';

// Keep in sync with src/lib/render/selectiveDOMChanges.ts
export interface StackFrame {
	columnNumber: number;
	lineNumber: number;
	fileName: string;
}

// Keep in sync with src/lib/render/selectiveDOMChanges.ts
export type StackTrace = StackFrame[];

// Keep in sync with src/lib/render.ts
const isAllowedDOMChangeRoute = '__selectiveDOMChanges__/isAllowedDOMChange';

export function isAllowed(): boolean {
	const fullStackTrace = getSync();
	const stackTrace: StackTrace = [];

	for (const stackFrame of fullStackTrace) {
		if (stackFrame.columnNumber === undefined || stackFrame.lineNumber === undefined || stackFrame.fileName === undefined) return false;
		stackTrace.push({
			columnNumber: stackFrame.columnNumber,
			lineNumber: stackFrame.lineNumber,
			fileName: stackFrame.fileName,
		});
	}

	// We cannot change context to async because the DOM actions could happen without us noticing them or we could get them in the wrong order.
	// For this reason usage of sync XMLHttpRequest is required.
	const http = new XMLHttpRequest();
	http.open('POST', isAllowedDOMChangeRoute, false);
	http.setRequestHeader('content-type', 'application/json');
	http.send(JSON.stringify(stackTrace));

	return http.response === '1';
}
