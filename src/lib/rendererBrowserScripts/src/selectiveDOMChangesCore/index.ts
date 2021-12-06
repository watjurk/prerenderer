// TODO: fix
import { ObserveDescriptor } from './changesObserver';
import { allNodes, onNodeCreation } from './domHelpers';
import { getMetadata } from './metadata';
import { initObserve, observeNode } from './observe';
import { getStack } from './stack';
import { getCorrespondingVDomNode, syncVDom } from './vdom';

function isLegal(): boolean {
	return getStack().includes('valid');
}

const observeDescriptor: ObserveDescriptor = {
	// onFunctionCallContext(target, property, thisArg, argArray) {
	// 	return {
	// 		before: () => {},
	// 		after: () => {
	// 			console.trace()
	// 			console.dir(property);
	// 			console.dir(target);
	// 		},
	// 	};

	// if (target.outerHTML === undefined) return;
	// const isValid = getStack().includes('valid');
	// if (isValid) {
	// 	const vdomNode = getCorrespondingVDomNode(target);

	// 	const propertyValue = vdomNode[property];
	// 	if (propertyValue !== undefined) {
	// 		propertyValue.apply(thisArg, argArray);
	// 	}
	// }
	// const propertyS = String(property);
	// return {
	// 	before: () => {
	// console.log(`-----`);
	// console.log(`before fn ${propertyS}`, argArray, target.outerHTML);
	// },
	// after: () => {
	// 	console.log(`after fn ${propertyS}`, target.outerHTML);
	// console.log(`-----`);
	// },
	// };
	// return {
	// 	before: () => onTarget(target, property),
	// 	after: () => onTarget(target, property),
	// };
	// },

	onPropertyGetContext(target, property) {
		return {
			before: () => {},
			after: () => {
				console.log(property);
				console.log('get prop');
			},
		};
	},

	// onPropertySetContext(target, property, value) {
	// 	return {
	// 		before: () => {},
	// 		after: () => {},
	// 	};
	// },
};

initObserve(observeDescriptor);
observeNode(document);

onNodeCreation((node: Node): Node => {
	getMetadata(node).isCreatedByJs = true;
	observeNode(node);
	return node;
});

// Expose public api.
export const api = {
	observeAllDocumentNodes() {
		const nodes = allNodes(document);
		for (const node of nodes) {
			observeNode(node);
		}
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
