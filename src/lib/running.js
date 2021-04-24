/**
 * @typedef {Object} EventData
 * @property {string} type
 * @property {string} direction
 * @property {string} button
 * @property {Object} modifiers
 * @property {boolean} modifiers.shift
 * @property {boolean} modifiers.ctrl
 * @property {boolean} modifiers.alt
 */

class Token {
	/**
	 * @param {string} raw raw token string
	 * @param {"nil" | "number" | "concatinator" | "string" | "comparator" | "command" | "assignment" | "register" | "connection" | "event"} type how arguments are calculated/type of data
	 * @param {any | string | number | EventData} value options/data (if any)
	 */
	constructor(raw, type, value = null) {
		this.raw = raw;
		this.type = type;
		this.value = value;
	}

	toString() {
		return this.raw;
	}
}

// tokenize block
/**
 * @param {string} expression
 * @returns {Array.<Token>}
 */
function parse(expression = "") {
	let tokens = [];

	let mode = 0; // normal, conditional, raw strings/concatinators
	let submode = 0; // stage 1; stage 2; etc.
	let t = "";
	for (let i = 0; i <= expression.length; i++) {
		let c = expression.charAt(i) || "LAST";

		switch (mode) {
			case 0: { // normal
				if (c == "LAST") {
					pushToken();
				} else if (c == " ") {
					pushToken();
					// if potential register assignment upcoming
					if (i == 2 && tokens[0].type == "register") {
						// check for upcoming potential register assignment
						let potentialAssignment = isAssignment(expression.charAt(3) + expression.charAt(4));
						// if there is one push it and skip forward
						if (potentialAssignment) {
							pushToken(potentialAssignment);
							i += 2;
						}
					}
				} else if ((i == 1 || i == 3) && (c == "_" || c == "-")) { // if this is a potential input event
					// determine direction of event
					let direction = c == "_" ? "down" : "up";
					// determine type of event
					let event = expression.charAt(0);
					let _continue = false;
					if (event == "k") { event = "key"; _continue = true; } else
					if (event == "m") { event = "mouse"; _continue = true; } else
					if (event == "c") { event = "code"; _continue = true; }


					// proper syntax reinforcement
					if (event == "key" || event == "mouse")
						if ((expression.charAt(3) || " ") != " ")
							_continue = false;

					if (_continue) {
						// determine button of event
						let button = null;
						_continue = false;
						if (event == "key") {
							button = expression.charAt(2) || "none";
							_continue = button != "none";
						} else if (event == "mouse") {
							button = expression.charAt(2) || "none";
							_continue = button == "0" || button == "1" || button == "2" || button == "*";
						} else if (event == "code") {
							let _c1 = expression.charAt(1) || "X";
							let _c2 = expression.charAt(2) || "X";
							button = parseInt(_c1 + _c2, 16);
							_continue = !isNaN(button);
						}

						if (_continue) {
							// determine modifiers of event
							let _continue = true;
							let shift = expression.charAt(4) || "?";
							if (!(shift == "0" || shift == "1" || shift == "?")) _continue = false;
							let ctrl = expression.charAt(5) || "?";
							if (!(ctrl == "0" || ctrl == "1" || ctrl == "?")) _continue = false;
							let alt = expression.charAt(6) || "?";
							if (!(alt == "0" || alt == "1" || alt == "?")) _continue = false;

							if (_continue) {
								let token = new Token(expression, "event", {
									type: event,
									direction: direction,
									button: button == "*" ? "any" : button,
									modifiers: { shift, ctrl, alt },
								});

								console.debug(expression, token.value);
								tokens.push(token);
								i = expression.length + 1;
								t = "";
							} else {
								pushTemp(c);
							}
						} else {
							pushTemp(c);
						}
					} else {
						pushTemp(c);
					}
				} else if (i == 0 && c == "?") { // if this is a conditional
					pushTemp("?");
					pushToken();
					changeMode(1);
				} else if (i == 0 && (c == "\"" || c == "'" || c == ".")) { // if this is a concatinator
					pushTemp(c);
					pushToken();
					changeMode(2);
				} else if (i == 0 && c == "!") {
					pushTemp(c);
					pushToken();
				} else if (i == 2 && isRegister(t)) { // if this is a potential register assignment
					// if this just a set assignment
					let isOne = c == "=";
					// if this is another assignement that's two characters long
					// only do it if it is not just a set assignment
					let isTwo = false;
					if (!isOne)
						isTwo = isAssignment(c + expression.charAt(3));

					if (isOne || isTwo) { // if this is a register assignment
						pushToken();
						pushToken(isOne || isTwo);
						i += 1;
						if (isTwo == "\"=" || isTwo == "'=")
							changeMode(2, 1);
					} else // put da char in da temp
						pushTemp(c);
				} else // put da char in da temp
					pushTemp(c);
			} break;
			case 1: { // conditional
				if (submode == 0 && " =!<>&|^".includes(c)) {
					pushToken();
					changeMode(1, 1);
					if (c != " ") pushTemp(c);
				} else if (submode == 1 && !("=!<>&|^".includes(c))) {
					if (t == "!" && expression.substring(i, i + 3).toLowerCase() == "nan") {
						pushToken("!NaN");
						i += 2;
					} else {
						pushToken();
						if (c != " ") pushTemp(c);
					}
					changeMode(1, 2);
				} else if ((submode == 2 && c == " ") || c == "LAST") {
					if (c != " " && c != "LAST") pushTemp(c);
					pushToken();
				} else // put da char in da temp
					pushTemp(c);
			} break;
			case 2: { // submode 0: raw strings
			          //         1: register assignment prepend/append
				if (c == "LAST")
					pushToken(false, true);
					if (submode == 1) {
						// TODO: remove trailing space if space before assignment operator
					}
				else // put da char in da temp
					pushTemp(c);
			} break;
			default: throw new Error("ParseError: Unknown Parsing Mode Entered");
		}
	}

	let returns = tokens.length == 0 ? [ new Token("nil") ] : tokens;
	console.log(expression, "=>", returns);
	return returns;

	function pushToken(force = false, forceString = false) {
		if (t.length > 0 || typeof(force) == "string") {
			let token = forceString ?
				new Token(force || t, "string", force || t)
				: tokenize(force || t);
			console.debug(t || force, token);
			tokens.push(token);
		} else if (force) {
			let token = tokenize("nil");
			console.debug(t, token);
			tokens.push(token);
		}

		t = "";
	}

	function pushTemp(c) {
		t += c;
	}

	function changeMode(newMode = 0, newSubmode = 0) {
		mode = newMode;
		submode = newSubmode;
	}
}

