// parse expression
function parse(block) {
	return {
		expression: block.v.split(/ +/g).filter(x => x.length > 0),
		connections: block.c.sort((a, b) => a - b),
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
		if (_x == 1)
			if (["o", "k", "c"].includes(table[0][c].v.charAt(0)))
				return;

		let input = test(_x - 1, c);

		// index to alphabet
		let itoa = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"][i];

		expression = expression.map(x =>
			(connections.length == 1 ? (x == "A" || x == "_") : (x == itoa))? input : x);
	});

	return evaluate(expression, { x: _x, y: _y });
}
