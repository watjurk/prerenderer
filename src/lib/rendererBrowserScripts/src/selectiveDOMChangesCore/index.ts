import { isAllowed, StackFrame, StackTrace } from './allowedDOMChange';
import { ObserveDescriptor, ignoreAllObservations } from './changesObserver';
import { DeepProperty, getDeepProperty as getDeepPropertyHelper, GetDeepPropertyReturn } from './changesObserver/objectHelpers';
import { allNodes, isNode, onNodeCreation } from './domHelpers';
import { getMetadata } from './metadata';
import { initObserve, observeNode } from './observe';
import { getVDomContent, getCorrespondingVDomNode, syncVDom } from './vdom';

export { StackFrame, StackTrace };

function normalizeProperty(object: any, property: PropertyKey | DeepProperty): GetDeepPropertyReturn {
	if (property instanceof Array) {
		const deepProperty = getDeepPropertyHelper(object, property);
		return deepProperty;
	} else {
		return { object, property };
	}
}

function onFunctionCall(target: any, property: PropertyKey | DeepProperty, argArray: unknown[]): void {
	if (!isAllowed()) return;
	proxyActionToVdom(target, (vdomNode) => {
		const args = [];
		for (const arg of argArray) {
			if (isNode(arg)) args.push(getCorrespondingVDomNode(arg));
			else args.push(arg);
		}

		const normalized = normalizeProperty(vdomNode, property);
		normalized.object[normalized.property](...args);
	});
}

function onPropertySet(target: any, property: PropertyKey | DeepProperty, value: unknown): void {
	if (!isAllowed()) return;
	proxyActionToVdom(target, (vdomNode) => {
		if (isNode(value)) value = getCorrespondingVDomNode(value);

		const normalized = normalizeProperty(vdomNode, property);
		normalized.object[normalized.property] = value;
	});
}

const observeDescriptor: ObserveDescriptor = {
	onFunctionCallContext(target, property, thisArg, argArray) {
		onFunctionCall(target, property, argArray);
	},

	onPropertySetContext(target, property, value) {
		onPropertySet(target, property, value);
	},

	onDeepFunctionCallContext(target, deepTarget, deepProperty, thisArg, argArray) {
		onFunctionCall(target, deepProperty, argArray);
	},

	onDeepPropertySetContext(target, deepTarget, deepProperty, value) {
		onPropertySet(target, deepProperty, value);
	},
};

function proxyActionToVdom(domNode: Node, actionCallback: (vdomNode: Node) => void): void {
	const vdomNode = getCorrespondingVDomNode(domNode);
	ignoreAllObservations(() => {
		actionCallback(vdomNode);
	});
}

initObserve(observeDescriptor);
observeNode(document);
observeAllDocumentNodes();

onNodeCreation((node: Node) => {
	getMetadata(node).isCreatedByJs = true;
	observeNode(node);
});

function observeAllDocumentNodes() {
	const nodes = allNodes(document);
	for (const node of nodes) {
		observeNode(node);
	}
}

// Expose public api.
export const api = {
	observeAllDocumentNodes() {
		observeAllDocumentNodes();
	},

	observeNode(node: Node) {
		observeNode(node);
	},

	syncVDom() {
		syncVDom();
	},

	getVDomContent(): string {
		return getVDomContent();
	},
};

type apiType = typeof api;
declare global {
	namespace selectiveDOMChangesCore {
		export const api: apiType;
	}
}

export { apiType as apiT };
