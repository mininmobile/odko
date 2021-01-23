let consoleData = {
	w: 400,
	h: 300,
	/** @type {HTMLElement} */
	c: undefined,
	/** @type {CanvasRenderingContext2D} */
	ctx: undefined,
	text: [],
	drag: false,
	timeout: null,
}

function initConsole() {
	let _c = consoleData; // sanity

	let canvas = _c.c = elements.consoleCanvas;
	let ctx = _c.ctx = canvas.getContext("2d");
	updateConsole(true);

	// detect titlebar drag
	attachDragHandler(elements.consoleTitlebar, elements.consoleWrapper);
	// detect window resize
	let observer = new MutationObserver(() => updateConsole());
	observer.observe(elements.consoleWrapper, { attributes: true });
	// mouse events
	attachConsoleClickHandlers();

	// aaa();
}

function updateConsole(noResize = false) {
	let w = Math.floor(elements.consoleWrapper.clientWidth / ch(1)) * ch(1) - ch(1);
	let h = Math.floor(elements.consoleWrapper.clientHeight / em(1)) * em(1) - em(1.5);

	if (consoleData.drag || noResize) {
		elements.consoleTitlebar.innerText = "console";
	} else {
		elements.consoleTitlebar.innerText = `console [${w / ch(1) - 1}x${h / em(1) - .5}]`;
		clearTimeout(consoleData.timeout);
		consoleData.timeout = setTimeout(() => {
			elements.consoleTitlebar.innerText = "console";
			clearTimeout(consoleData.timeout);
		}, 500);
	}

	consoleData.c.width = consoleData.w = w;
	consoleData.c.height = consoleData.h = h;
	consoleData.ctx.lineWidth = 2;
	consoleData.ctx.font = "1rem \"Space Mono\", monospace";

	consoleDraw();
}

function consoleDraw() {
	let ctx = consoleData.ctx; // sanity
	// clear screen
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, consoleData.w, consoleData.h);
	// draw text
	ctx.fillStyle = "#dddddd";
	consoleData.text.forEach((t, i) => {
		ctx.fillText(t, 0, em(i + 1));
	});
}

function conLog(text) {
	consoleData.text.unshift(text);
	consoleDraw();
	return text;
}

function conClear() {
	consoleData.text = [];
	consoleDraw();
}

/**
 * @param {Element} handle
 * @param {Element} wrapper
 */
function attachDragHandler(handle, wrapper) {
	handle.onmousedown =
		e => e.button == 0 ? windowDragEvent(e, wrapper) : undefined;

	wrapper.onmousedown =
		e => e.altKey && e.button == 0 ? windowDragEvent(e, wrapper) : undefined;

	/**
	 * @param {MouseEvent} e
	 * @param {Element} w
	 */
	function windowDragEvent(e, w) {
		consoleData.drag = true;

		let pos1 = 0,
			pos2 = 0,
			pos3 = 0,
			pos4 = 0;

		// get mouse position on start
		pos3 = e.clientX;
		pos4 = e.clientY;

		// attach event listeners
		document.onmouseup = closeDrag;
		document.onmousemove = elementDrag;

		/** @param {MouseEvent} e */
		function elementDrag(e) {
			// calculate new mouse position
			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;

			// calculate x offset
			let nx = w.offsetLeft - pos1;
			// always on screen
			nx = nx >= 0 ? nx : 0;
			nx = nx <= window.innerWidth - w.clientWidth ? nx : window.innerWidth - w.clientWidth;

			// calculate y offset
			let ny = w.offsetTop - pos2;
			// always below statusbar
			ny = ny >= em(1.5) ? ny : em(1.5);
			// always on screen
			ny = ny <= window.innerHeight - w.clientHeight ? ny : window.innerHeight - w.clientHeight;

			// move to new mouse position
			w.style.left = nx + "px";
			w.style.top = ny + "px";
		}

		function closeDrag() {
			consoleData.drag = false;
			// detach event listeners
			document.onmouseup = null;
			document.onmousemove = null;
		}
	}
}

function attachConsoleClickHandlers() {
	elements.consoleCanvas.addEventListener("mousedown", (e) => {
		if (mode == 4 && run.state == 1)
				findEvents(1, e, false).forEach(event => runFrom(0, event.origin, event.values, [event.origin]));
	});

	elements.consoleCanvas.addEventListener("mouseup", (e) => {
		if (mode == 4 && run.state == 1)
				findEvents(1, e, true).forEach(event => runFrom(0, event.origin, event.values, [event.origin]));
	});
}
