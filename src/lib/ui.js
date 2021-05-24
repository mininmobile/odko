elements.ui = {
	sidebar: document.getElementById("sidebar"),
	project: document.getElementById("sidebar-project"),
	branches: document.getElementById("sidebar-branches"),
}

{
	let ui = elements.ui; // sanity

	[ // create project buttons
		{ name: "new", action: () =>
			(table = [[]]) && (update()) },
		{ name: "save", action: () =>
			prompt("copy this json:", save()) },
		{ name: "load", action: () =>
			load(prompt("enter  json:")) },
	].forEach((btn) => {
		let button = document.createElement("a");
		button.addEventListener("click", btn.action);
		button.innerText = btn.name;
		ui.project.appendChild(button);
	});
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
