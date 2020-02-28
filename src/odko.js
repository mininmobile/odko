// stores references to predefined dom elements
// and focused elements
let ui = {
	fcol: null,   // focused column
	fblock: null, // focused block
	flock: false, // lock focus

	content: document.getElementById("content"),
}

// stores all of the data of the current project
let project = {
	columns: [],
}

// updates dom of content container to reflect the
// project variable and allow it to be modified.
function update() {
	ui.content.innerHTML = "";

	project.columns.length > 0 &&
		project.columns.forEach((column, x) => {
			let c = document.createElement("div");
				c.classList.add("column");
				ui.content.appendChild(c);

			c.addEventListener("mouseenter", () =>
				ui.fcol = { col: x, elem: c });
			c.addEventListener("mouseleave", () =>
				ui.fcol = null);

			column.forEach((row, y) => {
				let b = document.createElement("div");
					b.classList.add("block");
					b.innerText = row;
					c.appendChild(b);

				b.addEventListener("mouseenter", () =>
					ui.fblock = { col: x, row: y, elem: b });
				b.addEventListener("mouseleave", () =>
					ui.fblock = null);
			});
		});

	let newColumn = document.createElement("div");
		newColumn.classList.add("column", "new");
		ui.content.appendChild(newColumn);
}

// assign actions

document.getElementById("close").addEventListener("click", () =>
	window.close());

// initialize

update();
