const elements = {
	em: document.getElementById("em"),
	ch: document.getElementById("ch"),
	leftStatus: document.getElementById("status-left"),
	rightStatus: document.getElementById("status-right"),
	columns: document.getElementById("columns"),
	cursor: document.getElementById("cursor"),
	linesWrapper: document.getElementById("lines-wrapper"),
	lines: document.getElementById("lines"),
}

let selected = { x: 0, y: 0 }
let mode = 0;
let debug = false;
let editCursor = 0;
let connectCursor = { x: 0, y: 0, right: false }
/**
 * @type {Array.<Array.<string>>}
 */
let table =[]
/**
 * @type {Array.<Array.<number>>}
 */
//
let connections = []

update();

addEventListener("keydown", e => {
	e.preventDefault();

	if (e.key == "r" && e.ctrlKey)
	location.reload();

	if (mode == 0) { // editing mode
		let _e;
		let _c;
		// hide old cursor position
		if (_c = columns.children[selected.x]) {
			_c.classList.remove("focus");
			if (_e = _c.children[selected.y])
				_e.classList.remove("focus");
		}

		switch (e.key) {
			case "Z": { // toggle debug view
				debug = !debug;

				debug ?
					elements.columns.classList.add("debug") :
					elements.columns.classList.remove("debug");

				updateConnections();
			} break;

			// evaluate current block
			case "t": if (_e) evaluate(selected.x, selected.y); break;
			// activate move mode
			case "g": if (_e) mode = 3; break;

			case "a": { // add block
				if (table.length == 0) {
					table[0] = [];
					connections[0] = [];
					selected.x = selected.y = 0;
					update();
				}

				table[selected.x].splice(selected.y + 1, 0, "nil");
				connections[selected.x].splice(selected.y + 1, 0, null);
				let row = document.createElement("div");
					row.classList.add("row");
					row.innerText = "nil";
					elements.columns.children[selected.x]
						.insertBefore(row, elements.columns.children[selected.x].childNodes[selected.y + 1]);

				selected.y++;
			} break;

			case "A": { // add column
				table.splice(selected.x + 1, 0, []);
				connections.splice(selected.x + 1, 0, []);
				let col = document.createElement("div");
					col.classList.add("column");
					elements.columns.insertBefore(col, elements.columns.childNodes[selected.x + 1]);

				selected.x++;
				selected.y = 0;
			} break;

			case "x": { // delete block
				if (table.length == 0) break;
				if (table[selected.x].length == 0) break;

				table[selected.x].splice(selected.y, 1);
				connections[selected.x].splice(selected.y, 1);

				if (connections[selected.x + 1]) {
					connections[selected.x + 1] =
						connections[selected.x + 1].map((x) => {
							if (x != null) {
								if (x == selected.y) {
									return null;
								} else if (x > selected.y) {
									return x - 1;
								} else {
									return x;
								}
							} else {
								return null;
							}
						});

					updateConnections();
				}

				elements.columns.children[selected.x]
					.removeChild(elements.columns.children[selected.x].childNodes[selected.y]);
			} break;

			case "d": { // disconnect left of block
				connections[selected.x][selected.y] = null;
				updateConnections();
			} break;

			case "D": { // disconnect right of block
				if (connections[selected.x + 1])
					connections[selected.x + 1] =
						connections[selected.x + 1].map(x => x == selected.y ? null : x);

				updateConnections();
			} break;

			case "Delete": { // delete column
				if (table.length == 0) break;

				table.splice(selected.x, 1);
				connections.splice(selected.x, 1);
				elements.columns.removeChild(elements.columns.childNodes[selected.x]);

				if (connections[selected.x]) {
					connections[selected.x] = connections[selected.x].map(() => null);

					updateConnections();
				}
			} break;

			case "e": case "Enter": case "F2": // edit mode
				if (_e) {
					mode = 1;
					editCursor = table[selected.x][selected.y].length;
					getFocusedElement().removeAttribute("data-returns");
					getFocusedElement().classList.add("editing");
					updateEditCursor();
				}
			break;

			case "c": // connect mode
				// if it can connect left or right
				let l = (table[selected.x - 1] || []).length > 0;
				let r = (table[selected.x + 1] || []).length > 0;
				if (l || r) {
					if (_e) {
						// connect mode
						mode = 2;

						connectCursor = {
							// try to remain on same row as connecting to
							y: selected.y,
							// if it can't connect left, connect right
							right: l ? false : true,
						}

						updateConnectCursor();
					}
				}
			break;

			// movement
			case "ArrowLeft": selected.x--; break;
			case "ArrowRight": selected.x++; break;
			case "ArrowUp": selected.y--; break;
			case "ArrowDown": selected.y++; break;
		}

		// make sure cursor is in safe position
		saveCursorPosition();
		// show new cursor position
		if (_c = columns.children[selected.x]) {
			_c.classList.add("focus");
			scroll(_c.offsetLeft - _c.clientWidth * 3.5, scrollY);

			if (_e = _c.children[selected.y]) {
				_e.classList.add("focus");
				scroll(scrollX, _e.offsetTop - _e.clientHeight * 3.5);
			} else {
				scroll(scrollX, 0);
			}
		}
	} else if (mode == 1) { // edit mode
		switch (e.key) {
			case "Escape": case "Enter":
				{ // exit edit mode
					mode = 0;
					getFocusedElement().classList.remove("editing");
				}
			break;

			case "ArrowLeft": { // move cursor left
				editCursor--;
				if (editCursor < 0)
					editCursor = 0;
			} break;

			case "ArrowRight": { // move cursor right
				editCursor++;
				if (editCursor > getFocused().length - 1)
					editCursor = getFocused().length;
			} break;

			case "Backspace": { // delete char behind cursor
				getFocusedElement().innerText =
					table[selected.x][selected.y] =
						remove(getFocused(), editCursor - 1);

				editCursor--;

				if (editCursor < 0)
					editCursor = 0;
			} break;

			case "Delete": { // delete char in front of cursor
				getFocusedElement().innerText =
					table[selected.x][selected.y] =
						remove(getFocused(), editCursor);
			} break;

			default: // normal typing
				if (getFocused().length < 7) { // limit block size
					// check for valid character
					if ("01234567890-_=+qwertyuiopasdfghjklzxcvbnm!@#$%^&*()[]{}:;',./<>? \"\\".includes(e.key.toLowerCase())) {
						// append char at cursor
						getFocusedElement().innerText =
							table[selected.x][selected.y] =
								insert(getFocused(), e.key, editCursor);

						editCursor++;
					}
				}
		}

		updateEditCursor();
	} else if (mode == 2) { // connecting mode
		elements.columns.children[connectCursor.x].children[connectCursor.y].classList.remove("focus");

		switch (e.key) {
			case "Escape": case "c": { // exit connect mode and cancel connection
				mode = 0;
			} break;

			case "Enter": case "C": { // exit connect mode and confirm connection
				mode = 0;

				if (connectCursor.right) {
					connections[connectCursor.x][connectCursor.y] = selected.y;
				} else {
					connections[selected.x][selected.y] = connectCursor.y;
				}

				updateConnections();
			} break;

			// swap to connecting rightwards
			case "ArrowRight": if ((table[selected.x + 1] || []).length > 0)
				if (!connectCursor.right) {
					elements.columns.children[connectCursor.x].classList.remove("selecting");
					connectCursor.right = true;
				}
			break;

			// swap to connecting leftwards
			case "ArrowLeft": if ((table[selected.x - 1] || []).length > 0)
				if (connectCursor.right) {
					elements.columns.children[connectCursor.x].classList.remove("selecting");
					connectCursor.right = false;
				}
			break;

			// normal navigation
			case "ArrowUp": connectCursor.y--; break;
			case "ArrowDown": connectCursor.y++; break;
		}

		updateConnectCursor();
	} else if (mode == 3) { // move mode
		switch (e.key) {
			case "Escape": mode = 0; break;
		}
	}

	updateStatus();
});

