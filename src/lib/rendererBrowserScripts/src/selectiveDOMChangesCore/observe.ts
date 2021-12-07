import { observe, ObserveDescriptor } from './changesObserver';
import { ignoreAllObservations } from './ignore';
import { isInternalNode } from './internal';
import { getMetadata } from './metadata';

let observeDescriptor: ObserveDescriptor;
export function initObserve(descriptor: ObserveDescriptor): void {
	observeDescriptor = descriptor;
}

export function observeNode(node: Node) {
	ignoreAllObservations(() => {
		const metadata = getMetadata(node);

		if (metadata.isObserved) return;
		metadata.isObserved = true;

		// Don't observe prerender internal nodes - they clean after themselves.
		if (isInternalNode(node)) return;

		observe(node, observeDescriptor);
	});
}
