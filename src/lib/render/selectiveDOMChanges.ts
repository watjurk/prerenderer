import cheerio from 'cheerio';
import { isText } from 'domhandler';
import fs from 'fs';
import path from 'path';

// Keep in sync with src/lib/rendererBrowserScripts/src/selectiveDOMChangesCore/allowedDOMChange.ts
export interface StackFrame {
	columnNumber: number;
	lineNumber: number;
	fileName: string;
}

// Keep in sync with src/lib/rendererBrowserScripts/src/selectiveDOMChangesCore/allowedDOMChange.ts
export type StackTrace = StackFrame[];

const selectiveDOMChangesCorePath = path.resolve(__dirname, '../rendererBrowserScripts/out/selectiveDOMChangesCore/index.js');
const selectiveDOMChangesAdditionalNodesPath = path.resolve(__dirname, '../rendererBrowserScripts/out/selectiveDOMChangesAdditionalNodes/index.js');

const internalSourceCodeComment = '// __prerenderer__internal_code__ ';
const selectiveDOMChangesCoreSource = prepareSource(fs.readFileSync(selectiveDOMChangesCorePath).toString());
const selectiveDOMChangesAdditionalNodesSource = prepareSource(fs.readFileSync(selectiveDOMChangesAdditionalNodesPath).toString());
const removeScript = prepareSource(`window.document.currentScript.remove();`);

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

export function cleanupHtml(html: string): string {
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

function prepareSource(source: string): string {
	return addInternalSourceComment(normalizeNewline(source));
}

function normalizeNewline(s: string): string {
	return s.replaceAll('\r\n', '\n');
}

function addInternalSourceComment(source: string): string {
	return source
		.split('\n')
		.map((line) => line + ' ' + internalSourceCodeComment)
		.join('\n');
}

export function isInternalLine(line: string): boolean {
	return line.substring(line.length - internalSourceCodeComment.length) === internalSourceCodeComment;
}
