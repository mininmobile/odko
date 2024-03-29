// calculate connections from current block
function getConnections(x, y, forwards = true) {
	let connections = [];

	if (!forwards)
		return table[x][y].c;

	(table[x + 1] || []).forEach((r, i) => {
		if (r.c.includes(y))
			connections.push(i);
	});

	return connections;
}

// force reparse all blocks
function reparseAll() {
	for (let x = 0; x < table.length; x++) {
		let col = table[x];
		for (let y = 0; y < col.length; y++) {
			table[x][y].t = parse(table[x][y].v);
		}
	}
}

// check if potential token is a register reference
function isRegister(t) {
	if (t.length == 2 && isAlphabetic(t, true))
		return true;
	else
		return false;
}

// check if potential token is a register assignment
function isAssignment(t) {
	if (t === "=") {
		return t;
	} else if (t.length == 2 && t.charAt(1) == "=") {
		let t0 = t.charAt(0);
		if (t0 === "\"" || t0 === "'" || t0 === "+" || t0 === "-" || t0 === "*" || t0 === "/" || t0 === "%")
			return t;
		else
			return false;
	} else {
		return false;
	}
}

// insert into string
function insert(string, text, index) {
	return string.substring(0, index) + text + string.substring(index);
}

// remove from string
function remove(string, index, amount = 1) {
	return string.substring(0, index) + string.substring(index + amount);
}

// (try) to make number
function tNum(string, toLen = false, radix) {
	if (!isNumerical(string))
		return toLen ? string.length : string;
	else
		return parseInt(string, radix);
}

// bool to num
function btn(bool) {
	return bool ? 1 : 0;
}

// num to bool
function ntb(num) {
	return num > 0 ? true : false;
}

// sort array of numbers
function sort(arr) {
	return arr.length > 0 ? [].sort.call(arr, (a, b) => a - b) : [];
}

// alpha to index
function atoi(a) {
	if (a == "_")
		return 0;

	const alphas = "abcdefghijklmnopqrstuvwxyz";
	return alphas.indexOf(a.toLowerCase());
}

// check capitalization
function isUppercase(string) { return string === string.toUpperCase(); }
function isLowercase(string) { return string === string.toLowerCase(); }

// check if alphabetic
function isAlphabetic(_string, forceCase = false, lowerCase = false) {
	let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let string = _string;

	// shortcut if you ant to force capitalization
	if (forceCase) {
		if (lowerCase) {
			alphabet = "abcdefghijklmnopqrstuvwxyz";
		}
	} else {
		string = _string.toLowerCase();
	}

	// shortcut if string is only a character
	if (string.length == 1) {
		return alphabet.includes(string.charAt());
	} else {
		for (let i = 0; i < string.length; i++) {
			if (!alphabet.includes(string.charAt(i)))
				return false;
		}

		return true;
	}
}

// check if number
function isNumerical(string) {
	if (typeof(string) == "number") {
		if (isNaN(string))
			return false;
		else
			return true;
	} else if (typeof(string) == "string") {
	} else {
		return false;
	}

	let digits = "0123456789";

	for (let i = 0; i < string.length; i++) {
		if (!digits.includes(string.charAt(i)))
			return false;
	}

	return true;
}

// get css measurements
function em(x) {
	elements.em.style.width = x + "em";
	return elements.em.clientWidth;
}

function ch(x) {
	elements.ch.style.width = x + "ch";
	return elements.ch.clientWidth;
}

// fuck document.getElementById()
function getElement(id) {
	return document.getElementById(id);
}

// get the child index of a node
function childIndexOf(node) {
	return Array.prototype.indexOf.call(node.parentNode.children, node);
}
