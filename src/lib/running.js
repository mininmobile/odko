// parse expression
function parse(block) {
	return {
		expression: block.v.split(/ +/g).filter(x => x.length > 0),
		connections: block.c.sort((a, b) => a - b),
	}
}

// parse event
function parseEvent(block, y) {
	let activates = getConnections(0, y);

	let event = block.v.split(/ +/g).filter(x => x.length > 0);
	let e = event.shift().toLowerCase();
	switch (e) {
		case "onRun": return {
			type: "onRun",
			activates: activates,
			origin: y,
			id: isNaN(parseInt(event[0])) ? 0 : parseInt(event[0]),
		}

		// really compressed events
		default: {
			switch (e.charAt(0)) {
				// onKeyUp & onKeyDown
				case "k": if (e.charAt(1) == "_" || e.charAt(1) == "-") {
					// placeholder variables
					let releasing, key;
					let shift = null,
						ctrl = null,
						alt = null;
					// parse
					let fuck = false;
					for (let i = 1; i < block.v.length; i++) {
						let c = block.v.charAt(i);
						if (i == 1) {
							// keyDown or keyUp event
							releasing = c == "_" ? false : true;
						} else if (i == 2) {
							// if no character provided
							if (key = c) continue;
							else { fuck = i; break }
						} else if (i == 3) {
							// goof check
							if (c !== " ")
								{ fuck = i; break }
						}
						// modifiers
						else if (i == 4) {
							if (c == "1") shift = true;
							else if (c == "0") shift = false;
							else if (c == "?") shift = null;
							else { fuck = i; break };
						} else if (i == 5) {
							if (c == "1") ctrl = true;
							else if (c == "0") ctrl = false;
							else if (c == "?") ctrl = null;
							else { fuck = i; break };
						} else if (i == 6) {
							if (c == "1") alt = true;
							else if (c == "0") alt = false;
							else if (c == "?") alt = null;
							else { fuck = i; break };
						}
					}
					// self explanatory
					if (fuck !== false) {
						throw `![@x0y${y}] error at position ${fuck + 1}`;
					} else return {
						type: "onKey" + (releasing ? "Up" : "Down"),
						key: key,
						modifiers: { shift: shift, ctrl: ctrl, alt: alt },
						activates: activates,
						origin: y,
						id: 0,
					}
				}

				// onCodeUp & onCodeDown
				case "c": if (e.charAt(3) == "_" || e.charAt(3) == "-") {
					// placeholder variables
					let releasing, codeA, codeB;
					let shift = null,
						ctrl = null,
						alt = null;
					// parse
					let fuck = false;
					for (let i = 1; i < block.v.length; i++) {
						let c = block.v.charAt(i);
						if (i == 1) {
							codeA = c;
							// if valid character provided
							if (!isNaN(parseInt(c, 16))) continue;
							else { fuck = i; break }
						} else if (i == 2) {
							codeB = c;
							// if valid character provided
							if (!isNaN(parseInt(c, 16))) continue;
							else { fuck = i; break }
						} else if (i == 3) {
							// codeDown or codeUp event
							releasing = c == "_" ? false : true;
						}
						// modifiers
						else if (i == 4) {
							if (c == "1") shift = true;
							else if (c == "0") shift = false;
							else if (c == "?") shift = null;
							else { fuck = i; break };
						} else if (i == 5) {
							if (c == "1") ctrl = true;
							else if (c == "0") ctrl = false;
							else if (c == "?") ctrl = null;
							else { fuck = i; break };
						} else if (i == 6) {
							if (c == "1") alt = true;
							else if (c == "0") alt = false;
							else if (c == "?") alt = null;
							else { fuck = i; break };
						}
					}
					// self explanatory
					if (fuck !== false) {
						throw `![x0y${y}] error at position ${fuck + 1}`;
					} else return {
						type: "onCode" + (releasing ? "Up" : "Down"),
						code: codeA + codeB,
						modifiers: { shift: shift, ctrl: ctrl, alt: alt },
						activates: activates,
						origin: y,
						id: 0,
					}
				}

				default: throw `![x0y${y}] unknown event "${e}"`;
			}
		}
	}
}

// evaluate expression
function evaluate(expression, position) {
	let c = expression.shift();
	switch (c) {
		case "+": return die(reduce((a, b) => a + b));
		case "-": return die(reduce((a, b) => a - b));
		case "*": return die(reduce((a, b) => a * b));
		case "/": return die(reduce((a, b) => a / b));

		case "nil": return die("nil");

		default: {
			let n = parseInt(c);
			if (!isNaN(n)) {
				return die(c);
			} else {
				return die(-1);
			}
		}
	}

	function die(v) {
		if (position) {
			if (typeof(v) == "number")
			v = v.toFixed(0);

			elements.columns.children[position.x].children[position.y]
				.setAttribute("data-returns", v.toString());
		}

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

// testing in default mode
function test(_x, _y) {
	let { expression, connections } = parse(table[_x][_y]);

	connections.forEach((c, i) => {
		let input;
		// if connected to an event
		if (_x == 1 && ["o", "k", "c"].includes(table[0][c].v.charAt(0)))
			input = c;
		else
			input = test(_x - 1, c);

		// index to alphabet
		let itoa = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"][i];

		expression = expression.map(x =>
			(connections.length == 1 ? (x == "A" || x == "_") : (x == itoa))? input : x);
	});

	return evaluate(expression, { x: _x, y: _y });
}
