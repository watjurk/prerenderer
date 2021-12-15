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
const selectiveDOMChangesCoreSourceLines = selectiveDOMChangesCoreSource.split('\n');

const selectiveDOMChangesAdditionalNodesSource = prepareSource(fs.readFileSync(selectiveDOMChangesAdditionalNodesPath).toString());
const selectiveDOMChangesAdditionalNodesSourceLines = selectiveDOMChangesAdditionalNodesSource.split('\n');

const removeScript = prepareSource(`window.document.currentScript.remove();`);

function prepareSource(source: string): string {
	// Add new lines to make some space between our code and user code.
	return addInternalSourceComment(normalizeNewline(source)) + '\n\n\n';
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

// Keep in sync with src/lib/rendererBrowserScripts/src/selectiveDOMChangesCore/internal.ts
const internalNodeAttribute = `__prerenderer__`;
const coreScript = `<script ${internalNodeAttribute}>${selectiveDOMChangesCoreSource}\n${removeScript}</script>`;
const additionalNodesScript = `<script ${internalNodeAttribute}>${selectiveDOMChangesAdditionalNodesSource}\n${removeScript}</script>`;

export class SelectiveDOMChanges {
	private pageServerURL: string;
	private pageHtml: string;

	private modifiedHtml: string;
	private modifiedHtmlLines: string[];
	constructor(pageServerURL: string, pageHtml: string) {
		this.pageServerURL = pageServerURL;
		this.pageHtml = pageHtml;
		this.modifiedHtml = modifyHtml(this.pageHtml);
		this.modifiedHtmlLines = this.modifiedHtml.split('\n');
	}

	modifyScriptSource(script: string): string {
		return modifyScriptSource(script);
	}

	getModifiedHtml(): string {
		return this.modifiedHtml;
	}

	cleanupRenderedHtml(html: string): string {
		return cleanupRenderedHtml(html);
	}

	convertStackTrace(stackTrace: StackTrace): StackTrace {
		const filteredStackTrace: StackTrace = [];
		for (const frame of stackTrace) {
			if (frame.fileName === this.pageServerURL) {
				// This -1 accounts for that that the page starts counting lines from 1, but array for 0.
				if (isInternalLine(this.modifiedHtmlLines[frame.lineNumber - 1])) continue;

				// TODO: Fix frame.lineNumber
				filteredStackTrace.push(frame);
				continue;
			}

			// Account for us adding additional content
			frame.lineNumber -= selectiveDOMChangesAdditionalNodesSourceLines.length - 1;
			filteredStackTrace.push(frame);
		}

		return filteredStackTrace;
	}
}

function modifyHtml(html: string): string {
	const $ = cheerio.load(html);
	$('head').prepend(coreScript);

	// Insert our script before every script.
	// Exceptions are scripts with internalNodeAttribute.
	$(`script:not([${internalNodeAttribute}])`).each((i, el) => {
		for (const childNode of el.childNodes) {
			if (!isText(childNode)) continue;
			childNode.data = modifyScriptSource(childNode.data);
			return;
		}
	});

	// Insert our script as last in body so all nodes are catched.
	$('body').append(additionalNodesScript);

	return $.html();
}

function modifyScriptSource(script: string): string {
	return selectiveDOMChangesAdditionalNodesSource + script;
}

function cleanupScript(script: string): string {
	return script.replace(selectiveDOMChangesAdditionalNodesSource, '');
}

function cleanupRenderedHtml(html: string): string {
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

function isInternalLine(line: string): boolean {
	return line.substring(line.length - internalSourceCodeComment.length) === internalSourceCodeComment;
}
