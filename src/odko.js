const elements = {
	columns: document.getElementById("columns"),
	cursor: document.getElementById("cursor"),
}

let selected = { x: 0, y: 0 }
let mode = 0;
let editCursor = 0;
/**
 * @type {Array.<Array.<string>>}
 */
let table = []
/**
 * @type {Array.<Array.<number>>}
 */
let connections = []

addEventListener("keydown", (e) => {
	e.preventDefault();

	if (e.key == "r" && e.ctrlKey)
		location.reload();

	if (mode == 0) { // editing mode
		// hide old cursor position
		if (getFocusedElement())
			getFocusedElement().classList.remove("focus");
		if (getFocusedColumn())
			getFocusedColumn().classList.remove("focus");

		switch (e.key) {
			case "a": { // add block
				if (table.length == 0) {
					table[0] = [];
					selected.x = selected.y = 0;
				}

				table[selected.x].push("nil");
				update();
			} break;

			case "A": { // add column
				table.splice(selected.x + 1, 0, []);
				selected.x++;
				selected.y = 0;
				update();
			} break;

			case "x": { // delete block
				if (table.length == 0) break;
				if (table[selected.x].length == 0) break;

				table[selected.x].splice(selected.y, 1);
				update();
			} break;

			case "Delete": { // delete column
				if (table.length == 0) break;

				table.splice(selected.x, 1);
				update();
			} break;

			case "e": case "Enter": case "F2":
				if (getFocusedElement()) { // edit mode
					mode = 1;
					editCursor = table[selected.x][selected.y].length;
					getFocusedElement().classList.add("editing");
					updateEditCursor();
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
		if (getFocusedElement())
			getFocusedElement().classList.add("focus");
		let c;
		if (c = getFocusedColumn()) {
			c.classList.add("focus");
			scroll(c.offsetLeft - c.clientWidth * 2.5, 0);
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
	}
	console.log(e.key)
});

function update() {
	columns.innerHTML = "";

	table.forEach(c => {
		let col = document.createElement("div");
			col.classList.add("column");
			elements.columns.appendChild(col);

		c.forEach(r => {
			let row = document.createElement("div");
				row.classList.add("row");
				row.innerText = r;
				col.appendChild(row);
		});
	});
}

function updateEditCursor() {
	if (mode == 1) {
		elements.cursor.classList.remove("hidden");

		elements.cursor.style.left = `calc((4rem + 7ch + 2px) * ${selected.x} + ${editCursor}ch + 2rem + 1px)`;
		elements.cursor.style.top = `calc((4rem + 2px) * ${selected.y} + 2.25rem + 1px)`;
	} else {
		elements.cursor.classList.add("hidden");
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

	if (table[selected.x]) {
		if (selected.y >= table[selected.x].length)
			selected.y = table[selected.x].length > 0 ? table[selected.x].length - 1 : 0;
	}
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

// insert into string
function insert(string, text, index) {
	return string.substring(0, index) + text + string.substring(index);
}

// remove from string
function remove(string, index, amount = 1) {
	return string.substring(0, index) + string.substring(index + amount);
}
