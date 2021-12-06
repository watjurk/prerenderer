const config = require('./config');
if (!config.IS_PRODUCTION) console.warn('Waring: using production config not in production env');

const common = require('./rollup.config.common.js');

const { terser: terserPlugin } = require('rollup-plugin-terser');

const rollupMultiConfig = common.rollupMultiConfig.map((rConfig) => {
	let outputArray = rConfig.output;
	if (!Array.isArray(outputArray)) outputArray = [outputArray];
	for (const output of outputArray) {
		output.sourcemap = false;
	}

	// rConfig.plugins.push();

	return rConfig;
});

module.exports = [...rollupMultiConfig, ...common.rollupMultiConfigForTypeGeneration];
