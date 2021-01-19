let consoleData = {
	w: 400,
	h: 300,
	c: undefined,
	ctx: undefined,
	text: "",
	drag: false,
}

function initConsole() {
	let _c = consoleData; // sanity

	let canvas = _c.c = elements.consoleCanvas;
	let ctx = _c.ctx = canvas.getContext("2d");
	ctx.lineWidth = 2;
	ctx.font = "1em \"Space Mono\", monospace";
	updateConsole();

	// detect titlebar drag
	attachDragHandler(elements.consoleTitlebar, elements.consoleWrapper);
	// detect window resize
	let observer = new MutationObserver(updateConsole);
	observer.observe(elements.consoleWrapper, { attributes: true });
}

function updateConsole() {
	if (consoleData.drag) return;

	let w = Math.floor(elements.consoleWrapper.clientWidth / ch(1)) * ch(1) - ch(1);
	let h = Math.floor(elements.consoleWrapper.clientHeight / em(1)) * em(1) - em(2.5);

	consoleData.c.width = consoleData.w = w;
	consoleData.c.height = consoleData.h = h;
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
