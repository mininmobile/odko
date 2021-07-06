// elements.ui = {
// 	sidebar: getElement("sidebar"),
// 	project: getElement("sidebar-project"),
// 	branches: getElement("sidebar-branches"),
// }

{ // generate sidebar content
	let ui = elements.ui; // sanity

	createButtons([ // create project buttons
		// general project management
		{ name: "new", action: () => {
			if (confirm("this will wipe the project")) {
				project = { "main": [[]] };
				currentTable = "main";
				table = project[currentTable];
				update();
			}
			} },
		{ name: "save", action: () =>
			prompt("copy this json:", save()) },
		{ name: "load", action: () =>
			load(prompt("enter  json:")) },
		// branch management
		{ name: "rename branch", data: { hotkey: "F2" }, class: "shortcut", action: () => renameBranchUI(prompt("enter new branch name")) },
		{ name: "create branch", data: { hotkey: "^A" }, class: "shortcut", action: () => createBranchUI(prompt("enter new branch name")) },
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

// rename a branch (safety, to be used with ui code)
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
		table = json;
	else
		table = JSON.parse(json);

	reparseAll();
	update();
}

function save() {
	let exportTable = [];

	// go through every column
	for (let x = 0; x < table.length; x++) {
		// add new column to the export table
		exportTable[x] = [];
		// go through every row
		for (let y = 0; y < table[x].length; y++) {
			let block = table[x][y];
			// add row to export table
			exportTable[x][y] = { v: block.v, c: block.c }
		}
	}

	console.log(JSON.stringify(exportTable));
	return JSON.stringify(exportTable);
}
