import cheerio from 'cheerio';
import { isText } from 'domhandler';
import fs from 'fs';
import path from 'path';

const selectiveDOMChangesCoreSource = fs.readFileSync(path.resolve(__dirname, 'rendererBrowserScripts/out/selectiveDOMChangesCore/index.js')).toString();
const selectiveDOMChangesAdditionalNodesSource = fs
	.readFileSync(path.resolve(__dirname, 'rendererBrowserScripts/out/selectiveDOMChangesAdditionalNodes/index.js'))
	.toString();
const cleanupScript = `window.document.currentScript.remove();`;

const prerendererScriptKey = `__prerenderer__`;
const coreScript = `<script ${prerendererScriptKey}>${selectiveDOMChangesCoreSource}\n${cleanupScript}</script>`;
const additionalNodesScript = `<script ${prerendererScriptKey}>${selectiveDOMChangesAdditionalNodesSource}\n${cleanupScript}</script>`;

export function modifyHtml(html: string): string {
	const $ = cheerio.load(html);
	$('head').prepend(coreScript);

	// Insert our script before every script in html.
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
	return `${selectiveDOMChangesAdditionalNodesSource}` + script;
}