// return token type + value of a potential token string
function tokenize(potentialToken) {
	let raw = potentialToken;
	let type = "any"; // how arguments are calculated
	let value = null; // options (if any)

	switch (potentialToken.toLowerCase()) {
		// special/placeholder values
		case "nil":                 type = "nil"; break;
		case "true": case "tru":    type = "number"; value = 1; break;
		case "false": case "fal":   type = "number"; value = 0; break;
		case "unknown": case "error": case "bad": type = "number"; value = -1; break;
		// concatinators
		case "\"": type = "concatinator"; value = "ttb"; break;
		case "'":  type = "concatinator"; value = "btt"; break;
		case ".":  type = "concatinator"; value = "none"; break;

		// CONDITIONAL COMPARATORS

		// two input conditional
		case "==": type = "comparator"; value = "equal"; break;
		case "!=": type = "comparator"; value = "notEqual"; break;
		case ">":  type = "comparator"; value = "greater"; break;
		case "<":  type = "comparator"; value = "lesser"; break;
		case ">=": type = "comparator"; value = "greaterEqual"; break;
		case "<=": type = "comparator"; value = "lesserEqual"; break;
		case "&&": type = "comparator"; value = "and"; break;
		case "||": type = "comparator"; value = "or"; break;
		case "^^": type = "comparator"; value = "XOR"; break;
		// single input conditional
		case "nan": type = "comparator"; value = "NaN"; break;
		case "!nan": type = "comparator"; value = "notNaN"; break;

		// COMMANDS

		// arithmetic/mathematical commands
		case "+":   type = "command"; value = "add"; break;
		case "-":   type = "command"; value = "subtract"; break;
		case "*":   type = "command"; value = "multiply"; break;
		case "/":   type = "command"; value = "divide"; break;
		case "%":   type = "command"; value = "modulo"; break;
		case "len": type = "command"; value = "length"; break;
		case "rnd": case "rng": case "rand":
		            type = "command"; value = "random"; break;
		// console commands
		case "clear": case "cls":
		            type = "command"; value = "clear"; break;
		case "log": case "!":
		            type = "command"; value = "log"; break;
		// logic commands
		case "jmp": type = "command"; value = "jump"; break;
		case "?":   type = "command"; value = "conditional"; break;

		// REGISTER ASSIGNMENT

		case "=":   type = "assignment"; value = "set"; break;
		case "\"=": type = "assignment"; value = "append"; break;
		case "'=":  type = "assignment"; value = "prepend"; break;
		case "+=":  type = "assignment"; value = "add"; break;
		case "-=":  type = "assignment"; value = "subtract"; break;
		case "*=":  type = "assignment"; value = "multiply"; break;
		case "/=":  type = "assignment"; value = "divide"; break;
		case "%=":  type = "assignment"; value = "modulo"; break;

		// EVENTS

		case "onrun": type = "event"; value = "onRun"; break;

		// STRINGS / NUMBERS / CONNECTIONS / REGISTERS

		case "_": type = "connection"; value = "A"; break;

		default: {
			// is a connection or a register
			if (potentialToken.length == 1 || potentialToken.length == 2) {
				let canBeConnection = isAlphabetic(potentialToken, true);

				if (canBeConnection && potentialToken.length == 2) {
					if (isAlphabetic(potentialToken.charAt(1), true)) {
						// is a register
						type = "register"; value = potentialToken; break;
					}
				} else if (canBeConnection) {
					// is a connection
					type = "connection"; value = potentialToken; break;
				}
			}

			// is a number
			if (!isNaN(potentialToken)) {
				type = "number"; value = parseInt(potentialToken); break;
			}

			// fuck it, it's a string
			type = "string"; value = potentialToken;
		}
	}

	return new Token(raw, type, value);
}