function evaluate(_x, _y) {
	let expression = table[_x][_y].split(/ +/g).filter(x => x.length > 0);
	let _input = getConnection(_x, _y);

	if (_x > 0 && _input !== null) {
		let input = evaluate(_x - 1, _input);
		expression = expression.map(x => x == "_" ? input : x);
	}

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
		if (typeof(v) == "number")
			v = v.toFixed(0);

		elements.columns.children[_x].children[_y].setAttribute("data-returns", v.toString());
		return v.toString();
	}

	function reduce(callback) {
		return expression.map(x => parseInt(x))
			.filter(x => !isNaN(x))
			.reduce(callback);
	}
}

function update() {
	// reset columns element
	columns.innerHTML = "";
	// add columns
	table.forEach(c => {
		let col = document.createElement("div");
			col.classList.add("column");
			elements.columns.appendChild(col);

		// add rows
		c.forEach(r => {
			let row = document.createElement("div");
				row.classList.add("row");
				row.innerText = r;
				col.appendChild(row);
		});
	});
	// update the status bar
	updateStatus();
	// update connections
	updateConnections();
	// make sure cursor is in safe position
	saveCursorPosition();
	// show new cursor position
	if (_c = columns.children[selected.x]) {
		_c.classList.add("focus");
		scroll(_c.offsetLeft - _c.clientWidth * 3.5, scrollY);

		if (_e = _c.children[selected.y]) {
			_e.classList.add("focus");
			scroll(scrollX, _e.offsetTop - _e.clientHeight * 3.5);
		} else {
			scroll(scrollX, 0);
		}
	}
}

