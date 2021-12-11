import { isAllowed, StackFrame, StackTrace } from './allowedDOMChange';
import { ObserveDescriptor } from './changesObserver';
import { allNodes, isNode, onNodeCreation } from './domHelpers';
import { ignoreAllObservations } from './ignore';
import { getMetadata } from './metadata';
import { initObserve, observeNode } from './observe';
import { getVDomContent, getCorrespondingVDomNode, syncVDom } from './vdom';

export { StackFrame, StackTrace };

const observeDescriptor: ObserveDescriptor = {
	onFunctionCallContext(target, property, thisArg, argArray) {
		if (!isAllowed()) return;
		proxyActionToVdom(target, (vdomNode) => {
			const args = [];
			for (const arg of argArray) {
				if (isNode(arg)) args.push(getCorrespondingVDomNode(arg));
				else args.push(arg);
			}

			// @ts-ignore
			vdomNode[property](...args);
		});
	},

	onPropertyGetContext(target, property) {},

	onPropertySetContext(target, property, value) {
		if (!isAllowed()) return;
		proxyActionToVdom(target, (vdomNode) => {
			// @ts-ignore
			vdomNode[property] = value;
		});
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