// locate and filter event handlers
function findEvents() {
	// statistics
	let sumAll = 0;
	let sumEv = 0;
	// clear events
	events = [];
	eventsFiltered = {
		keyboardDown: [],
		keyboardUp: [],
		mouseDown: [],
		mouseUp: [],
		run: [],
	}
	// loop over every column
	for (let x = 0; x < table.length; x++) {
		let col = table[x];
		// loop over every row
		for (let y = 0; y < col.length; y++) {
			let row = table[x][y];
			sumAll++;
			if (row.t.length == 0) continue;
			// if row is an event
			let eventToken = row.t[0];
			if (eventToken.type == "event") {
				sumEv++;
				if (typeof(eventToken.value) == "string") { // if dumb event
					let e = {
						type: eventToken.value,
						origin: { x, y },
						activates: getConnected(x, y),
					}
					// add to events list
					events.push(e);
					eventsFiltered.run.push(e);
					console.log("dumb", eventToken);
				} else { // if input event
					// get event data
					let _e = row.t[0].value;

					pushEvent(x, y, _e);
				}
			}
		}
	}

	conLog("iterated over " + sumAll + " blocks")
	conLog("found " + sumEv + " events")
	console.log("iterated over", sumAll, "blocks. found", sumEv, "events =>", eventsFiltered);

	// filter events
	function pushEvent(x, y, _e) {
		// combine event data with event metadata
		let e = {
			type: _e.type,
			direction: _e.direction,
			button: _e.button,
			modifiers: _e.modifiers,
			origin: { x, y },
			activates: getConnected(x, y),
		}
		// add to events list
		events.push(e);
		// filter
		if (e.type == "code" || e.type == "key") {
			if (e.direction == "down") {
				eventsFiltered.keyboardDown.push(e);
			} else {
				eventsFiltered.keyboardUp.push(e);
			}
		} else if (e.type == "mouse") {
			if (e.direction == "down") {
				eventsFiltered.mouseDown.push(e);
			} else {
				eventsFiltered.mouseUp.push(e);
			}
		}
	}

	function getConnected(x, y) {
		return table[x + 1] == undefined ? [] :
				table[x + 1]
					.map((x, i) =>x.c.includes(y) ? i : undefined)
					.filter((x) => x != undefined);
	}
}

