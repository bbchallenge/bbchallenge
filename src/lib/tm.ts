export type TM = Uint8Array;

export const DB_SIZE = 88664064;

export function encodedTransitionToString(transition): string {
	try {
		if (transition[2] == 0) {
			return '---';
		}

		let toReturn = '';

		if (transition[0] > 1) throw 'Invalid machine description [write symbol]';
		toReturn += String.fromCharCode(48 + transition[0]);

		if (transition[1] == 0) {
			toReturn += 'R';
		} else if (transition[1] == 1) {
			toReturn += 'L';
		} else {
			throw 'Invalid machine description [move symbol]';
		}

		toReturn += String.fromCharCode(65 + (transition[2] - 1));

		return toReturn;
	} catch (error) {
		return 'invalid';
	}
}

export function tmToMachineCode(machine: Uint8Array): string {
	let to_return = '';
	for (let i = 0; i < machine.length; i += 3) {
		to_return += encodedTransitionToString(machine.slice(i, i + 3));
	}
	return to_return;
}

export function machineCodeToTM(machineCode: string) {
	if (machineCode.length % 6 !== 0) throw 'Invalid TM code.';

	const tm = new Uint8Array(machineCode.length);
	for (let i = 0; i < machineCode.length; i++) {
		if (machineCode[i] == '0' || machineCode[i] == 'R' || machineCode[i] == '-') tm[i] = 0;
		else if (machineCode[i] == '1' || machineCode[i] == 'L') tm[i] = 1;
		else {
			// Alphabetical state name
			tm[i] = machineCode.charCodeAt(i) - 'A'.charCodeAt(0) + 1;
		}
	}
	return tm;
}

export function legacy_tmTob64URLSafe(machine: TM) {
	let binary = '';
	const len = machine.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(machine[i]);
	}
	return 'm' + btoa(binary).replace('+', '-').replace('/', '_').replace(/=+$/, '');
}

export function legacy_b64URLSafetoTM(base64URLSafe: string) {
	if (base64URLSafe[0] != 'm') throw "Invalid TM base64 description: must start with 'm'.";

	const base64 = base64URLSafe.substring(1).replace('-', '+').replace('_', '/');
	const binary = atob(base64);
	const tm = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		tm[i] = binary.charCodeAt(i);
	}
	return tm;
}

export function tmToTuringMachineDotIO(machine: TM) {
	let toReturn = "blank: '0'\n";
	toReturn += 'start state: A\n';
	toReturn += 'table:\n';

	for (let i = 0; i < machine.length / 6; i += 1) {
		const trans0 = machine.slice(6 * i, 6 * i + 3);
		const trans1 = machine.slice(6 * i + 3, 6 * i + 6);
		toReturn += '  ' + String.fromCharCode(65 + i) + ':\n';
		if (trans0[2] != 0) {
			toReturn +=
				'    ' +
				`0: {write: ${trans0[0]}, ${trans0[1] == 0 ? 'R' : 'L'}: ${String.fromCharCode(
					65 + trans0[2] - 1
				)}}\n`;
		}
		if (trans1[2] != 0) {
			toReturn +=
				'    ' +
				`1: {write: ${trans1[0]}, ${trans1[1] == 0 ? 'R' : 'L'}: ${String.fromCharCode(
					65 + trans1[2] - 1
				)}}\n`;
		}
	}
	return toReturn;
}

export enum TMDecisionStatus {
	UNDECIDED = 'undecided',
	DECIDED_HALT = 'halt',
	DECIDED_NON_HALT = 'non_halt'
}

export function APIDecisionStatusToTMDecisionStatus(status) {
	if (status === null) {
		return null;
	}

	let machineStatus = TMDecisionStatus.UNDECIDED;
	if (status == 'decided') {
		machineStatus = TMDecisionStatus.DECIDED_NON_HALT;
	} else if (status == 'heuristic') {
		machineStatus = TMDecisionStatus.UNDECIDED; //TMDecisionStatus.HEURISTICALLY_DECIDED_NON_HALT;
	} else {
		machineStatus = TMDecisionStatus.UNDECIDED;
	}
	return machineStatus;
}

const colorList = [
	[255, 0, 0],
	[255, 128, 0],
	[0, 0, 255],
	[0, 255, 0],
	[255, 0, 255],
	[0, 255, 255],
	[255, 255, 0]
];

export function machine_run_history(machine, initial_tape = { 0: 0 }, steps = 1000) {
	const history = [];

	const tape = {};
	for (const pos in initial_tape) {
		tape[pos] = initial_tape[pos];
	}

	let curr_state = 0;
	let curr_pos = 0;
	const copyTape = { ...tape };
	history.push({ copyTape, curr_state, curr_pos });

	for (let currStep = 0; currStep < steps; currStep += 1) {
		[curr_state, curr_pos] = step(machine, curr_state, curr_pos, tape);
		const copyTape = { ...tape };
		history.push({ copyTape, curr_pos, curr_state });
		if (curr_state === null || curr_state >= machine.length / 6) {
			break;
		}
	}
	return history;
}

