/* eslint-disable */
// @ts-nocheck

document.addEventListener('readystatechange', (event) => {
	if (document.readyState === 'interactive') {
		onInteractive();
	}
});

function onInteractive() {
	console.log(document.all.length);
	console.log([...document.all]);
}