// run event handler
function runEvent(e) {
	if (e.type == "keydown") {
		eventsFiltered.keyboardDown
			.filter(ev => ev.type == "key" ?
				ev.button == e.key || ev.button == "any" :
				ev.button == e.which).forEach(x => executeEvent(x, e));
	} else if (e.type == "keyup") {
		eventsFiltered.keyboardUp
			.filter(ev => ev.type == "key" ?
				ev.button == e.key || ev.button == "any" :
				ev.button == e.which).forEach(x => executeEvent(x, e));
	} else if (e.type == "mousedown") {
		eventsFiltered.mouseDown
			.filter(ev => ev.button == "any" ||
				(ev.button == "0" && e.button == 0) ||
				(ev.button == "1" && e.button == 1) ||
				(ev.button == "2" && e.button == 2)).forEach(x => executeEvent(x, e));
	} else if (e.type == "mouseup") {
		eventsFiltered.mouseUp
			.filter(ev => ev.button == "any" ||
				(ev.button == "0" && e.button == 0) ||
				(ev.button == "1" && e.button == 1) ||
				(ev.button == "2" && e.button == 2)).forEach(x => executeEvent(x, e));
	}
}

// execute event
/**
 * @param {OdkoEvent} event
 */
function executeEvent(event, e) {
	// get what event returns
	let returns = { "A": 0 }
	if (event.type == "key") {
		returns = { "A": e.key }
	} else if (event.type == "char") {
		returns = { "A": e.which }
	} else if (event.type == "mouse") {
		returns = {
			"A": e.button,
			"X": Math.floor(e.offsetX / ch(1)),
			"Y": Math.floor(e.offsetY / em(1)),
			"M": e.offsetX,
			"N": e.offsetY,
		}
	}
	// run blocks connected to that point
	runFrom(event.origin.x, event.origin.y, returns, event.activates);
}

function runFrom(_x, _y, inputs = null, overrideNext = null, callstack = 0) {
	if (callstack >= 2000) {
		run.going = false;
		return conLog(`![x${_x}y${_y}] call stack limit exceeded`);
	}

	run.going = true;

	// sanity
	let startingBlock = table[_x][_y];
	// blocks to evaluate before moving on to next column
	let toEval;
	// temporary table
	let t = new Array(_x + 2);
	t = t.fill([], 0, _x + 1);
	// calculate starting value
	if (callstack == 0) {
		// get blocks to activate
		toEval = overrideNext || getConnections(_x, _y);
		// if this is an event
		if (inputs != null)
			// pass through the returned information
			Object.keys(inputs).forEach(input =>
				t[_x][atoi(input)] = inputs[input]);
		else
			// else just pass through this block evaluated
			t[_x][_y] = evaluate(startingBlock).out;
	} else {
		toEval = [ _y ];
	}
	// loop through all (connected) blocks
	for (let x = _x + (callstack == 0 ? 1 : 0); x < table.length; x++) {
		t[x] = []; // initialize new temp table column
		let n = []; // newToEval

		for (let i = 0; i < toEval.length; i++) {
			let y = toEval[i]; // sanity
			let _n = getConnections(x, y); // connections from this block

			// evaluate
			try {
				// pass in tokens, temp table, and potential newToEval
				let _ = evaluate(table[x][y].t, {x,y}, t, _n);
				// use the values you got from the evaluatemennt
				_n = _.toEval;
				t[x][y] = _.out;
			} catch (e) {
				if (typeof(e) !== "string")
					console.error(e);

				run.going = false;
				return conLog(`![x${x}y${y}] ` + e);
			}

			// combine newToEval with other newToEvals
			n = n.concat(_n);
		}
		if (n.length == 0) break;
		// toEval = unique newToEval connections
		toEval = n.filter((v, i) => n.indexOf(v) == i);
	}

	// if there is stuff to be done in the queue then do that before quitting the thread
	if (run.queue.length > 0) {
		let q = run.queue.shift();
		runFrom(q.x, q.y, q.x == 1 ? values : {}, false, callstack + 1);
	}

	run.going = false;
	consoleDraw();
}

