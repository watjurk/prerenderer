import cheerio from 'cheerio';
import { isText } from 'domhandler';
import fs from 'fs';
import path from 'path';

import { StackTrace, StackFrame } from '../rendererBrowserScripts/out/selectiveDOMChangesCore/types';

export { StackTrace, StackFrame };

const selectiveDOMChangesCorePath = path.resolve(__dirname, '../rendererBrowserScripts/out/selectiveDOMChangesCore/index.js');
const selectiveDOMChangesAdditionalNodesPath = path.resolve(__dirname, '../rendererBrowserScripts/out/selectiveDOMChangesAdditionalNodes/index.js');

const selectiveDOMChangesCoreSource = normalizeNewline(fs.readFileSync(selectiveDOMChangesCorePath).toString());
const selectiveDOMChangesAdditionalNodesSource = normalizeNewline(fs.readFileSync(selectiveDOMChangesAdditionalNodesPath).toString());
const removeScript = `window.document.currentScript.remove();`;

// Keep in sync with src/lib/rendererBrowserScripts/src/selectiveDOMChangesCore/internal.ts
const internalNodeAttribute = `__prerenderer__`;
const coreScript = `<script ${internalNodeAttribute}>${selectiveDOMChangesCoreSource}\n${removeScript}</script>`;
const additionalNodesScript = `<script ${internalNodeAttribute}>${selectiveDOMChangesAdditionalNodesSource}\n${removeScript}</script>`;

export function modifyHtml(html: string): string {
	const $ = cheerio.load(html);
	$('head').prepend(coreScript);

	// Insert our script before every script.
	// Exceptions are scripts with internalNodeAttribute.
	$(`script:not([${internalNodeAttribute}])`).each((i, el) => {
		for (const childNode of el.childNodes) {
			if (!isText(childNode)) continue;
			childNode.data = modifyScript(childNode.data);
			return;
		}
	});

	// Insert our script as last in body so all nodes are catched.
	$('body').append(additionalNodesScript);

	return $.html();
}

export function modifyScript(script: string): string {
	return selectiveDOMChangesAdditionalNodesSource + script;
}

function cleanupScript(script: string): string {
	return script.replace(selectiveDOMChangesAdditionalNodesSource, '');
}

export function cleanupContent(html: string): string {
	const $ = cheerio.load(html);

	$(`script`).each((i, el) => {
		for (const childNode of el.childNodes) {
			if (!isText(childNode)) continue;
			childNode.data = cleanupScript(childNode.data);
			return;
		}
	});

	return $.html();
}

function normalizeNewline(s: string): string {
	return s.replaceAll('\r\n', '\n');
}