function updateConnections() {
	// reset lines element
	while (elements.lines.children[1])
		elements.lines.children[1].remove();
	// add lines
	connections.forEach((c, i) => {
		c.forEach((r, j) => {
			if (r != null) { // if row is connected
				let from = getConnectionPosition(i, j, false);
				let to = getConnectionPosition(i - 1, r, true)

				let l = document.createElementNS("http://www.w3.org/2000/svg", "line");
					l.setAttribute("x1", from.x);
					l.setAttribute("y1", from.y);
					l.setAttribute("x2", to.x);
					l.setAttribute("y2", to.y);
					elements.lines.appendChild(l);
			}
		});
	});
}

function updateStatus() {
	let status = `[x: ${selected.x}, y: ${selected.y}]   `;

	switch (mode) {
		case 0: status += "none"; break;

		case 1: {
			status += "edit   ";
			status += `[col: ${editCursor}]   `;
		} break;

		case 2: {
			status += "connect   ";
			status += `=>[x: ${connectCursor.x}, y: ${connectCursor.y}]`;
		} break;

		case 3: status += "move"; break;

		default: status += "????";
	}

	elements.leftStatus.innerText = status;

	let _e;
	if (_e = getFocusedElement()) {
		let r = _e.getAttribute("data-returns") || "?";
		elements.rightStatus.innerText = "<" + r + ">";
	}
}

function updateEditCursor() {
	if (mode == 1) {
		elements.cursor.classList.remove("hidden");

		elements.cursor.style.left =
			`calc((4rem + 7ch + 2px) * ${selected.x} + ${editCursor}ch + 2rem + 1px)`;
		elements.cursor.style.top =
			`calc((${4 + (debug ? 1.5 : 0)}rem + 2px) * ${selected.y} + 3.75rem + 1px)`;
	} else {
		elements.cursor.classList.add("hidden");
	}
}

