process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const fs = require('fs');

const commonConfig = {
	'no-unused-vars': ['warn', { varsIgnorePattern: '_', argsIgnorePattern: '_', caughtErrorsIgnorePattern: '_' }],
};

const common = {};
common.js = {
	extends: ['eslint:recommended'],
	rules: {
		'no-empty': 'off',
		'require-yield': 'off',

		'no-unused-vars': commonConfig['no-unused-vars'],
		'no-unreachable': 'warn',
	},
};
common.ts = {
	extends: [...common.js.extends, 'plugin:@typescript-eslint/eslint-recommended', 'plugin:@typescript-eslint/recommended'],
	rules: {
		...common.js.rules,

		// =========================================================================
		// disable some rules as we would have duplicates with common.js.rules
		'no-unused-vars': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		// =========================================================================

		'@typescript-eslint/no-empty-function': 'off',
		'@typescript-eslint/no-empty-interface': 'off',
		'@typescript-eslint/no-inferrable-types': 'off',
		'@typescript-eslint/no-namespace': 'off',

		'@typescript-eslint/no-unused-vars': commonConfig['no-unused-vars'],
		'@typescript-eslint/explicit-function-return-type': 'error',
		'@typescript-eslint/no-explicit-any': 'error',
		'@typescript-eslint/no-implicit-any-catch': 'error',
		'@typescript-eslint/no-unsafe-assignment': 'error',
		'@typescript-eslint/no-unsafe-call': 'error',
		'@typescript-eslint/no-unsafe-member-access': 'error',
		'@typescript-eslint/no-unsafe-return': 'error',
	},
};

module.exports = {
	root: true,
	// Ignore every file and folder except src.
	ignorePatterns: [...fs.readdirSync(__dirname).filter((name) => name != 'src'), 'src/lib/rendererBrowserScripts'],
	env: {
		node: true,
		es6: true,
	},
	overrides: [
		{
			files: ['*.ts'],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				project: './tsconfig.json',
				tsconfigRootDir: __dirname,
			},
			rules: common.ts.rules,
			extends: common.ts.extends,
		},
	],
};
