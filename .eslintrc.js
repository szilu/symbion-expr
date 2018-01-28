module.exports = {
	'env': {
		'browser': true,
		'commonjs': true,
		'es6': true,
		'node': true
	},
	//'extends': 'eslint:recommended',
	'extends': 'standard',
	'rules': {
		'indent': ['error', 'tab'],
		'no-console': 'off',
		'no-tabs': 'off',
		'operator-linebreak': ['error', 'before'],
		'space-before-function-paren': ['error', { 'named': 'never'}],
		'spaced-comment': 'off',
		'yoda': 'off'
	}
}

// vim: ts=4
