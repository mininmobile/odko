{ // generate sidebar content
	let ui = elements.ui; // sanity

	createButtons([ // create project buttons
		// general project management
		{ name: "new", data: { hotkey: "^n" }, action: () => {
			if (confirm("this will wipe the project")) {
				project = { "main": [[]] };
				currentTable = "main";
				table = project[currentTable];
				update();
			}
			} },
		{ name: "save", data: { hotkey: "^s" }, action: () =>
			prompt("copy this json:", save()) },
		{ name: "load", data: { hotkey: "^o" }, action: () =>
			load(prompt("enter  json:")) },
		// branch management
		{ name: "delete branch", data: { hotkey: "^X" }, class: "shortcut", action: () => deleteBranchUI(confirm("this will delete the current branch")) },
		{ name: "create branch", data: { hotkey: "^A" }, class: "shortcut", action: () => createBranchUI(prompt("enter new branch name")) },
		{ name: "rename branch", data: { hotkey: "F2" }, class: "shortcut", action: () => renameBranchUI(prompt("enter new branch name")) },
	], ui.project);

	function createButtons(array, parent) {
		array.forEach((btn) => {
			let button = document.createElement("a");
			button.addEventListener("click", btn.action);
			button.innerText = btn.name;
			parent.appendChild(button);

			if (btn.class)
				button.classList.add(btn.class);

			if (btn.data)
				Object.keys(btn.data).forEach((attr) =>
					button.setAttribute("data-" + attr, btn.data[attr]));
		});
	}
}

// open the  context menu
function openContext(x, y, items) {
	let context = elements.contextWrapper;
	// update items if items are specified
	if (items !== undefined) {
		context.innerHTML = "";
		items.forEach((btn) => {
			let button = document.createElement("a");
			button.innerText = btn.name;
			context.appendChild(button);

			button.addEventListener("click", () => {
				btn.action();
				closeContext();
			});

			if (button.hotkey)
				button.setAttribute("data-hotkey", btn.hotkey);
		});
	}
	// move if position is specified
	if (x !== undefined && y !== undefined) {
		context.style.left = x + "px";
		context.style.top = y + "px";
	}
	// show context menu
	context.classList.remove("hidden");
	// enable close events
	document.onmouseup = (e) => {
		if (e.clientX == x && e.clientY == y)
			return;

		e.preventDefault();
		e.stopPropagation();
		if (!context.isSameNode(e.target.parentNode))
			closeContext();
	}
	document.onkeydown = (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.key == "Escape")
			closeContext();
	}
}

// hide the context menu
function closeContext(clear = false) {
	// disable close events
	document.onmouseup = undefined;
	document.onkeydown = undefined;

	let context = elements.contextWrapper;
	if (clear)
		context.innerHTML = "";
	context.classList.add("hidden");
}

// rename the current branch (safety, to be used with ui code)
function renameBranchUI(newName) {
	// checks if newName is valid
	if (newName == false || newName == undefined || newName == "")
		throw "no new branch name specified";
	if (currentTable == "main")
		throw "cannot rename main branch";
	if (newName == "main")
		throw "cannot create new main branch";
	if (project[newName] !== undefined)
		throw "branch with that name already exists";
	// if newName is valid, rename
	renameBranch(newName);
}

// delete the current branch (safety, to be used with ui code)
function deleteBranchUI(confirm) {
	if (confirm === true) {
		if (currentTable == "main")
			throw "cannot delete main branch";

		deleteBranch();
	} else {
		throw "confirmation denied";
	}
}

// create a new branch (safety, to be used with ui code)
function createBranchUI(newName) {
	// checks if newName is valid
	if (newName == false || newName == undefined || newName == "")
		throw "no new branch name specified";
	if (project[newName] !== undefined)
		throw "branch with that name already exists";
	// if newName is valid, rename
	createBranch(newName);
}

// save/load program
function load(json) {
	if (json == null || json == undefined || json == false)
		return false;

	if (Array.isArray(json))
		project = json;
	else
		project = JSON.parse(json);

	currentTable = "main";
	table = project[currentTable];
	reparseAll();
	update();
}

function save() {
	let exportProject = {};

	Object.keys(project).forEach((t) => {
		exportProject[t] = [];
		// go through every column
		for (let x = 0; x < project[t].length; x++) {
			// add new column to the export table
			exportProject[t][x] = [];
			// go through every row
			for (let y = 0; y < project[t][x].length; y++) {
				let block = project[t][x][y];
				// add row to export table
				exportProject[t][x][y] = { v: block.v, c: block.c }
			}
		}
	});

	console.log(JSON.stringify(exportProject));
	return JSON.stringify(exportProject);
}
