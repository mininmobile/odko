class Token {
	/**
	 * @param {"thing" | "otherThing"} type
	 * @param {any} value
	 */
	constructor(type, value = null) {
		this.type = type;
		this.value = value;
	}
}

// tokenize block
function parse(expression) {
	return [ "drain", "gang" ];
}

// parse event
// // onRun
// {
//     type: "onRun",
//     activates: activates,
//     origin: y,
//     id: isNaN(parseInt(event[0])) ? 0 : parseInt(event[0]),
// }

// // onKeyUp & onKeyDown/onMouseUp & onMouseDown
// {
//     type: e.charAt(0) == "k" ? "onKey" : "onMouse",
//     direction: releasing,
//     key: any ? "any" : (e.charAt(0) == "k" ? key : undefined),
//     button: any ? "any" : (e.charAt(0) == "m" ? parseInt(key) : undefined)
//     modifiers: { shift: shift, ctrl: ctrl, alt: alt },
//     activates: activates,
//     origin: y,
//     id: 0,
// }

// // onCodeUp & onCodeDown
// {
//     type: "onCode",
//     direction: releasing,
//     code: any ? "any" : (parseInt(codeA + codeB, 16)),
//     modifiers: { shift: shift, ctrl: ctrl, alt: alt },
//     activates: activates,
//     origin: y,
//     id: 0,
// }

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

// find event/event handler almost
/**
 * @param {(0|1|2)} type 0: keyboard, 1: mouse, 2: onRun
 * @param {(KeyboardEvent|MouseEvent)} event
 * @param {boolean} releasing
 */
function findEvents(type, event, releasing = false) {
	let events = [];
	let values = {};
	let count = 0;

	if (type == 2) { // onRun events
		// check if event types match
		events = run.events
			.filter(e => e.type == "onRun")
			.sort((a, b) => a.id - b.id);
	} else { // keyboard + mouse events
		events = run.events.filter(e => {
			// check if event matches search direction
			if (e.direction == releasing) {
				let m = e.modifiers;
				// check if modifiers match
				if ((m.shift == event.shiftKey && m.shift !== null) || m.shift == null)
					if ((m.ctrl == event.ctrlKey && m.ctrl !== null) || m.ctrl == null)
						if ((m.alt == event.altKey && m.alt !== null) || m.alt == null)
						// "any" events
						if (e.type == "onCode" && e.code == "any" && type == 0) { // any code
							return match({"C": event.which});
						} else if (e.type == "onKey" && e.key == "any" && type == 0) { // any key
							return match({"K": event.key});
						} else if (e.type == "onMouse" && e.button == "any" && type == 1) { // any mouse button
							return match({"B": event.button});
						// check if keys/buttons match
						} else if (e.type == "onKey" && type == 0) {
							if (event.key.toLowerCase() == e.key.toLowerCase()) return match();
						} else if (e.type == "onCode" && type == 0) {
							if (event.which == e.code) return match();
						} else if (e.type == "onMouse" && type == 1) {
							if (event.button == e.button) return match({
								"X": Math.floor(event.offsetX / ch(1)),
								"Y": Math.floor(event.offsetY / em(1)),
								"M": event.offsetX,
								"N": event.offsetY,
							});
						}
			}
			// if no match found, fuck off
			return false;
		});
	}

	function match(vs) {
		if (vs)
			values[count] = vs;

		count++;
		return true;
	}

	Object.keys(values).forEach(v =>
		events[v].values = values[v]);

	return events;
}
