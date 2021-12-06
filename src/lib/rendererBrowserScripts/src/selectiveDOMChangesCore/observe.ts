import { observe, ObserveDescriptor } from './changesObserver';
import { isElement } from './domHelpers';
import { isInternalNode } from './internal';
import { getMetadata } from './metadata';

let observeDescriptor: ObserveDescriptor;
export function initObserve(od: ObserveDescriptor): void {
	observeDescriptor = od;
}

export function observeNode(node: Node) {
	const metadata = getMetadata(node);

	if (metadata.isObserved) return;
	metadata.isObserved = true;

	// Don't observe prerender internal nodes - they clean after themselves.
	if (isInternalNode(node)) return;

	observe(node, observeDescriptor);
}
