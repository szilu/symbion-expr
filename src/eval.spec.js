'use strict'

/* eslint-env jest */

const SMP = require('../grammar/simple')
const BIG = require('../grammar/bigjs')
let Big = require('big.js')
Big.DP = 10

describe('Evaluator', function () {
	///////////////
	// Evaluator //
	///////////////

	describe('Expression generation', function () {
		it('42', function () {
			let r = SMP.parser.parse('42')
			expect(SMP.evaluator.expression(r)).toEqual('42')
		})
		it('"text"', function () {
			let r = SMP.parser.parse('"text"')
			expect(SMP.evaluator.expression(r)).toEqual('"text"')
		})
		it('x*2+ -3.5*(x+3)', function () {
			let r = SMP.parser.parse('x*2+ -3.5*(x+3)')
			expect(SMP.evaluator.expression(r)).toEqual('x*2+ -3.5*(x+3)')
		})
		it('5+ -1 + -1 + -1', function () {
			let r = SMP.parser.parse('-5 + -1 + -1 + -1')
			expect(SMP.evaluator.expression(r)).toEqual('-5+ -1+ -1+ -1')
		})
		it('5+ -2 * ( -1 + -1 + -1 ) + - 1', function () {
			let r = SMP.parser.parse('5+ -2 * ( -1 + -1 + -1 ) + - 1')
			expect(SMP.evaluator.expression(r)).toEqual('5+ -2*(-1+ -1+ -1)+ -1')
		})
		it('pi*2', function () {
			let r = SMP.parser.parse('pi*2')
			expect(SMP.evaluator.expression(r)).toEqual('pi*2')
			expect(SMP.evaluator.eval(r, {pi: 3.14})).toEqual(6.28)
		})
	})

	describe('Associativity', function () {
		let expr = '3-2+1'
		it(expr, function () {
			let r = SMP.parser.parse(expr)
			expect(SMP.evaluator.expression(r)).toEqual('3-2+1')
			expect(SMP.evaluator.eval(r)).toEqual(2)
		})
		let expr2 = '2^3^2'
		it(expr2, function () {
			let r = SMP.parser.parse(expr2)
			expect(SMP.evaluator.expression(r)).toEqual('2^3^2')
			expect(SMP.evaluator.eval(r)).toEqual(512)
		})
	})

	describe('Expression invert', function () {
		it('x+2', function () {
			let r = SMP.parser.parse('x+2')
			let inv = SMP.evaluator.invert('x', r, 'r')
			expect(SMP.evaluator.expression(inv)).toEqual('r-2')
		})
		it('3*x+5', function () {
			let r = SMP.parser.parse('3*x+5')
			let inv = SMP.evaluator.invert('x', r, 'r')
			expect(SMP.evaluator.expression(inv)).toEqual('(r-5)/3')
		})
		it('3*(4-2/x)+5', function () {
			let r = SMP.parser.parse('3*(4-2/x)+5')
			let inv = SMP.evaluator.invert('x', r, 'r')
			expect(SMP.evaluator.expression(inv)).toEqual('2/(4-(r-5)/3)')
		})
	})

	describe('Function generation', function () {
		it('42', function () {
			let r = BIG.parser.parse('42')
			expect(BIG.evaluator.jsExpr(r, {})).toEqual('g.Big("42")')
		})
		it('1+2', function () {
			let tree = BIG.parser.parse('1+2')
			let body = BIG.evaluator.jsExpr(tree, {})
			expect(body).toEqual('g.Big("1").add(g.Big("2"))')
		})
	})

	let globals = { Big }
	describe('Function evaluation', function () {
		it('x+2', function () {
			let tree = BIG.parser.parse('x+2')
			let f = BIG.evaluator.jsFunc(tree, globals)

			let locals = { x: Big(42) }
			expect(f(globals, locals).toString()).toEqual('44')
		})
		it('x*2+3.5*(x+3)', function () {
			let tree = BIG.parser.parse('x*2+3.5*(x+3)')
			let f = BIG.evaluator.jsFunc(tree, globals)

			let locals = { x: Big(42) }
			expect(f(globals, locals).toString()).toEqual('241.5')
		})
	})

	describe('Function evaluation with invert', function () {
		function testFuncEvalWithInvert(expr) {
			it(expr, function () {
				let tree = BIG.parser.parse(expr)
				let f = BIG.evaluator.jsFunc(tree, globals)

				let invf = BIG.evaluator.jsFunc(
					//BIG.evaluator.invert('x', tree, BIG.parser, BIG.parser.symVar('r')))
					BIG.evaluator.invert('x', tree, 'r'), globals)

				let locals = { x: Big(42) }
				locals.r = f(globals, locals)
				expect(invf(globals, locals).toString()).toEqual('42')
			})
		}
		testFuncEvalWithInvert('x+42')
		testFuncEvalWithInvert('3*(4-21/x)+5')
	})
	describe('Error handling', function () {
		it('unknown operator', function () {
			let tree
			expect(function () {
				tree = SMP.parser.parse('1<x')
				SMP.evaluator.jsExpr(tree)
			}).toThrow('unknown operator')
		})

		it('division by zero', function () {
			let tree = BIG.parser.parse('4/(x-42)+2')
			//let body = evaluator.jsFunc(tree, globals)
			//let f = Function('g', 'a', 'return ' + body)

			let invf = BIG.evaluator.jsFunc(
				BIG.evaluator.invert('x', tree, 'r'), globals)

			let locals = { x: Big(42) }
			locals.r = Big(2)
			expect(function () { return invf(globals, locals).toString() })
				.toThrow('Division by zero')
		})

		it('multiple use of variable', function () {
			let tree = BIG.parser.parse('x+x')

			//let invTree = invert('x', tree, parser, parser.symVar('r'))
			expect(function () {
				return BIG.evaluator.invert('x', tree, 'r')
			}).toThrow('multiple use of variable')
		})

		it('uninvertible operator right', function () {
			let tree = SMP.parser.parse('1^x')
			expect(function () {
				return SMP.evaluator.invert('x', tree, 'r')
			}).toThrow("can't invert expression val^RES")
		})

		it('uninvertible operator left', function () {
			let tree = SMP.parser.parse('x^1')
			expect(function () {
				return SMP.evaluator.invert('x', tree, 'r')
			}).toThrow("can't invert expression RES^val")
		})
	})
})

// vim: ts=4
