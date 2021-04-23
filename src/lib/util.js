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
	let number = parseInt(string, radix);
	if (isNaN(number))
		return toLen ? string.length : string;
	else
		return number;
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
			alphabet = alphabet.toLowerCase();
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

// get css measurements
function em(x) {
	elements.em.style.width = x + "em";
	return elements.em.clientWidth;
}

function ch(x) {
	elements.ch.style.width = x + "ch";
	return elements.ch.clientWidth;
}
