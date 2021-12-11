import { getSync } from 'stacktrace-js';

export interface StackFrame {
	columnNumber: number;
	lineNumber: number;
	fileName: string;
}
export type StackTrace = StackFrame[];

// Keep in sync with src/lib/render.ts
const isLegalDOMChangeRoute = '__selectiveDOMChanges__/isLegalDOMChange';

export function isLegal(): boolean {
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
	http.open('POST', '__selectiveDOMChanges__/isLegalDOMChange', false);
	http.setRequestHeader('content-type', 'application/json');
	http.send(JSON.stringify(stackTrace));

	return http.response === '1';
}
