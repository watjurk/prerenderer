import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const selectiveDOMChangesCoreSource = fs.readFileSync(path.resolve(__dirname, 'rendererBrowserScripts/out/selectiveDOMChangesCore/index.js')).toString();
const selectiveDOMChangesAdditionalNodesSource = fs
	.readFileSync(path.resolve(__dirname, 'rendererBrowserScripts/out/selectiveDOMChangesAdditionalNodes/index.js'))
	.toString();
const cleanupScript = `window.document.currentScript.remove();`;

const prerendererScriptKey = `__prerenderer__`;
const coreScript = `<script ${prerendererScriptKey}>${selectiveDOMChangesCoreSource}\n${cleanupScript}</script>`;
const observeDocumentNodesScript = `<script ${prerendererScriptKey}>${selectiveDOMChangesAdditionalNodesSource}\n${cleanupScript}</script>`;

// TODO: handle edge case when script removes itself from DOM and it is not observed.
// Solution: Add window.__observeNode__(window.document.currentScript) to every script request.

export function modifyHtml(html: string): string {
	const $ = cheerio.load(html);
	$(coreScript).prependTo('head');

	// Insert our script before every script in html.
	// Exceptions are scripts with prerendererScriptKey tag.
	$(observeDocumentNodesScript).insertBefore(`script:not([${prerendererScriptKey}])`);

	// Insert our script as last in body so all nodes are catched.
	$(observeDocumentNodesScript).appendTo('body');

	return $.html();
}
