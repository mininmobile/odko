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
	ui.fcol = ui.fblock = null;
	ui.flock = false;
	ui.content.innerHTML = "";

	if (project.columns.length > 0)
		project.columns.forEach((column, x) => {
			let c = document.createElement("div");
				c.classList.add("column");
				ui.content.appendChild(c);

			c.addEventListener("mouseenter", () => { if (!ui.flock) {
					ui.fcol = { col: x, elem: c }; c.classList.add("focus") }});
			c.addEventListener("mouseleave", () => { if (!ui.flock) {
					ui.fcol = null; c.classList.remove("focus") }});

			c.addEventListener("mousedown", (e) => {
				if (e.target == c) {
					switch (e.button) {
						case 0: {
							project.columns[x].push("");
							update();
						} break;

						case 2: {
							project.columns = project.columns.filter((_c, i) => i != x);
							update();
						} break;
					}
				}
			});

			column.forEach((row, y) => {
				let b = document.createElement("div");
					b.classList.add("block");
					b.innerText = row;
					c.appendChild(b);

				b.addEventListener("mouseenter", () => { if (!ui.flock) {
					ui.fblock = { col: x, row: y, elem: b }; b.classList.add("focus") }});
				b.addEventListener("mouseleave", () => { if (!ui.flock) {
					ui.fblock = null; b.classList.remove("focus") }});

				b.addEventListener("mousedown", (e) => {
					switch (e.button) {
						case 0: {
							ui.flock = true;
						} break;

						case 2: {
							project.columns[x] = project.columns[x].filter((_c, i) => i != y);
							update();
						} break;
					}
				});
			});
		});

	let newColumn = document.createElement("div");
		newColumn.classList.add("column", "new");
		ui.content.appendChild(newColumn);

	newColumn.addEventListener("click", () => {
		project.columns.push([]);
		update();
	});
}

// add keybindings
document.addEventListener("keydown", (e) => {
	switch (e.key) {
		case "Escape": {
			//ui.flock = false; // update performs this automatically, for now
			update();
		} break;
	}
});

// add universal mouse actions
document.addEventListener("mousedown", (e) => {
	if (ui.fblock) {
		if (e.target != ui.fblock.elem) {
			e.preventDefault();
			//ui.flock = false; // update performs this automatically, for now
			update();
		}
	}
});

// assign actions
document.getElementById("close").addEventListener("click", () =>
	window.close());

// initialize
update();
