const path = require("path");
const url = require("url");
const { app, BrowserWindow } = require("electron");

let win;

function createWindow() {
	win = new BrowserWindow({
		//icon: path.join(__dirname, "src/img/"),
		minWidth: 400,
		minHeight: 400,
		resizable: true,
		title: "odko",
		backgroundColor: "#212121",
		frame: false,
		webPreferences: {
			nodeIntegration: true,
		}
	});

	win.loadURL(url.format({
		pathname: path.join(__dirname, "src/index.html"),
		protocol: "file:",
		slashes: true,
	}));

	win.focus();

	win.on("closed", app.quit);
}

app.on("window-all-closed", () => app.quit());
app.on("ready", createWindow);
