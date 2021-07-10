addEventListener("keydown", e => {
	if (!(e.key == "I" && e.ctrlKey && e.shiftKey || e.key == "r" && e.ctrlKey))
		e.preventDefault();

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

			case "`": { // toggle console
				// set variables
				mode = 4;
				run.state = 0;
				run.registers = {};
				run.events = [];
				run.queue = [];
				conClear();
				// disable debug view
				if (debug) {
					elements.columns.classList.remove("debug");
					debug = false;
					updateConnections();
				}
				// show console
				elements.consoleWrapper.classList.remove("hidden");
				// gather events
				setTimeout(() => findEvents(), 16);
			} break;

			// test current block
			case "t": if (_e) test(selected.x, selected.y); break;
			// activate move mode
			case "g": if (_e) mode = 3; break;
			// force reparse current block
			case "p": if (_e) table[selected.x][selected.y].t = parse(table[selected.x][selected.y].v); break;
			// force reparse all blocks
			case "P": reparseAll(); break;

			// add block
			case "a": addBlock(); break;

			// add column
			case "A": addColumn(); break;

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

			// delete column
			case "Delete": deleteColumn(); break;

			case "d": if (_e) { // disconnect left of block
				table[selected.x][selected.y].c = [];
				updateConnections();
			} break;

			case "D": if (table[selected.x + 1]) { // disconnect right of block
				table[selected.x + 1]
					.forEach(r => r.c = r.c.filter(c => c != selected.y));

				updateConnections();
			} break;

			case "e": case "Enter": case "F2": // edit mode
				if (_e) {
					mode = 1;
					editCursor = table[selected.x][selected.y].v.length;
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
				table[selected.x][selected.y].t = parse(table[selected.x][selected.y].v);
				getFocusedElement().classList.remove("editing");
			} break;

			case "ArrowLeft": { // move cursor left
				editCursor--;
				if (editCursor < 0)
					editCursor = 0;
			} break;

			case "ArrowRight": { // move cursor right
				editCursor++;
				if (editCursor > getFocused().v.length - 1)
					editCursor = getFocused().v.length;
			} break;

			case "ArrowUp": case "Home": // move cursor to start
				editCursor = 0; break;
			case "ArrowDown": case "End": // move cursor to end
				editCursor = getFocused().v.length; break;

			case "Backspace": { // delete char behind cursor
				getFocusedElement().innerText =
					table[selected.x][selected.y].v =
						remove(getFocused().v, editCursor - 1);

				editCursor--;

				if (editCursor < 0)
					editCursor = 0;
			} break;

			case "Delete": { // delete char in front of cursor
				getFocusedElement().innerText =
					table[selected.x][selected.y].v =
						remove(getFocused().v, editCursor);
			} break;

			default: // normal typing
				if (getFocused().v.length < 7) { // limit block size
					// check for valid character
					if ("01234567890-_=+qwertyuiopasdfghjklzxcvbnm`~!@#$%^&*()[]{}:;',./<>? \"\\".includes(e.key.toLowerCase())) {
						// append char at cursor
						getFocusedElement().innerText =
							table[selected.x][selected.y].v =
								insert(getFocused().v, e.key, editCursor);

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

				// TODO also add this to the case below
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

				// TODO stop using updateConnections so much
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

				// TODO stop using update connections too much
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
	} else if (mode == 4) { // run mode
		switch (e.key) {
			case "`": { // exit run mode
				mode = 0;
				// reset state
				run.state = 0;
				run.registers = {};
				run.events = [];
				run.queue = [];
				// hided console
				elements.consoleWrapper.classList.add("hidden");
			} break;

			case "Tab": {
				// if user wants to halt
				// nested ifs to break if not running, so you can't hold Shift + Tab to rapidly restart the execution over and over
				if (e.shiftKey) {
					if (run.state == 1) {
						run.state = 0;
						run.registers = {};
						run.events = [];
						run.queue = [];
						conLog("=> halted execution");
					}

					break;
				}
				if (run.state == 0|| run.state == 3) {
					run.state = 1;
					conLog("=> start of execution");
					// run onRun events
					eventsFiltered.run.forEach(executeEvent);
				} else if (run.state == 2) {
					// unpause lol
					run.state = 1;
				} else if (run.state == 1) {
					// pause lol
					run.state = 2;
				}
			} break;

			case "F12": if (run.state == 1 || run.state == 2) {
				if (e.shiftKey && run.state !== 3) {
					run.state = 3;
					run.queue = [];
					conLog("=> halted execution (preserve registers)");
				} else {
					run.state = 0;
					run.registers = {};
					run.events = [];
					run.queue = [];
					conLog("=> halted execution");
				}
			} break;

			// only trigger onKey functions when running
			default: if (run.state == 1)
				runEvent(e);
		}
	}

	updateStatus();
});

addEventListener("keyup", (e) => {
	e.preventDefault();

	if (mode == 4) { // run mode
		switch (e.key) {
			case "`": case "Tab": case "F12": break;

			// only trigger onKey functions when running
			default: if (run.state == 1)
				runEvent(e);
		}
	}
});

/**
 * @param {MouseEvent} e
 * @param {HTMLElement} col
 * @param {HTMLElement} row
*/
function _onElementClick(e, col, row) {
	if (!(mode == 0 || mode == 2) || isContextOpen())
		return;

	let x = childIndexOf(col);
	let y = childIndexOf(row);

	if (e.button == 0) {
		let fc; // focused column
		let fb; // focused block
		// defocus old
		if (fc = getFocusedColumn())
			fc.classList.remove("focus");
		if (fb = getFocusedElement())
			fb.classList.remove("focus");
		// focus new
		selected.x = x;
		selected.y = y;
		if (fc = getFocusedColumn())
			fc.classList.add("focus");
		if (fb = getFocusedElement())
			fb.classList.add("focus");
		updateStatus();
	} else if (e.button == 2) {
		// spawn context menu
	}
}

/**
 * @param {MouseEvent} e
 * @param {HTMLElement} col
*/
function _onColumnClick(e, col) {
	if (!(mode == 0 || mode == 2) || isContextOpen()|| !e.target.classList.contains("column"))
		return;

	let x = childIndexOf(col);

	if (e.button == 0 && selected.x == x)
		return addBlockUI();

	if (selected.x != x) {
		let fc; // focused column
		let fb; // focused block
		// defocus old
		if (fc = getFocusedColumn())
			fc.classList.remove("focus");
		if (fb = getFocusedElement())
			fb.classList.remove("focus");
		// focus new
		selected.x = x;
		selected.y = Math.min(selected.y, table[selected.x].length - 1);
		if (fc = getFocusedColumn())
			fc.classList.add("focus");
		updateStatus();
	}

	if (e.button == 2) {
		openContext(e.clientX, e.clientY, [
			{ name: "add block", hotkey: "a", action: addBlockUI },
			{ name: "add column", hotkey: "A", action: addColumnUI },
			{ name: "delete column", hotkey: "Del", action: deleteColumnUI },
		]);
		return;
	}
}

// add block at selected column, remove previous selected element class
function addBlockUI() {
	let fb;
	if (fb = getFocusedElement())
		fb.classList.remove("focus");
	addBlock();
	getFocusedElement().classList.add("focus");
}

// add column after selected column, remove previous selected col class
function addColumnUI() {
	let fc;
	let fb;
	if (fc = getFocusedColumn())
		fc.classList.remove("focus");
	if (fb = getFocusedElement())
		fb.classList.remove("focus");
	addColumn();
	getFocusedColumn().classList.add("focus");
}

// delete column, set new selected element class
function deleteColumnUI() {
	deleteColumn();
	let fc;
	if (fc = getFocusedColumn())
		fc.classList.add("focus");
}

// add block at selected column
function addBlock() {
	if (table.length == 0) {
		table[0] = [];
		selected.x = selected.y = 0;
		update();
	}

	let wasEmpty = table[selected.x].length == 0;

	let col = elements.columns.children[selected.x];
	table[selected.x].splice(selected.y + 1, 0, { v: "", t: [], c: [] });
	let row = document.createElement("div");
	row.classList.add("row");
	row.addEventListener("mouseup", (e) => _onElementClick(e, col, row));
	col.insertBefore(row, col.childNodes[selected.y + 1]);

	if (!wasEmpty)
		selected.y++;

	updateConnections();
	updateStatus();
}

function addColumn() {
	table.splice(selected.x + 1, 0, []);
	let col = document.createElement("div");
	col.classList.add("column");
	col.addEventListener("mouseup", (e) => _onColumnClick(e, col));
	elements.columns.insertBefore(col, elements.columns.childNodes[selected.x + 1]);

	selected.x++;
	selected.y = 0;

	updateConnections();
	updateStatus();
}

function deleteColumn() {
	if (table.length == 0)
		return;

	table.splice(selected.x, 1);
	elements.columns.removeChild(elements.columns.childNodes[selected.x]);

	// if this row connected to the one behind it, no
	if (table[selected.x])
		table[selected.x].forEach(r => r.c = []);

	updateConnections();
	updateStatus();
}
