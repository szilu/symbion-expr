'use strict'

const Lexer = require('../src/lexer')
const Parser = require('../src/parser')
const Eval = require('../src/eval')

const lexerGrammar = Lexer.defaultGrammar

let parser = new Parser(lexerGrammar)

parser.symbol(Parser.NUMBER).nud = function () { return this }
parser.symbol(Parser.STRING).nud = function () { return this }
parser.symbol(Parser.VAR).nud = function () { return this }
parser.symbol(',')

parser.constant('true', true)
parser.constant('false', false)
parser.constant('null', null)
parser.constant('pi', 3.14)

parser.infixr('<', 40)
parser.infixr('<=', 40)
parser.infixr('>', 40)
parser.infixr('>=', 40)

parser.infix('+', 50)
parser.infix('-', 50)

parser.infix('*', 60)
parser.infix('/', 60)

parser.infixr('^', 70)

parser.prefix('!')
parser.prefix('-')

parser.prefix('(', function () {
	var e = parser.expression(0)
	parser.advance(')', ')')
	return e
})
parser.symbol(')')

const numberType = {
	'_':	{js: n => `${n}`},
	'+':	{
		js: (a, b) => `${a}+${b}`,
		inv: [
			(parser, r, b) => parser.symOper('-', [r, b]),
			(parser, r, a) => parser.symOper('-', [r, a])
		]
	},
	'-':	{
		js: (a, b) => `${a}-${b}`,
		inv: [
			(parser, r, b) => parser.symOper('+', [r, b]),
			(parser, r, a) => parser.symOper('-', [a, r])
		]
	},
	'*':	{
		js: (a, b) => `${a}*${b}`,
		inv: [
			(parser, r, b) => parser.symOper('/', [r, b]),
			(parser, r, a) => parser.symOper('/', [r, a])
		]
	},
	'/':	{
		js: (a, b) => `${a}/${b}`,
		inv: [
			(parser, r, b) => parser.symOper('*', [r, b]),
			(parser, r, a) => parser.symOper('/', [a, r])
		]
	},
	'^':	{
		js: (a, b) => `Math.pow(${a}, ${b})`,
		inv: [
		]
	}
}

const stringType = {
	'_':	s => JSON.stringify(s),
	'+':	{
		js: (a, b) => `${a}+${b}`,
		inv: [
			(parser, r, b) => parser.symOper('-', [r, b]),
			(parser, r, a) => parser.symOper('-', [r, a])
		]
	}
}

const types = {
	[Lexer.NUMBER]: numberType,
	[Lexer.STRING]: stringType
}

const evaluator = new Eval(lexerGrammar, types)

module.exports = { parser, evaluator }

// vim: ts=4
