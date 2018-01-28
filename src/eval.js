'use strict'

const Lexer = require('./lexer')

class Eval {
	constructor(lexGrammar, types) {
		this.lexGrammar = lexGrammar
		this.types = types
	}

	expression(node, lbp) {
		let args
		switch (node.type) {
		case Lexer.NUMBER:
		case Lexer.WORD:
			return node.value
		case Lexer.STRING:
			return JSON.stringify(node.value)
		case Lexer.OPERATOR:
			args = node.args.map((arg, idx) => {
				let a = this.expression(arg, node.lbp)
				if (idx > 0 && this.lexGrammar.operChars.indexOf(a[0]) >= 0) a = ' ' + a
				if (this.lexGrammar.operChars.indexOf((a + '').substr(-1)) >= 0) a += ' '
				return a
			})
			if (args.length < 2) {
				// FIXME postfix
				return node.value + args[0]
			} else {
				let exp = args.join(node.value)
				return node.lbp < lbp ? '(' + exp + ')' : exp
			}
		}
	}

	jsExpr(node, globals) {
		let op
		switch (node.type) {
		case Lexer.NUMBER:
		case Lexer.STRING:
			return this.types[node.type]._.js(node.value)
		case Lexer.WORD:
			return globals[node.value] ? 'g.' + node.value : 'a.' + node.value
		case Lexer.OPERATOR:
			op = this.types[Lexer.NUMBER][node.value]
			if (op && op.js) return op.js.apply(null, node.args.map(n => this.jsExpr(n, globals)))
			throw new Error(`FIXME: unknown operator "${node.value}"`)
		}
	}

	jsFunc(node, globals) {
		/* eslint-disable no-new-func */
		return new Function('g', 'a', 'return ' + this.jsExpr(node, globals))
		/* eslint-enable no-new-func */
	}

	eval(ast, globals, locals) {
		const f = this.jsFunc(ast, globals)
		return f(globals, locals)
	}

	exists(v, node) {
		if (node.type === Lexer.WORD && node.value === v) return true
		if (node.args) {
			if (node.args.filter(n => this.exists(v, n)).length > 0) return true
		}
		return false
	}

	_invert(v, node, resNode) {
		let op
		switch (node.type) {
		case Lexer.WORD:
			if (node.value === v) return resNode
			else throw new Error('FIXME: Internal error!')
		case Lexer.OPERATOR:
			op = this.types[Lexer.NUMBER][node.value] // FIXME: type
			if (node.args.length === 2) {
				let e1 = this.exists(v, node.args[0])
				let e2 = this.exists(v, node.args[1])
				if (e1 && e2) throw new Error('FIXME: multiple use of variable "' + v + '"')
				if (e1) {
					if (op.inv && op.inv[0]) {
						let inv = op.inv[0](node.parser, resNode, node.args[1])
						return this._invert(v, node.args[0], inv)
					} else throw new Error("FIXME: can't invert expression RES" + node.value + 'val')
				}
				if (e2) {
					if (op.inv && op.inv[1]) {
						let inv = op.inv[1](node.parser, resNode, node.args[0])
						return this._invert(v, node.args[1], inv)
					} else throw new Error("FIXME: can't invert expression val" + node.value + 'RES')
				}
			}
			//let op = numberType[node.value]
			//if (op) return op.apply(null, node.args.map(n => generate(globals, n)))
			//throw new Error(`FIXME: unknown operator "${node.value}"`)
		}
	}

	invert(v, node, resVar) {
		return this._invert(v, node, node.parser.symVar(resVar))
	}
}

module.exports = Eval

// vim: ts=4
