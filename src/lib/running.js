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
}

// tokenize block
/**
 * @param {string} expression
 * @returns {Array.<Token>}
 */
function parse(expression = "") {
	let tokens = [];

	let mode = 0; // normal, conditional, log alias/raw strings
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
				} else if (i == 0 && "!\"'.".includes(c)) { // if this is a log alias or a raw string
					pushTemp(c);
					pushToken();
					changeMode(2);
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
			case 2: { // submode 0: log alias/raw strings
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

// locate all event handlers
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
		if (e.type == "char" || e.type == "key") {
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
