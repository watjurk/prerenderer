export function allNodes(node: Node, shouldTraverse?: (node: Node) => boolean): Node[] {
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
}

type OnNodeCreationCallback = (node: Node) => Node;

export function onNodeCreation(callback: OnNodeCreationCallback): void {
	// TODO: watch for cloned nodes

	const createElement = document.createElement;
	document.createElement = function (...args: unknown[]): any {
		// @ts-ignore
		return callback(createElement.apply(this, args)) as HTMLElement;
	};

	const createElementNS = document.createElementNS;
	document.createElementNS = function (...args: unknown[]): any {
		// @ts-ignore
		return callback(createElementNS.apply(this, args));
	};

	const createTextNode = document.createTextNode;
	document.createTextNode = function (...args: unknown[]): any {
		// @ts-ignore
		return callback(createTextNode.apply(this, args));
	};

	const createComment = document.createComment;
	document.createComment = function (...args: unknown[]): any {
		// @ts-ignore
		return callback(createComment.apply(this, args));
	};
}

export function isElement(node: Node): node is Element {
	return node.nodeType === node.ELEMENT_NODE;
}

export function removeNode(node: Node) {
	const parent = node.parentNode ?? node.parentElement;
	parent?.removeChild(node);
}
