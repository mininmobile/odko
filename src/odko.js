/**
 * @typedef {Object} Point
 * @property {number} x
 * @property {number} y
 */

let elements = {
	em: getElement("em"),
	ch: getElement("ch"),
	leftStatus: getElement("status-left"),
	rightStatus: getElement("status-right"),
	columns: getElement("columns"),
	cursor: getElement("cursor"),
	linesWrapper: getElement("lines-wrapper"),
	lines: getElement("lines"),
	consoleWrapper: getElement("console-wrapper"),
	consoleTitlebar: getElement("console-titlebar"),
	consoleCanvas: getElement("console-canvas"),
	ui: {
		sidebar: getElement("sidebar"),
		project: getElement("sidebar-project"),
		branches: getElement("sidebar-branches"),
	},
}

let selected = { x: 0, y: 0 }
let mode = 0; // default, edit, connecting, move, run
// state: halted, running, paused, preserved
// registers: variables object (AA, AB, etc.)
// events: parsed events
let run = { state: 0, registers: {}, queue: [], going: false };
let debug = false;
let editCursor = 0;
let connectCursor = { x: 0, y: 0, right: false }
/**
 * @typedef {Object} Row
 * @property {string} v
 * @property {Array.<Token>} t
 * @property {Array.<number>} c
 */
/**
 * @typedef {Array.<Array.<Row>>} Table
 */

/** @type {Object.<string, Table>} */
let project = { "main": [[]] };
/** @type {string} */
let currentTable = "main";
/** @type {Table} */
let table = project[currentTable];

/**
 * @typedef {Object} OdkoEvent
 * @property {string} type
 * @property {string} direction
 * @property {string} button
 * @property {Point} origin
 * @property {Object} modifiers
 * @property {boolean} modifiers.shift
 * @property {boolean} modifiers.ctrl
 * @property {boolean} modifiers.alt
 * @property {Array.<number>} activates
 */
/** @type {Array.<OdkoEvent>} */
let events = [];
let eventsFiltered = {
	keyboardDown: [],
	keyboardUp: [],
	mouseDown: [],
	mouseUp: [],
	run: [],
}

update();
initConsole();

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
	// update the sidebar bar
	updateSidebar();
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
	let status = `[${currentTable}][x: ${selected.x}, y: ${selected.y}]   `;

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

		case 4: {
			status += "run   [state: ";

			switch (run.state) {
				case 0: status += "halted"; break;
				case 1: status += "running"; break;
				case 2: status += "paused"; break;
				case 3: status += "halted (preserved)"; break;
			}

			status += "]";
		} break;

		default: status += "?";
	}

	elements.leftStatus.innerText = status;

	if (mode == 0) {
		let _e;
		if (_e = getFocusedElement()) {
			let r = _e.getAttribute("data-returns") || "?";
			elements.rightStatus.innerText = "<" + r + ">";
		}
	} else {
		elements.rightStatus.innerText = "";
	}
}

function updateEditCursor() {
	if (mode == 1) {
		elements.cursor.classList.remove("hidden");

		elements.cursor.style.left =
			`calc((4rem + 7ch + 2px) * ${selected.x} + ${editCursor}ch + 2rem + 281px + 1px)`;
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

function updateSidebar() {
	// update branches list
	elements.ui.branches.innerHTML = "";
	let i = 0;
	Object.keys(project).forEach((t) => {
		if (project[t] === undefined) {
			return; // do not create a button
		} else {
			i++;
		}

		let shortcutKey = i > 10 ? undefined : i;
		if (i == 10)
			shortcutKey = 0;

		let button = document.createElement("a");
		button.addEventListener("click", () => switchBranch(t));
		button.innerText = t;
		button.classList.add("branch");
		elements.ui.branches.appendChild(button);

		if (currentTable == t)
			button.classList.add("active");

		if (shortcutKey !== undefined)
			button.setAttribute("data-index", shortcutKey);
	});
}

function getConnectionPosition(x, y, right = true) {
	return {
		x: (em(4) + ch(7) + 2) * x + em(2 + (right ? .5 : -.5)) + ch(right ? 7 : 0) + 281 + 1,
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

// rename current branch (no safety)
function renameBranch(newName) {
	// move table
	project[newName] = table;
	// create delete old table
	project[currentTable] = undefined;
	delete project[currentTable];
	// change to new table
	currentTable = newName;

	updateStatus();
	updateSidebar();
}


// delete current branch (no safety)
function deleteBranch() {
	// save old table
	project[currentTable] = undefined;
	delete project[currentTable];
	// create new table
	currentTable = "main";
	table = project[currentTable];

	update();
}


// create current branch (no safety)
function createBranch(newName) {
	// save old table
	project[currentTable] = table;
	// create new table
	currentTable = newName;
	project[currentTable] = [[]];
	table = project[currentTable];

	update();
}

// change to a branch
function switchBranch(newBranch) {
	// save old table
	project[currentTable] = table;
	// change to new table
	currentTable = newBranch;
	table = project[currentTable];

	update();
}
