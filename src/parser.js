'use strict'

const ParseError = require('./error')
let Lexer = require('./lexer')

class Sym {
	nud() {
		throw new ParseError('E-PRS-UNDEFN', 'Undefied', [], null)
	}

	led(left) {
		throw new ParseError('E-PRS-MISOPR', 'Missing operator', [], null)
	}
}

const A = {
	UNARY: new Sym('unary'),
	BINARY: new Sym('binary'),
	CONST: new Sym('constant')
}

const T = {
	VAR: Symbol('var'),
	STRING: Symbol('string'),
	NUMBER: Symbol('number')
}

class Parser {
	constructor(lexerGrammar) {
		this.lexerGrammar = lexerGrammar
		this.symbolTable = {}
	}

	symbol(id, bp = 0) {
		let sym = this.symbolTable[id]
		if (sym) {
			if (bp >= sym.lbp) sym.lbp = bp
		} else {
			sym = Object.create(Sym)
			sym.id = sym.val = id
			sym.lbp = bp
			sym.parser = this
			this.symbolTable[id] = sym
		}
		return sym
	}

	symOper(op, args) {
		let o = Object.create(this.symbolTable[op])
		o.value = op
		o.type = Lexer.OPERATOR
		o.args = args
		return o
	}

	symVar(value) {
		let o = Object.create(this.symbolTable[T.VAR])
		o.value = value
		o.type = Lexer.WORD
		return o
	}

	advance(type, id) {
		let t = this.lex.next()

		if (id && (this.token.type !== type || this.token.value !== id)) {
			throw new ParseError('E-PRS-EXPTOK', "Expected '" + id + "', but got '" + this.token.value + "'.", [type, id])
		}
		if (!id && type && this.token.type !== type) {
			throw new ParseError('E-PRS-EXPTYP', 'Expected ' + type.toString() + '.', [type])
		}

		let v = t.value
		let a = t.type
		let o
		if (a === Lexer.WORD) {
			o = this.symbolTable[t.value] || this.symbolTable[T.VAR]
		} else if (a === Lexer.OPERATOR
				|| (typeof a === 'string' && this.lex.grammar.charTokens.indexOf(a) >= 0)) {
			o = this.symbolTable[v]
			if (!o) throw new ParseError('E-PRS-ONKOPR', "Unknown operator '" + v + "'.", [v])
		} else if (a === Lexer.STRING) {
			o = this.symbolTable[T.STRING]
		} else if (a === Lexer.NUMBER) {
			o = this.symbolTable[T.NUMBER]
		} else if (a === Lexer.END) {
			return
		} else {
			throw new ParseError('E-PRS-ONETOK', 'Unexpected token ' + a.toString() + '.', [type, v])
		}
		this.token = Object.create(o)
		this.token.value = v
		this.token.type = a
		return this.token
	}

	expression(rbp = 0) {
		let t = this.token
		this.advance()
		let left = t.nud()
		while (rbp < this.token.lbp) {
			t = this.token
			this.advance()
			left = t.led(left)
		}
		return left
	}

	constant(s, v) {
		var sym = this.symbol(s)
		sym.nud = function () {
			//const st = this.symbolTable[this.id]
			//console.dir(st)
			//this.value = this.symbolTable[this.id].value
			this.value = s
			this.arity = A.CONST
			return this
		}
		sym.value = s
		return sym
	}

	infix(id, bp, led) {
		let self = this
		let sym = this.symbol(id, bp)
		sym.led = led || function (left) {
			this.arity = A.BINARY
			this.args = [left, self.expression(bp)]
			return this
		}
		return sym
	}

	infixr(id, bp, led) {
		let self = this
		let sym = this.symbol(id, bp)
		sym.led = led || function (left) {
			this.arity = A.BINARY
			this.args = [left, self.expression(bp - 1)]
			return this
		}
		return sym
	}

	prefix(id, nud) {
		let self = this
		let sym = this.symbol(id)
		sym.nud = nud || function () {
			this.arity = A.UNARY
			this.args = [self.expression(70)]
			return this
		}
		return sym
	}

	parse(what) {
		let lex = typeof what === 'object' ? what : new Lexer(what, this.lexerGrammar)
		this.lex = lex
		if (lex.token === Lexer.START) lex.next()
		this.advance()
		return this.expression()
	}
}

Object.assign(Parser, T)
Parser.Sym = Sym

module.exports = Parser

// vim: ts=4
