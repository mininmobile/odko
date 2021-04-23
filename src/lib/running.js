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

// evaluate expression
/**
 * @param {Array.<String>} expression
 */
function evaluate(expression, position = undefined) {
	let c = expression.shift();
	switch (c) {
		case "+": return die(reduce((a, b) => a + b));
		case "-": return die(reduce((a, b) => a - b));
		case "*": return die(reduce((a, b) => a * b));
		case "/": return die(reduce((a, b) => a / b));
		// modulo/remainder command
		case "%": {
			let a = parseInt(expression[0]);
			if (isNaN(a)) return die(-1);
			let b = parseInt(expression[1]);
			if (isNaN(b)) return die(-1);
			let c = a % b;
			if (isNaN(c)) return die(-1);
			return die(c);
		}
		// length command
		case "len": return die(expression.join(" ").length);
		// random number generator
		case "rand": case "rnd": case "rng": {
			// get maximum value
			let max = 1;
			if (expression[0]) {
				max = parseInt(expression[0]);
				if (isNaN(max))
					max = 1;
			}
			// return rounded number
			return die(Math.round(Math.random() * max));
		}
		// long log command
		case "log": return die(conLog(expression.join(" ")));
		// clear console command
		case "clear": case "cls": consoleData.text = []; consoleDraw(); return die(1);
		// goto/jump to command
		case "jmp": {
			// get x position
			if (expression[0] === undefined) throw "no X given in jmp";
			let x = parseInt(expression[0]);
			if (isNaN(x)) throw `invalid X given in jmp (${x})`;
			// get y position
			if (expression[1] === undefined) throw "no Y given in jmp";
			let y = parseInt(expression[1]);
			if (isNaN(y)) throw `invalid Y given in jmp (${y})`;
			// throw in queue
			return run.queue.push({ x: x, y: y });
		}
		// special values
		case "nil": return die("nil");
		case "tru": case "true": return die("1");
		case "fal": case "false": return die("-1");
		case "bad": case "error": case "unknown": return die("-1");
		// register assignment
		default: if (c.length == 2) {
			if (isUppercase(c) && expression[0]) {
				if (["=cls"].includes(expression[0].toLowerCase())) {
					switch (expression[0].toLowerCase()) {
						case "=cls": // clear
							run.registers[c] = "";
							return die(0);
					}
				} else if (expression[1]) {
					switch (expression[0]) {
						case "=": // set
							run.registers[c] = expression.splice(1, expression.length).join(" ");
							return die(run.registers[c]);
						case "\"=": // append
							if (run.registers[c] == undefined) run.registers[c] = "";
							run.registers[c] = run.registers[c] + expression.splice(1, expression.length).join(" ");
							return die(run.registers[c]);
						case "'=": // prepend
							if (run.registers[c] == undefined) run.registers[c] = "";
							run.registers[c] = expression.splice(1, expression.length).join(" ") + run.registers[c];
							return die(run.registers[c]);
						case "+=": { // append/add
							let n1 = parseInt(run.registers[c] || 0);
							let n2 = parseInt(expression[1]);
							if (isNaN(n1) || isNaN(n2))
								run.registers[c] = (run.registers[c] || "") + expression[1];
							else
								run.registers[c] = (n1 + n2).toString();
						} return die(run.registers[c]);
						case "*=": { // multiply
							let n1 = parseInt(run.registers[c] || 1);
							let n2 = parseInt(expression[1]);
							if (isNaN(n2))
								throw "cannot multiply by a string";
							else if (isNaN(n1))
								run.registers[c] = (run.registers[c] || "").repeat(n2);
							else
								run.registers[c] = (n1 * n2).toString();
						} return die(run.registers[c]);
						case "-=": { // subtract
							let n1 = parseInt(run.registers[c] || 0);
							let n2 = parseInt(expression[1]);
							if (isNaN(n1) || isNaN(n2))
								throw "this operation cannot be completed with string(s)";
							else
								run.registers[c] = (n1 - n2).toString();
						} return die(run.registers[c]);
						case "/=": { // divide
							let n1 = parseInt(run.registers[c] || 1);
							let n2 = parseInt(expression[1]);
							if (isNaN(n1) || isNaN(n2))
								throw "this operation cannot be completed with string(s)";
							else
								run.registers[c] = (n1 / n2).toString();
						} return die(run.registers[c]);
						case "%=": { // modulo
							let n1 = parseInt(run.registers[c] || 1);
							let n2 = parseInt(expression[1]);
							if (isNaN(n1) || isNaN(n2))
								throw "this operation cannot be completed with string(s)";
							else
								run.registers[c] = (n1 % n2).toString();
						} return die(run.registers[c]);
					}
				}
			}
		}
	}

	switch (c.charAt(0)) {
		// short log command
		case "!":
			return die(conLog(c.substring(1) + " " + expression.join(" ")));
		// no-concat string
		case ".":
			return die(c.substring(1) + (expression.length > 0 ? " " + expression.join(" ") : ""));
		// strings
		case "\"": case "'":
			return die(c.substring(1) + (expression.length > 0 ? " " + expression.join(" ") : ""));
		// conditional
		case "?": {
			// remove nils
			expression = expression.filter(x => x !== "nil");
			let doesNotNeedB = false;
			// get comparator
			let comparator = expression.findIndex(x => {
				if (["==", "!=", ">", "<", ">=", "<=", "&&", "||", "^^"].includes(x))
					return true;
				else if (["nan", "!nan"].includes(x.toLowerCase()))
					return doesNotNeedB = true;
				else
					return false;
			});
			if (comparator == -1) throw "no comparator specified";
			// get first input
			let _a = expression.slice(0, comparator);
			let a = c.substring(1) + (_a.length > 0 ? " " + _a.join(" ") : "");
			a = doesNotNeedB ? a : tNum(a);
			if (a.length == 0) throw "no first input specified";
			// get second input
			let b = tNum(expression.slice(comparator + 1, expression.length).join(" "));
			if (b.length == 0 && !doesNotNeedB) throw "no second input specified";
			// i do not specify default here because it is not needed due the the way the 'get comparator' step is written
			switch (expression[comparator].toLowerCase()) {
				case "==": return die(btn(a === b));
				case "!=": return die(btn(a !== b));
				case ">":  return die(btn(a >  b));
				case "<":  return die(btn(a <  b));
				case ">=": return die(btn(a >= b));
				case "<=": return die(btn(a <= b));
				case "&&": return die(btn(ntb(a) && ntb(b)));
				case "||": return die(btn(ntb(a) || ntb(b)));
				case "^^": return die(ntb(a) ^ ntb(b));
				// special/singular conditions
				case "nan": return die(btn(isNaN(parseInt(a))));
				case "!nan": return die(btn(!isNaN(parseInt(a))));
			}
		}
		// by default is just number value
		default:
			let n = parseInt(c);
			if (!isNaN(n))
				return die(c);
			else
				return die("-1");
	}

	function die(v) {
		if (typeof(v) == "number")
			v = v.toFixed(0);

		if (position)
			elements.columns.children[position.x].children[position.y]
				.setAttribute("data-returns", v.toString());

		return v.toString();
	}

	function reduce(callback) {
		let _x = expression
			.map(x => x == "nil" ? 0 : parseInt(x))
			.filter(x => !isNaN(x));

		if (_x.length == 0)
			_x = [ -1 ];

		return _x.reduce(callback);
	}
}

