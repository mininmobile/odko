const elements = {
	columns: document.getElementById("columns"),
}

let table = []
let selected = { x: 0, y: 0 }

addEventListener("keydown", (e) => {
	console.log(e.key);
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
			table.push([]);
			selected.x = table.length - 1;
			selected.y = 0;
		} break;

		case "ArrowLeft": {
			selected.x--;

			if (selected.x < 0)
				selected.x = 0;
		} break;

		case "ArrowRight": {
			selected.x++;

			if (selected.x >= table.length)
				selected.x = table.length > 0 ? table.length - 1 : 0;
		} break;
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
