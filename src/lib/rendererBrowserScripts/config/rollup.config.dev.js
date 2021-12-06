const config = require('./config');
if (config.IS_PRODUCTION) console.warn('Waring: using development config in production env');

const common = require('./rollup.config.common.js');

const htmlPlugin = require('@rollup/plugin-html');

const rollupMultiConfig = common.rollupMultiConfig.map((rConfig) => {
	if (config.IS_WATCH) {
		rConfig.plugins.push(htmlPlugin());
	}

	return rConfig;
});

module.exports = [...rollupMultiConfig, ...common.rollupMultiConfigForTypeGeneration];
