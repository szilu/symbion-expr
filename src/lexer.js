'use strict'

const ParseError = require('./error')

/********************/
/* Lexical analyzer */
/********************/
const lexerGrammarDefault = {
	operChars: '+-*/^.:%|!?#&<>=',
	wordStartChars: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$',
	wordChars: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$',
	charTokens: '.,:;()[]{}',
	lParens: '([{',
	rParens: ')]}',
	quotes: '"\''
}
const T = {
	WORD: Symbol('word'),
	NUMBER: Symbol('number'),
	STRING: Symbol('string'),
	OPERATOR: Symbol('operator'),
	START: Symbol('start'),
	END: Symbol('end')
}

class Lexer {
	constructor(str, grammar = lexerGrammarDefault) {
		this.pos = 0
		this.buf = str
		this.line = 1
		this.lineStart = this.pos

		this.grammar = grammar

		this.setToken(T.START)
		//this.next()
	}

	error(code, str, args) {
		throw new ParseError(code, str, this.pos, args)
	}

	setToken(type, value) {
		this.token = { type: type, value, pos: [this.line, this.start - this.lineStart + 1] }
		return this.token
	}

	next() {
		let c = this.buf.charAt(this.pos)

		// Skip whitespace
		let wsStart = this.pos
		let ret
		while (this.pos < this.buf.length && (' \t\r\n'.indexOf(c) >= 0
			|| ((c === '/') && (this.buf.charAt(this.pos + 1) === '/'))
			|| ((c === '/') && (this.buf.charAt(this.pos + 1) === '*'))
		)) {
			if ((c === '/') && (this.buf.charAt(this.pos + 1) === '/')) {
				while (this.pos < this.buf.length && c !== '\n') c = this.buf.charAt(++this.pos)
				if (c === '\n') {
					c = this.buf.charAt(++this.pos)
					this.line++; this.lineStart = this.pos
				}
			} else if ((c === '/') && (this.buf.charAt(this.pos + 1) === '*')) {
				while (this.pos < this.buf.length
						&& (this.buf.charAt(this.pos) + this.buf.charAt(this.pos + 1)) !== '*/') {
					if (c === '\n') {
						c = this.buf.charAt(++this.pos)
						this.line++; this.lineStart = this.pos
					}
					c = this.buf.charAt(++this.pos)
				}
				this.pos++
				c = this.buf.charAt(++this.pos)
			} else if (c === '\n') {
				c = this.buf.charAt(++this.pos)
				this.line++; this.lineStart = this.pos
			} else {
				c = this.buf.charAt(++this.pos)
			}
		}
		let ws = this.buf.substring(wsStart, this.pos)

		this.start = this.pos
		if (this.pos >= this.buf.length) {
			ret = this.setToken(T.END, '<END>')
		} else if (this.grammar.wordStartChars.indexOf(c) >= 0) {
			// Word
			c = this.buf.charAt(++this.pos)
			while (this.pos < this.buf.length && this.grammar.wordChars.indexOf(c) >= 0) {
				c = this.buf.charAt(++this.pos)
			}
			ret = this.setToken(T.WORD, this.buf.substring(this.start, this.pos))
		} else if ('0' <= c && c <= '9') {
			// Number
			while (this.pos < this.buf.length && '0' <= c && c <= '9') {
				c = this.buf.charAt(++this.pos)
			}
			if (c === '.') {
				c = this.buf.charAt(++this.pos)
				while (this.pos < this.buf.length && '0' <= c && c <= '9') {
					c = this.buf.charAt(++this.pos)
				}
			}
			ret = this.setToken(T.NUMBER, this.buf.substring(this.start, this.pos))
		} else if (this.grammar.quotes.indexOf(c) >= 0) {
			// String
			let quote = c
			c = this.buf.charAt(++this.pos)
			let start = this.pos
			let str = ''
			while (this.pos < this.buf.length && c !== quote) {
				if (c === '\\') {
					str = str.concat(this.buf.substring(start, this.pos))
					c = this.buf.charAt(++this.pos)
					start = this.pos
				}
				c = this.buf.charAt(++this.pos)
			}
			str = str.concat(this.buf.substring(start, this.pos))
			ret = this.setToken(T.STRING, str)
			if (this.pos < this.buf.length && c === quote) {
				c = this.buf.charAt(++this.pos)
			} else this.error('E-PRS-UEQUOT', 'Unclosed quote `' + quote + '`', [quote])
		} else if (this.grammar.charTokens.indexOf(c) >= 0) {
			// One character token
			ret = this.setToken(c, c)
			c = this.buf.charAt(++this.pos)
		} else if (this.grammar.operChars.indexOf(c) >= 0) {
			// Parse operator string
			c = this.buf.charAt(++this.pos)
			while (this.pos < this.buf.length && this.grammar.operChars.indexOf(c) >= 0) {
				c = this.buf.charAt(++this.pos)
			}
			ret = this.setToken(T.OPERATOR, this.buf.substring(this.start, this.pos))
		} else {
			this.error('E-PRS-UECHAR', "Unexpected character '" + c + "'", [c])
		}
		this.token.ws = ws
		return ret
	}
}

Object.assign(Lexer, T)
Lexer.defaultGrammar = lexerGrammarDefault

module.exports = Lexer

// vim: ts=4