// run from coords
function runFrom(_x, _y, values = {}, overrideConnections = false, callStack = 0) {
	if (callStack >= 2000) {
		run.going = false;
		return conLog(`![x${_x}y${_y}] call stack limit exceeded`);
	}
	if (callStack == 0) run.going = true;

	const itoa = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]; // index to alphabet
	let startingBlock = table[_x][_y]; // sanity
	let toEval; // blocks to evaluate before moving on to next column
	// temp table
	let t = new Array(_x + 2);
	t = t.fill([], 0, _x + 1);
	// calculate starting value
	if (callStack == 0) {
		let { expression } = parse(startingBlock);
		toEval = getConnections(_x, _y);
		if (["o", "k", "c", "m"].includes(startingBlock.v.charAt(0)) && _x == 0)
			t[_x][_y] = _y.toString();
		else
			t[_x][_y] == evaluate(expression);
	} else {
		toEval = [ _y ];
	}
	// go go go
	for (let x = _x + (callStack == 0 ? 1 : 0); x < table.length; x++) {
		t[x] = []; // initialize new temp table column
		let n = []; // newToEval
		for (let i = 0; i < toEval.length; i++) {
			let y = toEval[i]; // sanity
			let _e = table[x][y].v;
			let _fuckOff = false // do not run blocks connected to this block
			// don't replace assignee register with itself
			let registerToSkip = "";
			if (isUppercase(_e.substring(0, 2)) && _e.length >= 5 && (_e.charAt(4) == "=" || _e.charAt(3) == "="))
				registerToSkip = _e.substring(0, 2);
			// substitute with registers
			Object.keys(run.registers).forEach(register => {
				if (register == registerToSkip) return;
				_e = _e.replace(new RegExp(register, "g"), " " + run.registers[register] + " ")
			});
			// parse
			let _parsed = parse({ v: _e, c: table[x][y].c }, !(overrideConnections == false && x == 1)),
			expression = _parsed.expression,
			connections = x == 1 ? (overrideConnections || _parsed.connections) : _parsed.connections;
			let _c = expression[0].charAt(0);
			// substitute with values
			Object.keys(values).forEach((v) => {
				// substitutions in expression
				expression = expression.map(x =>
					x == v ? values[v].toString() : x);
				if (_c == "?")
					expression = expression.map(x =>
						x == "?" + v ? "?" + values[v].toString() : x);
			});
			// if string
			if ((_c == "\"" || _c == "'") && x > 1) {
				let temp = [];
				// concatenate connections
				connections.forEach((c) => { // different quotes different directions
					temp[_c == "\"" ? "push" : "unshift"](t[x - 1][c]);
				});
				// nil == empty string
				temp = temp.filter(x => x !== "nil");
				// different quotes different directions
				temp[_c == "\"" ? "push" : "unshift"](expression.join(" ").substring(1));
				// return
				expression =
					(_c + temp.join(""))
						.trimEnd().split(" ");
			} else if (_c !== "\"" && _c !== "'") {
				// substitute with connections
				connections.forEach((c, i) => {
					let input = t[x - 1][c] || "-1";
					// substitutions in expression
					expression = expression.map(x =>
						(i == 0 ? (x == "A" || x == "_") : (x == itoa[i])) ? input : x);
					if (_c == "?")
						expression = expression.map(x =>
							(i == 0 ? (x == "?A" || x == "?_") : (x == "?" + itoa[i])) ? "?" + input : x);
				});
			}
			// evaluate
			try {
				t[x][y] = evaluate(expression);
			} catch (e) {
				if (typeof e !== "string")
					console.error(e);

				return conLog(`![x${x}y${y}] ` + e);
			}

			let _n = _fuckOff ? [] : getConnections(x, y);

			if (_c == "?")
				if (t[x][y] == "1" && _n[0] !== undefined)
					_n = [ _n[0] ];
				else if (_n[1] !== undefined)
					_n = [ _n[1] ];
				else
					_n = [];

			n = n.concat(_n);
		}
		if (n.length == 0) break;
		// toEval = unique newToEval connections
		toEval = n.filter((v, i) => n.indexOf(v) == i);
	}

	if (run.queue.length > 0) {
		let q = run.queue.shift();
		runFrom(q.x, q.y, q.x == 1 ? values : {}, false, callStack + 1);
	}

	run.going = false;
	consoleDraw();
}

// locate all event handlers
function findEvents() {
	let sum = 0;
	// clear events
	events = [];
	// loop over every column
	for (let x = 0; x < table.length; x++) {
		let col = table[x];
		// loop over every row
		for (let y = 0; y < col.length; y++) {
			let row = table[x][y];
			sum++;
			if (row.t.length == 0) continue;
			// if row is an event
			if (row.t[0].type == "event") {
				// get event data
				let _e = row.t[0].value;
				// combine event data with event metadata
				let e = {
					type: _e.type,
					direction: _e.direction,
					button: _e.button,
					modifiers: _e.modifiers,
					origin: { x, y },
					activates: table[x + 1] == undefined ? [] :
						table[x + 1]
							.map((x, i) =>x.c.includes(y) ? i : undefined)
							.filter((x) => x != undefined),
				}
				// add to events list
				events.push(e);
			}
		}
	}

	conLog("iterated over " + sum + " blocks")
	conLog("found " + events.length + " events")
	console.log("iterated over", sum, "blocks. found", events.length, "events", events);
}
