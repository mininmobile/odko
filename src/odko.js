// stores references to predefined dom elements
// and focused elements
let ui = {
	// focus
	fcol: null,   // focused column
	fblock: null, // focused block
	flock: false, // lock focus

	// tool actions
	connect: null, // connect tool active

	// mouse position
	mouse: { x: 0, y: 0 },

	// ui
	content: document.getElementById("content"),
	lines: document.getElementById("lines"),
}

// stores all of the data of the current project
let project = {
	columns: [],
	connections: [],
}

// updates dom of content container to reflect the
// project variable and allow it to be modified.
function update() {
	// deselect
	ui.fcol = ui.fblock = null;
	ui.connect = null;
	// unlock
	ui.flock = false;
	// clear
	ui.content.innerHTML = "";

	// render connections
	connect();

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
				if (!ui.fblock) {
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

// lines renderer
// update affects if connect should only update
// for the currently connecting line
function connect(update = false) {
	if (!update) {
		ui.lines.setAttribute("width", ui.content.clientWidth);
		ui.lines.setAttribute("height", ui.content.clientHeight);
		ui.lines.innerHTML = "";
	}

	if (ui.connect) {
		let c;

		let from = ui.connect.from.elem;

		if (ui.lines.children[0]) {
			c = ui.lines.children[0];
		} else {
			c = document.createElementNS("http://www.w3.org/2000/svg", "line");
				c.setAttribute("x1", from.offsetLeft + from.clientWidth);
				c.setAttribute("y1", from.offsetTop + from.clientHeight / 2);
				ui.lines.appendChild(c);
		}

		if (ui.connect.to.elem) {
			// code
		} else {
			c.setAttribute("x2", ui.connect.to.x);
			c.setAttribute("y2", ui.connect.to.y);
		}
	}

	if (!update)
		project.connections.forEach((c) => {
			// code
		});
}

// add keybindings
document.addEventListener("keydown", (e) => {
	switch (e.key) {
		// deselect
		case "Escape": {
			//ui.flock = false; // update performs this automatically, for now
			ui.connect = null;
			update();
		} break;

		// remove/remove char
		case "Backspace": {
			let f = ui.fblock;
			if (f) {
				let t = project.columns[f.col][f.row];
				project.columns[f.col][f.row] = project.columns[f.col][f.row].substring(0, t.length - 1);
				f.elem.innerText = project.columns[f.col][f.row];
			}
		} break;

		// connect
		case "c": if (e.altKey) {
			ui.connect = {
				from: ui.fblock,
				to: { x: ui.mouse.x, y: ui.mouse.y },
			}

			connect();
			break;
		}

		// normal typing
		default: {
			let f = ui.fblock;
			if (f && "qwertyuiopasdfghjklzxcvbnm1234567890!@#$%^&*(){}[]:;\"'<>,.?/|\\`~ ".includes(e.key.toLowerCase())) {
				project.columns[f.col][f.row] += e.key;
				f.elem.innerText = project.columns[f.col][f.row];
			}
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

// mouse movement
document.addEventListener("mousemove", (e) => {
	ui.mouse.x = e.clientX;
	ui.mouse.y = e.clientY;

	if (ui.connect) {
		ui.connect.to = { x: ui.mouse.x, y: ui.mouse.y };
		connect(true);
	}
});

// assign actions
document.getElementById("close").addEventListener("click", () =>
	window.close());

// initialize
update();
