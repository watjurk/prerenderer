import { isElement } from './domHelpers';

// Keep in sync with src/lib/selectiveDOMChanges.ts
const internalNodeAttribute = '__prerenderer__';
export function isInternalNode(node: Node): boolean {
	if (isElement(node) && node.hasAttribute(internalNodeAttribute)) return true;
	return false;
}