function updateConnectCursor() {
	let c = elements.columns; // sanity

	if (mode == 2) {
		// get selecting column
		connectCursor.x = selected.x + (connectCursor.right ? 1 : -1);

		// save the connect cursor position
		if (connectCursor.y < 0)
			connectCursor.y = 0;

		if (connectCursor.y >= table[connectCursor.x].length)
			connectCursor.y = table[connectCursor.x].length > 0 ? table[connectCursor.x].length - 1 : 0;

		// reflect selected row
		c.children[connectCursor.x].children[connectCursor.y].classList.add("focus");

		let pl = elements.lines.children[0];
		let from = getConnectionPosition(connectCursor.x, connectCursor.y, !connectCursor.right);
		let to = getConnectionPosition(selected.x, selected.y, connectCursor.right);
		pl.setAttribute("x1", from.x);
		pl.setAttribute("y1", from.y);
		pl.setAttribute("x2", to.x);
		pl.setAttribute("y2", to.y);

		// initialize connect mode if not done
		if (!c.classList.contains("selecting")) {
			elements.columns.classList.add("selecting");
			// lines
			elements.linesWrapper.setAttribute("stroke", "#777777");
			elements.lines.children[0].classList.remove("hidden");
		}

		// initialize selecting column if not done
		if (!c.children[connectCursor.x].classList.contains("selecting"))
			c.children[connectCursor.x].classList.add("selecting");
	} else {
		if (c.classList.contains("selecting")) {
			// remove selecting classes from column view
			c.classList.remove("selecting");
			c.children[connectCursor.x].classList.remove("selecting");
			c.children[connectCursor.x].children[connectCursor.y].classList.remove("focus");
			// lines
			elements.linesWrapper.setAttribute("stroke", "#dddddd");
			elements.lines.children[0].classList.add("hidden");
		}
	}
}

function getConnectionPosition(x, y, right = true) {
	return {
		x: (em(4) + ch(7) + 2) * x + em(2 + (right ? .5 : -.5)) + ch(right ? 7 : 0) + 1,
		y: (em(4 + (debug ? 1.5 : 0)) + 2) * y + em(2.875 + (debug ? .75 : 0)),
	}
}

// make the cursor position safe
function saveCursorPosition() {
	if (selected.x < 0)
		selected.x = 0;

	if (selected.x >= table.length)
		selected.x = table.length > 0 ? table.length - 1 : 0;

	if (selected.y < 0)
		selected.y = 0;

	if (table[selected.x])
		if (selected.y >= table[selected.x].length)
			selected.y = table[selected.x].length > 0 ? table[selected.x].length - 1 : 0;
}

// make the connection table safe
function saveConnectionTable() {
	table.forEach((c, i) => {
		if (connections[i] == undefined)
			connections[i] = [];

		c.forEach((r, j) => {
			if (connections[i][j] == undefined)
				connections[i][j] = null;
		})
	});
}

// get focused block
function getFocused() {
	if (table[selected.x] !== undefined)
		if (table[selected.x][selected.y] !== undefined)
			return table[selected.x][selected.y];

	return false;
}

// get focused block element
/**
 * @returns {HTMLDivElement}
 */
function getFocusedElement() {
	if (columns.children[selected.x])
		if (columns.children[selected.x].children[selected.y])
			return columns.children[selected.x].children[selected.y];

	return false;
}

// get focused column element
/**
 * @returns {HTMLDivElement}
 */
function getFocusedColumn() {
	if (columns.children[selected.x])
		return columns.children[selected.x];

	return false;
}

// get the connection to this block
function getConnection(x = selected.x, y = selected.y) {
	if (connections[selected.x] !== undefined)
		if (connections[selected.x][selected.y] !== undefined)
			return connections[selected.x][selected.y];

	return null;
}

// insert into string
function insert(string, text, index) {
	return string.substring(0, index) + text + string.substring(index);
}

// remove from string
function remove(string, index, amount = 1) {
	return string.substring(0, index) + string.substring(index + amount);
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
