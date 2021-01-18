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
 * @typedef {Object} Row
 * @property {string} v
 * @property {Array.<number>} c
 */

/**
 * @type {Array.<Array.<Row>>}
 */
let table = [[{"v":"nil","c":[]},{"v":"nil","c":[]},{"v":"nil","c":[]}],[{"v":"a","c":[]},{"v":"b","c":[1,0,2]},{"v":"c","c":[]}],[{"v":"nil","c":[1]},{"v":"nil","c":[1]},{"v":"nil","c":[1]}]]//[];

update();

addEventListener("keydown", e => {
	e.preventDefault();

	if (e.key == "r" && e.ctrlKey)
	location.reload();

	if (mode == 0) { // no mode
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
					selected.x = selected.y = 0;
					update();
				}

				table[selected.x].splice(selected.y + 1, 0, { v: "nil", c: [] });
				let row = document.createElement("div");
					row.classList.add("row");
					row.innerText = "nil";
					elements.columns.children[selected.x]
						.insertBefore(row, elements.columns.children[selected.x].childNodes[selected.y + 1]);

				updateConnections();

				selected.y++;
			} break;

			case "A": { // add column
				table.splice(selected.x + 1, 0, []);
				let col = document.createElement("div");
					col.classList.add("column");
					elements.columns.insertBefore(col, elements.columns.childNodes[selected.x + 1]);

				updateConnections();

				selected.x++;
				selected.y = 0;
			} break;

			case "x": { // delete block
				if (table.length == 0) break;
				if (table[selected.x].length == 0) break;

				table[selected.x].splice(selected.y, 1);
				elements.columns.children[selected.x]
					.removeChild(elements.columns.children[selected.x].childNodes[selected.y]);

				// if there were any connections to this row, no
				if (table[selected.x + 1])
					table[selected.x + 1]
						.forEach((r) =>
							r.c = r.c
								.filter(c => c != selected.y)
								.map(c => c > selected.y ? c - 1 : c));

				updateConnections();
			} break;

			case "d": { // disconnect left of block
				table[selected.x][selected.y].c = [];
				updateConnections();
			} break;

			case "D": if (table[selected.x + 1]) { // disconnect right of block
				table[selected.x + 1]
					.forEach(r => r.c = r.c.filter(c => c != selected.y));

				updateConnections();
			} break;

			case "Delete": { // delete column
				if (table.length == 0) break;

				table.splice(selected.x, 1);
				elements.columns.removeChild(elements.columns.childNodes[selected.x]);

				// if this row connected to the one behind it, no
				if (table[selected.x])
					table[selected.x].forEach(r => r.c = []);

				updateConnections();
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
				let _l = (table[selected.x - 1] || []).length > 0;
				let _r = (table[selected.x + 1] || []).length > 0;
				if (_l || _r) {
					if (_e) {
						// draw preview line on top
						let l = document.createElementNS("http://www.w3.org/2000/svg", "use");
							l.setAttribute("href", "#preview-line");
							elements.lines.appendChild(l);
						// connect mode
						mode = 2;

						connectCursor = {
							// try to remain on same row as connecting to
							y: selected.y,
							// if it can't connect left, connect right
							right: _l ? false : true,
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
			case "Escape": case "Enter": { // exit edit mode
				mode = 0;
				getFocusedElement().classList.remove("editing");
			} break;

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

			case "ArrowUp": case "Home": // move cursor to start
				editCursor = 0; break;
			case "ArrowDown": case "End": // move cursor to end
				editCursor = getFocused().length; break;

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

				// TODO when optimizing add this bad boy to the case below
				elements.lines.lastChild.remove();
			} break;

			case "Enter": case "C": { // exit connect mode and confirm connection
				mode = 0;

				if (connectCursor.right) {
					if (!table[connectCursor.x][connectCursor.y].c.includes(selected.y))
						table[connectCursor.x][connectCursor.y].c.push(selected.y);
				} else {
					if (!table[selected.x][selected.y].c.includes(connectCursor.y))
						table[selected.x][selected.y].c.push(connectCursor.y);
				}

				updateConnections();
			} break;

			case "d": { // disconnect
				if (connectCursor.right) {
					table[connectCursor.x][connectCursor.y].c =
						table[connectCursor.x][connectCursor.y].c.filter(c => c != selected.y);
				} else {
					table[selected.x][selected.y].c =
						table[selected.x][selected.y].c.filter(c => c != connectCursor.y);
				}

				// TODO i really use updateConnections() too much i have to optimize the fuck outta it or where i use it, cause then i wouldn't have to readd the <use> tag
				updateConnections();

				// draw preview line on top
				let l = document.createElementNS("http://www.w3.org/2000/svg", "use");
					l.setAttribute("href", "#preview-line");
					elements.lines.appendChild(l);
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
		let b = getFocusedElement();

		switch (e.key) {
			case "Escape": case "Enter": case "g": mode = 0; break;

			case "ArrowUp": if (selected.y > 0) { // move block up
				let s = table[selected.x].slice(selected.y - 1, selected.y + 1).reverse();
				table[selected.x].splice(selected.y - 1, 2, ...s);

				b.parentNode.insertBefore(b, b.previousElementSibling);
				selected.y--;
			} break;

			case "ArrowDown": if (selected.y < table[selected.x].length - 1) { // move block down
				let s = table[selected.x].slice(selected.y, selected.y + 2).reverse();
				table[selected.x].splice(selected.y, 2, ...s);

				b.parentNode.insertBefore(b.nextElementSibling, b);
				selected.y++;
			} break;

			case "ArrowLeft": if (selected.x > 0) { // move block left
				let c = elements.columns.children[selected.x - 1];
				let neighbor = c.childNodes[selected.y];
				let r = table[selected.x].splice(selected.y, 1);

				if (neighbor) {
					c.insertBefore(b, neighbor)
					table[selected.x - 1].splice(selected.y, 0, ...r);
				} else {
					c.appendChild(b);
					table[selected.x - 1].push(...r);
					selected.y = c.childElementCount - 1;
				}

				selected.x--;
			} break;

			case "ArrowRight": if (selected.x < table.length - 1) { // move block right
				let c = elements.columns.children[selected.x + 1];
				let neighbor = c.childNodes[selected.y];
				let r = table[selected.x].splice(selected.y, 1);

				if (neighbor) {
					c.insertBefore(b, neighbor);
					table[selected.x + 1].splice(selected.y, 0, ...r);
				} else {
					c.appendChild(b);
					table[selected.x + 1].push(...r);
					selected.y = c.childElementCount - 1;
				}

				selected.x++;
			} break;
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
				row.innerText = r.v;
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
	table.forEach((c, i) => {
		c.forEach((r, j) => {
			r.c.forEach(c => { // for each connection
				let from = getConnectionPosition(i, j, false);
				let to = getConnectionPosition(i - 1, c, true)

				let l = document.createElementNS("http://www.w3.org/2000/svg", "line");
					l.setAttribute("x1", from.x);
					l.setAttribute("y1", from.y);
					l.setAttribute("x2", to.x);
					l.setAttribute("y2", to.y);
					elements.lines.appendChild(l);
			});
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

		let from = getConnectionPosition(connectCursor.x, connectCursor.y, !connectCursor.right);
		let to = getConnectionPosition(selected.x, selected.y, connectCursor.right);
		let pl = elements.lines.children[0];
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
