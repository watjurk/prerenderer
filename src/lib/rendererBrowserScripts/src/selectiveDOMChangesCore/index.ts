import { ignoreObservations, ObserveDescriptor } from './changesObserver';
import { allNodes, onNodeCreation } from './domHelpers';
import { getMetadata } from './metadata';
import { initObserve, observeNode } from './observe';
import { getStack } from './stack';
import { syncVDom } from './vdom';

function isLegal(): boolean {
	return getStack().includes('valid');
}

const observeDescriptor: ObserveDescriptor = {
	onFunctionCallContext(target, property, thisArg, argArray) {
		return {
			before: () => {},
			after: () => {
				console.trace()
				ignoreObservations(() => {
					console.log('function', property, 'call with thisArg and argArray respectively', thisArg, argArray);
				});
			},
		};
	},

	onPropertyGetContext(target, property) {
		return {
			before: () => {},
			after: () => {
				ignoreObservations(() => {
					console.log('property', property, 'get');
				});
			},
		};
	},

	onPropertySetContext(target, property, value) {
		return {
			before: () => {},
			after: () => {
				ignoreObservations(() => {
					console.log(`property`, property, `set to`, value);
				});
			},
		};
	},
};

initObserve(observeDescriptor);
observeNode(document);
observeAllDocumentNodes();

onNodeCreation((node: Node): Node => {
	getMetadata(node).isCreatedByJs = true;
	observeNode(node);
	return node;
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
};

type apiType = typeof api;
declare global {
	namespace selectiveDOMChangesCore {
		export const api: apiType;
	}
}

export { apiType as apiT };
