import cheerio from 'cheerio';
import { isText } from 'domhandler';
import fs from 'fs';
import path from 'path';

const selectiveDOMChangesCorePath = path.resolve(__dirname, 'rendererBrowserScripts/out/selectiveDOMChangesCore/index.js');
const selectiveDOMChangesAdditionalNodesPath = path.resolve(__dirname, 'rendererBrowserScripts/out/selectiveDOMChangesAdditionalNodes/index.js');

const selectiveDOMChangesCoreSource = normalizeNewline(fs.readFileSync(selectiveDOMChangesCorePath).toString());
const selectiveDOMChangesAdditionalNodesSource = normalizeNewline(fs.readFileSync(selectiveDOMChangesAdditionalNodesPath).toString());
const removeScript = `window.document.currentScript.remove();`;

const prerendererScriptKey = `__prerenderer__`;
const coreScript = `<script ${prerendererScriptKey}>${selectiveDOMChangesCoreSource}\n${removeScript}</script>`;
const additionalNodesScript = `<script ${prerendererScriptKey}>${selectiveDOMChangesAdditionalNodesSource}\n${removeScript}</script>`;

export function modifyHtml(html: string): string {
	const $ = cheerio.load(html);
	$('head').prepend(coreScript);

	// Insert our script before every script.
	// Exceptions are scripts with prerendererScriptKey tag.
	$(`script:not([${prerendererScriptKey}])`).each((i, el) => {
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
			console.log('a');
			childNode.data = cleanupScript(childNode.data);
			return;
		}
	});

	return $.html();
}

function normalizeNewline(s: string): string {
	return s.replaceAll('\r\n', '\n');
}
