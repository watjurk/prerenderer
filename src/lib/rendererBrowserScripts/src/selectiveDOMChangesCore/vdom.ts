import { allNodes } from './domHelpers';
import { ignoreAllObservations } from './changesObserver';
import { isInternalNode } from './internal';
import { getMetadata } from './metadata';

const dom2vdom = new Map<Node, Node>();
const vdomRoot = document.cloneNode() as Document;
dom2vdom.set(document, vdomRoot);
syncVDom();

export function getVDomContent(): string {
	return vdomRoot.documentElement.outerHTML;
}

export function getCorrespondingVDomNode(domNode: Node): Node {
	return ignoreAllObservations((): Node => {
		let vdomNode = dom2vdom.get(domNode);
		if (vdomNode !== undefined) {
			return vdomNode;
		}

		addDomNodeToVDom(domNode);

		vdomNode = dom2vdom.get(domNode);
		if (vdomNode === undefined) {
			throw new Error('Expected vdom node to be defined, because it was added');
		}

		return vdomNode;
	});
}

export function syncVDom(): void {
	ignoreAllObservations((): void => {
		const domNodes = allNodes(document, (domNode) => {
			if (isInternalNode(domNode)) return false;
			if (getMetadata(domNode).isCreatedByJs) return false;
			return true;
		});

		for (const domNode of domNodes) {
			addDomNodeToVDom(domNode);
		}
	});
}

function addDomNodeToVDom(domNode: Node): void {
	if (dom2vdom.has(domNode)) return;
	if (isInternalNode(domNode)) return;

	const vdomNode = domNode.cloneNode();

	if (domNode.parentNode !== null) {
		const vdomParentNode = dom2vdom.get(domNode.parentNode);
		if (vdomParentNode === undefined) throw new Error('Bad order of adding');

		vdomParentNode.appendChild(vdomNode);
	}

	dom2vdom.set(domNode, vdomNode);
}
