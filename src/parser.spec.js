'use strict'

/* eslint-env jest */

const ParseError = require('./error.js')
const Lexer = require('./lexer')

const { parser } = require('../grammar/simple')

describe('Parser', function () {
	////////////
	// Parser //
	////////////

	describe('Expression', function () {
		it('42', function () {
			let lex = new Lexer('42')
			let r = parser.parse(lex)
			expect(JSON.parse(JSON.stringify(r))).toEqual({ value: '42' })
		})

		it('constant "false"', function () {
			let lex = new Lexer('false')
			let r = parser.parse(lex)
			expect(JSON.parse(JSON.stringify(r))).toEqual({ value: 'false', arity: {} })
		})

		it('prefix operator', function () {
			let lex = new Lexer('-1')
			let r = parser.parse(lex)
			expect(JSON.parse(JSON.stringify(r))).toEqual({
				value: '-',
				arity: {},
				args: [{value: '1'}]
			})
		})
		it('infix operator  1+2+3', function () {
			let lex = new Lexer('1+2+3')
			let r = parser.parse(lex)
			expect(JSON.parse(JSON.stringify(r))).toEqual({
				//type: Lexer.OPERATOR,
				value: '+',
				arity: {},
				args: [
					{
						value: '+',
						arity: {},
						args: [{value: '1'}, {value: '2'}]
					},
					{value: '3'}
				]
			})
		})
		it('infix operator  1-(2+3)', function () {
			let r = parser.parse('1-(2+3)')
			expect(JSON.parse(JSON.stringify(r))).toEqual({
				//type: Lexer.OPERATOR,
				value: '-',
				arity: {},
				args: [
					{value: '1'},
					{
						value: '+',
						arity: {},
						args: [{value: '2'}, {value: '3'}]
					}
				]
			})
		})
		it('right associative operator', function () {
			let r = parser.parse('1^2^3')
			expect(JSON.parse(JSON.stringify(r))).toEqual({
				//type: Lexer.OPERATOR,
				value: '^',
				arity: {},
				args: [
					{value: '1'},
					{
						value: '^',
						arity: {},
						args: [{value: '2'}, {value: '3'}]
					}
				]
			})
		})
		it('3*(1+2) should parse', function () {
			let r = parser.parse('3*(1+2)')
			expect(JSON.parse(JSON.stringify(r))).toEqual({
				//type: Lexer.OPERATOR,
				value: '*',
				arity: {},
				args: [
					{value: '3'},
					{
						value: '+',
						arity: {},
						args: [{value: '1'}, {value: '2'}]
					}
				]
			})
		})
	})

	describe('Error handling', function () {
		it('unclosed parenthesis', function () {
			let lex = new Lexer('(1+2')
			//parser.parse(lex)
			expect(function () { return parser.parse(lex) }).toThrow(ParseError, "Expected ')', but got '2'")
		})
	})
})

// vim: ts=4
