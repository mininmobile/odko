const elements = {
	columns: document.getElementById("columns"),
}

let selected = { x: 0, y: 0 }
let mode = 0;
/**
 * @type {Array.<Array.<string>>}
 */
let table = []

addEventListener("keydown", (e) => {
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
		if (getFocusedColumn())
			getFocusedColumn().classList.add("focus");
	}
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

// make the cursor position safe
function saveCursorPosition() {
	if (selected.x < 0)
		selected.x = 0;

	if (selected.x >= table.length)
		selected.x = table.length > 0 ? table.length - 1 : 0;

	if (selected.y < 0)
		selected.y = 0;

	if (selected.y >= table[selected.x].length)
		selected.y = table[selected.x].length > 0 ? table[selected.x].length - 1 : 0;
}

function getFocusedElement() {
	if (columns.children[selected.x])
		if (columns.children[selected.x].children[selected.y])
			return columns.children[selected.x].children[selected.y];

	return false;
}

function getFocusedColumn() {
	if (columns.children[selected.x])
		return columns.children[selected.x];

	return false;
}