export function tm_explore(
	ctx: CanvasRenderingContext2D,
	machine,
	initial_tape = { 0: 0 },
	height = 1000
) {
	const history = machine_run_history(machine, initial_tape, height);

	let zoom = 10;
	let x_offset = ctx.canvas.width / 2;
	let y_offset = 0;

	const MAX_SCROLL_Y = 20;

	const render = () => {
		const height = Math.ceil(ctx.canvas.height / zoom);
		const width = Math.ceil(ctx.canvas.width / zoom);
		const minx = Math.floor(-x_offset / zoom);
		const miny = Math.floor(-y_offset / zoom);

		ctx.fillStyle = `rgb(255, 255, 255)`;
		for (let row = Math.max(miny, 0); row < Math.min(miny + height + 1, history.length); row++) {
			if (!history[row]) continue;
			const tape = history[row].copyTape;

			for (const colS in tape) {
				const col = parseInt(colS)
				if (col < minx || col > minx + width) continue;

				if (tape[colS]) {
					ctx.fillRect(col, row, 1, 1);
				}
			}
		}

		for (let row = Math.max(miny, 0); row < Math.min(miny + height + 1, history.length); row++) {
			if (!history[row]) continue;
			const { curr_pos, curr_state } = history[row];

			if (curr_state < colorList.length) {
				ctx.fillStyle = `rgb(${colorList[curr_state].join(', ')})`;
				ctx.fillRect(curr_pos, row, 1, 1);
			}
		}
	};

	const wheel = (e: WheelEvent) => {
		e.preventDefault();

		if (e.ctrlKey) {
			const scale = Math.pow(1.1, -e.deltaY / 10);
			x_offset = (x_offset - e.offsetX) * scale + e.offsetX;
			y_offset = (y_offset - e.offsetY) * scale + e.offsetY;
			zoom *= scale;
		} else {
			y_offset -= e.deltaY;
			x_offset -= e.deltaX;
		}
		// Preventing user from scrolling too far up in y
		y_offset = Math.min(y_offset, MAX_SCROLL_Y);

		ctx.resetTransform();
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.setTransform(zoom, 0, 0, zoom, +x_offset, +y_offset);
		render();
	};
	ctx.canvas.addEventListener('wheel', wheel, false);

	ctx.resetTransform();
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.setTransform(zoom, 0, 0, zoom, +x_offset, +y_offset);
	render();

	return () => ctx.canvas.removeEventListener('wheel', wheel);
}

export function tm_trace_to_image(
	ctx: CanvasRenderingContext2D,
	machine,
	initial_tape = { 0: 0 },
	width = 900,
	height = 1000,
	origin_x = 0.5,
	fitCanvas = true,
	showHeadMove = false
) {
	const imgData = ctx.createImageData(width, height);

	const history = machine_run_history(machine, initial_tape, height);

	for (let row = 1; row < history.length; row += 1) {
		const last_pos = history[row - 1].curr_pos;
		const tape = history[row].copyTape;
		const { curr_pos } = history[row];
		for (const posS in tape) {
			const pos = parseInt(posS);
			const col = pos + Math.floor(width * origin_x);
			if (col < 0 || col >= width) continue;

			if (pos == curr_pos && showHeadMove) {
				const imgIndex = 4 * (row * width + col);
				imgData.data[imgIndex + 0] = curr_pos > last_pos ? 255 : 0;
				imgData.data[imgIndex + 1] = curr_pos < last_pos ? 255 : 0;
				imgData.data[imgIndex + 2] = 0;
				imgData.data[imgIndex + 3] = 255;
			} else if (tape[posS] != undefined) {
				const imgIndex = 4 * (row * width + col);
				let color = 255;
				if (tape[posS] === 0) color = 0;
				imgData.data[imgIndex + 0] = color;
				imgData.data[imgIndex + 1] = color;
				imgData.data[imgIndex + 2] = color;
				imgData.data[imgIndex + 3] = 255;
			}
		}
	}

	if (fitCanvas) {
		const renderer = document.createElement('canvas');
		renderer.width = width;
		renderer.height = height;
		// render our ImageData on this canvas
		renderer.getContext('2d').putImageData(imgData, 0, 0);

		ctx.drawImage(renderer, 0, 0, width, height, 0, 0, ctx.canvas.width, ctx.canvas.height);
	} else {
		// ctx.canvas.height = height;
		ctx.putImageData(imgData, 0, 0);
	}
}

export function step(machine: TM, curr_state, curr_pos, tape) {

	if (tape[curr_pos] === undefined) {
		tape[curr_pos] = 0;
	}

	const write = machine[curr_state * 6 + 3 * tape[curr_pos]];
	const move = machine[curr_state * 6 + 3 * tape[curr_pos] + 1];
	const goto = machine[curr_state * 6 + 3 * tape[curr_pos] + 2] - 1;

	if (goto == -1) return [null, null];

	tape[curr_pos] = write;
	const next_pos = curr_pos + (move ? -1 : 1);
	return [goto, next_pos];
}
