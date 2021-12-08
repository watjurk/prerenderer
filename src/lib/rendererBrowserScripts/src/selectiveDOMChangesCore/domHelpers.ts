import { ignoreAllObservations, isIgnored } from './ignore';

export function allNodes(node: Node, shouldTraverse?: (node: Node) => boolean): Node[] {
	return ignoreAllObservations((): Node[] => {
		// normalizedShouldTraverse
		const nShouldTraverse = shouldTraverse ?? (() => true);
		const all: Node[] = [];

		const runner = (node: Node): void => {
			if (node.childNodes === undefined) return;
			for (let i = 0; i < node.childNodes.length; i++) {
				const childNode = node.childNodes[i];
				if (!nShouldTraverse(childNode)) continue;
				all.push(childNode);
				runner(childNode);
			}
		};

		if (nShouldTraverse(node)) runner(node);

		return all;
	});
}

type OnNodeCreation = (node: Node) => void;

export function onNodeCreation(onNodeCreation: OnNodeCreation): void {
	// TODO: watch for cloned nodes
	ignoreAllObservations(() => {
		const createElement = document.createElement;
		document.createElement = function (...args: unknown[]): any {
			// @ts-ignore
			const node = createElement.apply(this, args);
			if (!isIgnored()) onNodeCreation(node);
			return node;
		};

		const createElementNS = document.createElementNS;
		document.createElementNS = function (...args: unknown[]): any {
			// @ts-ignore
			const node = createElementNS.apply(this, args);
			if (!isIgnored()) onNodeCreation(node);
			return node;
		};

		const createTextNode = document.createTextNode;
		document.createTextNode = function (...args: unknown[]): any {
			// @ts-ignore
			const node = createTextNode.apply(this, args);
			if (!isIgnored()) onNodeCreation(node);
			return node;
		};

		const createComment = document.createComment;
		document.createComment = function (...args: unknown[]): any {
			// @ts-ignore
			const node = createComment.apply(this, args);
			if (!isIgnored()) onNodeCreation(node);
			return node;
		};
	});
}

export function isElement(node: any): node is Element {
	if (isNode(node)) {
		return node.nodeType === node.ELEMENT_NODE;
	}

	return false;
}

export function isNode(node: any): node is Node {
	return node instanceof Node;
}

export function removeNode(node: Node) {
	const parent = node.parentNode ?? node.parentElement;
	parent?.removeChild(node);
}
