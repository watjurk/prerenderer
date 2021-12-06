const config = require('./config.js');

const fs = require('fs');
const path = require('path');

const aliasPlugin = require('@rollup/plugin-alias');
const replacePlugin = require('@rollup/plugin-replace');
const progressPlugin = require('rollup-plugin-progress');

const devServerPlugin = require('rollup-plugin-dev');

const commonjsPlugin = require('@rollup/plugin-commonjs');
const { default: nodeResolvePlugin } = require('@rollup/plugin-node-resolve');

const typescriptPlugin = require('rollup-plugin-typescript2');
const { default: dtsPlugin } = require('rollup-plugin-dts');

const paths = {
	src: path.resolve(config.ROOT_PATH, 'src'),
	out: path.resolve(config.ROOT_PATH, 'out'),
	cache: path.resolve(config.ROOT_PATH, 'node_modules/.cache/bundlerCache'),

	eslintConfig: path.resolve(config.ROOT_PATH, '.eslintrc.js'),
};

const options = {};
options.ts = {
	tsconfigDefaults: {
		exclude: ['./src/**/*.test.ts', './src/**/*.stories.ts'],
	},
};

const aliases = require(path.resolve(config.CONFIG_PATH, 'alias.json'));
for (const key in aliases) aliases[key] = path.resolve(config.ROOT_PATH, aliases[key]);

const inputs = fs.readdirSync(paths.src);
const externals = inputs.map((input) => `@/${input}`);

const rollupMultiConfig = inputs.map((input) => {
	const inputFolder = path.resolve(paths.src, input);
	
	/** @type {import('rollup').RollupOptions} */
	const rollupConfig = {
		external: externals,
		input: path.resolve(inputFolder, 'index.ts'),
		output: {
			name: input,
			file: path.resolve(paths.out, input, 'index.js'),
			format: 'iife',
			sourcemap: true,
		},
		plugins: [
			aliasPlugin(aliases),
			replacePlugin({
				values: {
					'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
					__IS_PRODUCTION__: JSON.stringify(config.IS_PRODUCTION),
				},
				preventAssignment: false,
			}),
			progressPlugin(),

			commonjsPlugin(),
			nodeResolvePlugin(),

			typescriptPlugin(options.ts),
		],
	};

	return rollupConfig;
});

// Generate types.
const rollupMultiConfigForTypeGeneration = inputs.map((input) => {
	/** @type {import('rollup').RollupOptions} */
	const rollupConfig = {
		external: externals,
		input: path.resolve(paths.src, input, 'index.ts'),
		output: {
			file: path.resolve(paths.out, input, 'types.d.ts'),
		},
		plugins: [dtsPlugin()],
	};

	return rollupConfig;
});

if (config.IS_WATCH) {
	// Add dev server to first config.
	rollupMultiConfig[0].plugins.push(
		devServerPlugin({
			// silent: true,
			port: 8081,
			host: config.ENV.HOST,
			dirs: [paths.out],
		}),
	);
}

module.exports = {
	rollupMultiConfig,
	rollupMultiConfigForTypeGeneration,
	paths,
};
