'use strict'

/* eslint-env jest */

let ParseError = require('./error.js')
let Lexer = require('./lexer')

/////////////////////////////////////////
function tokenize(what) {
	let lex
	if (typeof what === 'string') lex = new Lexer(what)
	else if (typeof what === 'object') lex = what
	else throw new Error('tokenize() call error')
	// Skip START token
	lex.next()
	let t = []
	//while (lex.token.type!==Lexer.END) { t.push(lex.t); lex.next() }
	while (lex.token.type !== Lexer.END) {
		t.push(lex.token)
		lex.next()
	}
	t.push(lex.token)
	return t
}
/////////////////////////////////////////

describe('Lexer', function () {
	///////////
	// Lexer //
	///////////

	describe('Simple integer', function () {
		it('should tokenize', function () {
			let lex = new Lexer('42')
			expect(tokenize(lex)).toEqual([
				{type: Lexer.NUMBER, value: '42', pos: [1, 1], ws: ''},
				{type: Lexer.END, value: '<END>', pos: [1, 3], ws: ''}
			])
		})
	})
	describe('Simple decimal', function () {
		it('should tokenize', function () {
			let lex = new Lexer('42.123')
			expect(tokenize(lex)).toEqual([
				{type: Lexer.NUMBER, value: '42.123', pos: [1, 1], ws: ''},
				{type: Lexer.END, value: '<END>', pos: [1, 7], ws: ''}
			])
		})
	})
	describe('Simple word', function () {
		it('should tokenize', function () {
			let lex = new Lexer('word')
			expect(tokenize(lex)).toEqual([
				{type: Lexer.WORD, value: 'word', pos: [1, 1], ws: ''},
				{type: Lexer.END, value: '<END>', pos: [1, 5], ws: ''}
			])
		})
	})
	describe('One character operator', function () {
		it('should tokenize', function () {
			let lex = new Lexer('+')
			expect(tokenize(lex)).toEqual([
				{type: Lexer.OPERATOR, value: '+', pos: [1, 1], ws: ''},
				{type: Lexer.END, value: '<END>', pos: [1, 2], ws: ''}
			])
		})
	})
	describe('Multiple character operator', function () {
		it('should tokenize', function () {
			let lex = new Lexer('++=')
			expect(tokenize(lex)).toEqual([
				{type: Lexer.OPERATOR, value: '++=', pos: [1, 1], ws: ''},
				{type: Lexer.END, value: '<END>', pos: [1, 4], ws: ''}
			])
		})
	})
	describe('Simple string', function () {
		it('should tokenize', function () {
			let lex = new Lexer('"string"')
			expect(tokenize(lex)).toEqual([
				{type: Lexer.STRING, value: 'string', pos: [1, 1], ws: ''},
				{type: Lexer.END, value: '<END>', pos: [1, 9], ws: ''}
			])
		})
		it('with escaped quote should tokenize', function () {
			let lex = new Lexer('"\\"string"')
			expect(tokenize(lex)).toEqual([
				{type: Lexer.STRING, value: '"string', pos: [1, 1], ws: ''},
				{type: Lexer.END, value: '<END>', pos: [1, 11], ws: ''}
			])
		})
		it('with escaped quote at end of string should tokenize', function () {
			let lex = new Lexer('"string\\""')
			expect(tokenize(lex)).toEqual([
				{type: Lexer.STRING, value: 'string"', pos: [1, 1], ws: ''},
				{type: Lexer.END, value: '<END>', pos: [1, 11], ws: ''}
			])
		})
	})
	describe('Whitespace', function () {
		it('should tokenize', function () {
			let lex = new Lexer(' 1')
			expect(tokenize(lex)).toEqual([
				{type: Lexer.NUMBER, value: '1', pos: [1, 2], ws: ' '},
				{type: Lexer.END, value: '<END>', pos: [1, 3], ws: ''}
			])
		})
		it('with multiple lines should tokenize', function () {
			let lex = new Lexer('1 \n  word')
			expect(tokenize(lex)).toEqual([
				{type: Lexer.NUMBER, value: '1', pos: [1, 1], ws: ''},
				{type: Lexer.WORD, value: 'word', pos: [2, 3], ws: ' \n  '},
				{type: Lexer.END, value: '<END>', pos: [2, 7], ws: ''}
			])
		})
		it('with /* */ comment should tokenize', function () {
			let lex = new Lexer(' /* comment */1')
			expect(tokenize(lex)).toEqual([
				{type: Lexer.NUMBER, value: '1', pos: [1, 15], ws: ' /* comment */'},
				{type: Lexer.END, value: '<END>', pos: [1, 16], ws: ''}
			])
		})
		it('with multiple lines in /* */ comment should tokenize', function () {
			let lex = new Lexer('1 /*\n */ word')
			expect(tokenize(lex)).toEqual([
				{type: Lexer.NUMBER, value: '1', pos: [1, 1], ws: ''},
				{type: Lexer.WORD, value: 'word', pos: [2, 5], ws: ' /*\n */ '},
				{type: Lexer.END, value: '<END>', pos: [2, 9], ws: ''}
			])
		})
		it('with // comment should tokenize', function () {
			let lex = new Lexer('1 // comment\n  word')
			expect(tokenize(lex)).toEqual([
				{type: Lexer.NUMBER, value: '1', pos: [1, 1], ws: ''},
				{type: Lexer.WORD, value: 'word', pos: [2, 3], ws: ' // comment\n  '},
				{type: Lexer.END, value: '<END>', pos: [2, 7], ws: ''}
			])
		})
		it('with // comment at end of expression should tokenize', function () {
			let lex = new Lexer('1//')
			expect(tokenize(lex)).toEqual([
				{type: Lexer.NUMBER, value: '1', pos: [1, 1], ws: ''},
				{type: Lexer.END, value: '<END>', pos: [1, 4], ws: '//'}
			])
		})
	})
	describe('Expression', function () {
		it('1+2 should tokenize', function () {
			let lex = new Lexer('1+2')
			expect(tokenize(lex)).toEqual([
				{type: Lexer.NUMBER, value: '1', pos: [1, 1], ws: ''},
				{type: Lexer.OPERATOR, value: '+', pos: [1, 2], ws: ''},
				{type: Lexer.NUMBER, value: '2', pos: [1, 3], ws: ''},
				{type: Lexer.END, value: '<END>', pos: [1, 4], ws: ''}
			])
		})
		it('9-(2+3) should tokenize', function () {
			let lex = new Lexer('9-(2+3)')
			expect(tokenize(lex)).toEqual([
				{type: Lexer.NUMBER, value: '9', pos: [1, 1], ws: ''},
				{type: Lexer.OPERATOR, value: '-', pos: [1, 2], ws: ''},
				{type: '(', value: '(', pos: [1, 3], ws: ''},
				{type: Lexer.NUMBER, value: '2', pos: [1, 4], ws: ''},
				{type: Lexer.OPERATOR, value: '+', pos: [1, 5], ws: ''},
				{type: Lexer.NUMBER, value: '3', pos: [1, 6], ws: ''},
				{type: ')', value: ')', pos: [1, 7], ws: ''},
				{type: Lexer.END, value: '<END>', pos: [1, 8], ws: ''}
			])
		})
	})
	describe('Error handling', function () {
		it('unclosed quote', function () {
			let lex = new Lexer('"string')
			expect(tokenize.bind(null, lex)).toThrow(ParseError, 'Unclosed quote `"`')
		})
		it('Invalid character', function () {
			expect(tokenize.bind(null, '`')).toThrow(ParseError, "Unexpected character '`'")
		})
	})
})

// vim: ts=4
