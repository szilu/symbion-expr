'use strict'

class ParseError extends Error {
	constructor(name, message, pos, args) {
		super()
		this.name = name
		this.message = message
		this.pos = pos
		this.args = args
		this.stack = (new Error()).stack
	}
}

module.exports = ParseError

// vim: ts=4