/**
 * @param {Array.<Token>} _tokens
 * @param {Point} p x/y coordinate
 * @param {Array.<Array.<string>>} t outputs/temporary table
 * @param {Array.<number>} c output connections
 * @returns {EvalResult}
 */
function evaluate(_tokens, p, t, _c) {
	let tokens = _tokens.slice();
	let c = _c;

	// get register/connections values
	for (let i = 0; i < tokens.length; i++) {
		let token = tokens[i];
		// if connection/register
		if (token.type == "connection") { // if connection
			// get connection
			let _y = getConnections(p.x, p.y, false)[atoi(token.value)];
			let referenced = t[p.x - 1][_y];
			// check if valid
			if (_y != undefined)
				// if valid then replace connection with the stuff
				tokens[i] = new Token(referenced, "string", referenced);
		} else if (token.type == "register") {
			let referenced;
			// get register/check if valid
			if (referenced = run.registers[token.value])
				// if valid then replace register with the stuff
				tokens[i] = new Token(referenced, "string", referenced);
		}
	}

	// main token that drives the rest of the expression
	let driveToken = tokens.shift();
	switch (driveToken.type) {
		case "command": switch (driveToken.value) {
			// arithmetic operations
			case "add": return die(reduce((a, b) => a + b));
			case "subtract": return die(reduce((a, b) => a - b));
			case "multiply": return die(reduce((a, b) => a * b));
			case "divide": return die(reduce((a, b) => a / b));
			// modulo operation
			case "modulo": {
				// exit if not enough args
				if (tokens[0] == undefined || tokens[1] == undefined)
					return die(-1);
				// exit if args aren't numbers
				if (isNaN(tokens[0].raw) || isNaN(tokens[1].raw))
					return die(-1);
				// calculate result
				let result = Math.abs(parseInt(tokens[0].raw) % parseInt(tokens[0].raw));
				// exit with nil if result is NaN
				if (isNaN(result))
					return die("nil");
				else
					return die(result);
			}
			// length command
			case "length": return die(tokens.map(x => x.raw).join(" ").length);
			// random command
			case "random": {
				// get maximum value
				let max = 1;
				if (tokens[0])
					if (!isNaN(tokens[0].raw))
						max = parseInt(tokens[0].raw);
				// return rounded number
				return die(Math.round(Math.random() * max));
			}
			// log command
			case "log":
				return die(conLog(tokens.map(x => x.raw).join(" ")));
			// clear command
			case "clear":
				consoleData.text = []; consoleDraw();
				return die(1);

			default:
				throw new Error("EvaluateError: unknown command '" + driveToken.value + "'");
		}

		case "concatinator": {
			// get current string
			// used by all concatinators
			let string = tokens[0] ? tokens[0].raw : "";

			let concatinator = driveToken.value; // sanity
			if (concatinator == "ttb" || concatinator == "btt") { // if ordered
				// get connected strings
				// used by ordered concatinators
				let strings = t[p.x - 1].filter(x => x != undefined && x != null);
				strings.push(string);
				// order strings
				if (concatinator == "btt")
					strings.reverse();
				// returns concatenated strings
				return die(strings.join(" "));
			} else if (concatinator == "none") {
				// just return the current string
				return die(string);
			} else throw new Error("EvaluateError: unknown concatinator '" + concatinator + "'");
		}

		case "string":
		case "number":
			return die(driveToken.value);

		default:
			return die("nil");
	}

	// always exit with value as string
	function die(v) { // v is for value
		if (typeof(v) == "number")
			v = v.toFixed(0);

		return {
			out: v.toString(),
			toEval: c,
		}
	}

	// for the math commands
	function reduce(callback) {
		let _x = tokens
			.map(x => isNaN(x.raw) ? "nil" : parseInt(x.raw))
			.filter(x => typeof(x) == "number");

		if (_x.length == 0)
			_x = [ -1 ];

		return _x.reduce(callback);
	}
}

/**
 * @typedef {Object} EvalResult
 * @property {string} out
 * @property {Array.<number>} toEval
 */
