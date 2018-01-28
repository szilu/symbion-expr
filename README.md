JavaScript Expression Parser
============================

Description
-----------
This small JavaScript library parses, evaluates expressions and transpiles them to JavaScript functions. It's very flexible, you can define your own grammar with your own types. For example there is an example grammar which handles **big.js** numeric type (grammar/bigjs).

It is also able to solve simple expressions (if the target variable is contained only once and all the operations are invertable).

Installation
------------
NPM:

    npm install symbion-expr

YARN:

    yarn add symbion-expr

Basic usage
-----------
Load a grammar file. The module contains two example files. These are incomplete grammars for testing purposes, so DO NOT use them in production, but you can experiment with them and Use them as a template.
```js
> const SMP = require('symbion-expr/grammar/simple')
```

Parse an expression:
```js
> let ast = SMP.parser.parse('1+2+3')
```

You can regenerate the expression from the AST:
```js
> SMP.evaluator.expression(ast)
'1+2+3'
```

```js
> SMP.evaluator.eval(ast)
6
```

Use variables:
```js
> let ast2 = SMP.parser.parse('3*x+5')
> SMP.evaluator.eval(ast2, {x: 3})
14
```

You can even solve simple expressions:
```js
> let inv = SMP.evaluator.invert('x', ast2, 'r')
> SMP.evaluator.expression(inv)
'(r-5)/3'
SMP.evaluator.eval(inv, {r: 14})
3
```

Lexical analyzer
----------------

The lexical analyzer parses a text into a stream of tokens.

```js
> const { Lexer } = require('symbion-expr')
> let lex = new Lexer('1+2')

> lex.next()
{ type: Symbol(number), value: '1', pos: [ 1, 1 ], ws: '' }
> lex.next()
{ type: Symbol(operator), value: '+', pos: [ 1, 2 ], ws: '' }
> lex.next()
{ type: Symbol(number), value: '2', pos: [ 1, 3 ], ws: '' }
```

The lexer is based on character classes, you can define the grammar like this:
 
```js
const lexerGrammar = {
    operChars: '+-*/^.:%|!?#&<>=',
    wordStartChars: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$',
    wordChars: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$',
    charTokens: '.,:;()[]{}',
    lParens: '([{',
    rParens: ')]}',
    quotes: '"\''
}

lex = new Lexer('1+2', lexerGrammar)
```

Parser
------

The expression parser is based on the [Top Down Operator Precedence parser](http://crockford.com/javascript/tdop/tdop.html) created by [Vaughan Pratt](http://boole.stanford.edu/pratt.html) and [Douglas Crockford](http://www.crockford.com/).

The parser generates an AST for the expression.

**FIXME**: The API is not stable yet, so the Parser is not documented, but you can look at the sample grammar files in the *grammer/* directory.

Eval
----

TODO
----
* [ ] type system
* [ ] function call parser

Test
----

* `cd` to the project directory
* Install dev. dependencies
    * `yarn/npm install`
* Run tests
    * `yarn/npm run lint`
    * `yarn/npm run test`
    * `yarn/npm run test-cover`
