import { ignoreObservations } from './changesObserver/ignore';
import { allNodes } from './domHelpers';
import { isInternalNode } from './internal';
import { getMetadata } from './metadata';

const dom2vdom = new Map<Node, Node>();
const vdomRoot = document.cloneNode() as Document;
dom2vdom.set(document, vdomRoot);
syncVDom();

// @ts-ignore
window.o = () => console.log(vdomRoot.documentElement.outerHTML);
// @ts-ignore
window.d = () => console.dir(vdomRoot.documentElement);

export function getCorrespondingVDomNode(domNode: Node): Node {
	return ignoreObservations((): Node => {
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
	ignoreObservations((): void => {
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

	if (domNode.parentNode === null) return;

	const vdomParentNode = dom2vdom.get(domNode.parentNode);
	if (vdomParentNode === undefined) throw new Error('Bad order of adding');

	const vdomNode = domNode.cloneNode();
	vdomParentNode.appendChild(vdomNode);
	dom2vdom.set(domNode, vdomNode);
}
