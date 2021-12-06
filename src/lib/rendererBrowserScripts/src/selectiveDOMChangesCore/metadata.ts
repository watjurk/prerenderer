export class Metadata {
	isObserved: boolean = false;
	isCreatedByJs: boolean = false;
}

interface NodeWithMeta extends Node {
	__selectiveDOMChangesMetadata__: Metadata | undefined;
}

export function getMetadata(node: Node): Metadata {
	const nodeWithMeta = node as NodeWithMeta;
	if (nodeWithMeta.__selectiveDOMChangesMetadata__ !== undefined) {
		return nodeWithMeta.__selectiveDOMChangesMetadata__;
	}

	nodeWithMeta.__selectiveDOMChangesMetadata__ = new Metadata();
	return nodeWithMeta.__selectiveDOMChangesMetadata__;
}
