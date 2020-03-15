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
	titlebar: document.getElementById("titlebar"),
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

	// add blocks
	if (project.columns.length > 0) // optimization check for columns at all
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
							// FIXME remove connections to/from blocks in column when deleted

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
							// FIXME remove connections to/from block when deleted

							e.stopPropagation();
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
		let l;

		let from = ui.connect.from.elem;

		if (ui.lines.children[0]) {
			l = ui.lines.children[0];
		} else {
			l = document.createElementNS("http://www.w3.org/2000/svg", "line");
				l.setAttribute("x1", from.offsetLeft + from.clientWidth);
				l.setAttribute("y1", from.offsetTop + from.clientHeight / 2);
				ui.lines.appendChild(l);
		}

		if (ui.connect.to) {
			let to = ui.connect.to.elem;
			l.setAttribute("x2", to.offsetLeft);
			l.setAttribute("y2", to.offsetTop + to.clientHeight / 2);
		} else {
			l.setAttribute("x2", ui.mouse.x);
			l.setAttribute("y2", ui.mouse.y);
		}
	}

	if (!update)
		project.connections.forEach((c, i) => {
			// TODO ignore and delete connection if block/col doesn't exist
			let from = ui.content.children[c.x1].children[c.y1];
			let to = ui.content.children[c.x2].children[c.y2];

			let l = document.createElementNS("http://www.w3.org/2000/svg", "line");
				ui.lines.appendChild(l);

			l.setAttribute("x1", from.offsetLeft + from.clientWidth);
			l.setAttribute("y1", from.offsetTop + from.clientHeight / 2);
			l.setAttribute("x2", to.offsetLeft);
			l.setAttribute("y2", to.offsetTop + to.clientHeight / 2);
		});
}

// add keybindings
document.addEventListener("keydown", (e) => {
	switch (e.key) {
		// deselect
		case "Escape": deselect(); break;

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
				to: null,
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
		if (ui.connect) {
			if (e.target != ui.fblock.elem) project.connections.push({
				x1: ui.connect.from.col,
				y1: ui.connect.from.row,
				x2: ui.connect.to.col,
				y2: ui.connect.to.row,
			});

			deselect();
			connect();
		} else if (e.target != ui.fblock.elem) {
			deselect();
		}
	}
});

// mouse movement
document.addEventListener("mousemove", (e) => {
	ui.mouse.x = e.clientX;
	ui.mouse.y = e.clientY - ui.titlebar.clientHeight;

	if (ui.connect) {
		ui.connect.to = null;

		let from = ui.connect.from.elem;

		if (!from.parentElement.nextElementSibling.classList.contains("new")) {
			let c = from.parentElement.nextElementSibling.children;

			if (c.length > 0) {
				let ce = null;
				let cd = 0;

				for (let i = 0; i < c.length; i++) {
					let e = c[i];
					let d = dist(ui.mouse.x, ui.mouse.y, e.offsetLeft, e.offsetTop);
					e.classList.remove("focus");

					if (cd > d || i == 0) {
						ce = e;
						cd = d;
					}
				}

				ui.connect.to = {
					col: myindex(ce.parentElement),
					row: myindex(ce),
					elem: ce,
				}
				ce.classList.add("focus");
			}
		}

		connect(true);
	}
});

// assign actions
document.getElementById("close").addEventListener("click", () =>
	window.close());

// initialize
update();

// helper functions
// functions that abstract things that are specific to odko
function deselect() {
	// update performs these automatically, for now
	//ui.flock = false;
	//ui.connect = null;
	update();
}

// util functions
// functions that abstract things that aren't specific to odko
function dist(x1, y1, x2, y2) {
	return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function myindex(elem) {
	let e = elem;
	let i = 0;

	while ((e = e.previousSibling) != null)
		i++;

	return i;
}
