import { ignoreObservations, observe, ObserveDescriptor } from './changesObserver';
import { isElement } from './domHelpers';
import { isInternalNode } from './internal';
import { getMetadata } from './metadata';

let observeDescriptor: ObserveDescriptor;
export function initObserve(descriptor: ObserveDescriptor): void {
	observeDescriptor = descriptor;
}

export function observeNode(node: Node) {
	ignoreObservations(() => {
		const metadata = getMetadata(node);

		if (metadata.isObserved) return;
		metadata.isObserved = true;

		// Don't observe prerender internal nodes - they clean after themselves.
		if (isInternalNode(node)) return;

		observe(node, observeDescriptor);
	});
}
