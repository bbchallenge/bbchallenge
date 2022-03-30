export type TM = Uint8Array;

export const DB_SIZE = 88664064;

export function tmTob64URLSafe(machine: TM) {
	let binary = '';
	const len = machine.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(machine[i]);
	}
	return 'm' + btoa(binary).replace('+', '-').replace('/', '_').replace(/=+$/, '');
}

export function b64URLSafetoTM(base64URLSafe: string) {
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
	UNDECIDED,
	HEURISTICALLY_DECIDED_HALT,
	HEURISTICALLY_DECIDED_NON_HALT,
	DECIDED_HALT,
	DECIDED_NON_HALT
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

function intToNatural(n: number) {
	return n < 0 ? 1 - n * 2 : n * 2;
}
function naturalToInt(n: number) {
	return n % 2 == 0 ? n / 2 : -(n + 1) / 2;
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

export function render_history(machine, initial_tape = '0', height = 1000) {
	const history = [];

	let tape = [];
	for (let i = 0; i < initial_tape.length; i++) {
		tape[intToNatural(i)] = +initial_tape[i];
	}

	let curr_state = 0;
	let curr_pos = 0;
	history.push({ tape, curr_state, curr_pos });

	for (let row = 0; row < height; row += 1) {
		tape = [...tape];
		[curr_state, curr_pos] = step(machine, curr_state, curr_pos, tape);
		history.push({ tape, curr_pos, curr_state });
		if (curr_state === null || curr_state >= machine.length / 6) {
			break;
		}
	}
	return history;
}

export function tm_explore(
	ctx: CanvasRenderingContext2D,
	machine,
	initial_tape = '0',
	height = 1000
) {
	const history = render_history(machine, initial_tape, height);

	let zoom = 1;
	let x_offset = ctx.canvas.width / 2;
	let y_offset = 0;

	const render = () => {
		const height = Math.ceil(ctx.canvas.height/zoom);
		const width = Math.ceil(ctx.canvas.width/zoom);
		const minx = Math.floor(-x_offset/zoom);
		const miny = Math.floor(-y_offset/zoom)

		ctx.fillStyle = `rgb(255, 255, 255)`;
		for (let row = Math.max(miny, 0); row < Math.min(miny+height+1, history.length); row += 1) {
			if (!history[row]) continue;
			const { tape } = history[row];

			for (let i = 0; i < tape.length; i += 1) {
				const col = naturalToInt(i);
				if (col<minx || col>minx+width) continue

				if (tape[i] !== 0) {
					ctx.fillRect(col, row, 1, 1);
				}
			}
		}

		for (let row = Math.max(miny, 0); row < Math.min(miny+height+1, history.length); row += 1) {
			if (!history[row]) continue;
			const { tape, curr_pos, curr_state } = history[row];

			for (let i = 0; i < tape.length; i += 1) {
				const col = naturalToInt(i);
				if (col<minx || col>minx+width) continue;
				
				if (col == curr_pos && curr_state < colorList.length) {
					ctx.fillStyle = `rgb(${colorList[curr_state].join(', ')})`;
					ctx.fillRect(col, row, 1, 1);
				}
			}
		}
	};

	ctx.canvas.addEventListener("wheel", (e) => {
		e.preventDefault();

		if(e.ctrlKey){
			const scale = Math.pow(1.1, -e.deltaY / 10);
			x_offset =  (x_offset - e.offsetX)*scale + e.offsetX;
			y_offset =  (y_offset - e.offsetY)*scale + e.offsetY;
			zoom *= scale;
		} else {
			y_offset -= e.deltaY;
			x_offset -= e.deltaX;
		}
		ctx.resetTransform();
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.setTransform(zoom, 0, 0, zoom,  + x_offset, +y_offset);
		render();
	}, false);

	ctx.setTransform(zoom, 0, 0, zoom,  +x_offset, +y_offset);
	render();
}

export function tm_trace_to_image(
	ctx: CanvasRenderingContext2D,
	machine,
	initial_tape = '0',
	width = 900,
	height = 1000,
	origin_x = 0.5
) {
	const imgData = ctx.createImageData(width, height);

	const history = render_history(machine, initial_tape, height);

	for (let row = 0; row < history.length; row += 1) {
		const { tape, curr_pos, curr_state } = history[row];
		for (let i = 0; i <= tape.length; i += 1) {
			const pos = naturalToInt(i);
			const col = pos + Math.floor(width * origin_x);
			if (col < 0 || col >= width) continue;
			if (tape[intToNatural(pos)] != undefined) {
				const imgIndex = 4 * (row * width + col);
				let color = 255;
				if (tape[intToNatural(pos)] === 0) color = 0;
				imgData.data[imgIndex + 0] = color;
				imgData.data[imgIndex + 1] = color;
				imgData.data[imgIndex + 2] = color;
				imgData.data[imgIndex + 3] = 255;
			}

			if (pos == curr_pos && curr_state < colorList.length) {
				const imgIndex = 4 * (row * width + col);
				imgData.data[imgIndex + 0] = colorList[curr_state][0]; // curr_pos > last_pos ? 255 : 0;
				imgData.data[imgIndex + 1] = colorList[curr_state][1]; // curr_pos < last_pos ? 255 : 0;
				imgData.data[imgIndex + 2] = colorList[curr_state][2];
				imgData.data[imgIndex + 3] = 255;
			}
		}
	}

	// ctx.canvas.height = height;
	ctx.putImageData(imgData, 0, 0);
}

export function step(machine: TM, curr_state, curr_pos, tape) {
	if (tape[intToNatural(curr_pos)] === undefined) {
		tape[intToNatural(curr_pos)] = 0;
	}

	const write = machine[curr_state * 6 + 3 * tape[intToNatural(curr_pos)]];
	const move = machine[curr_state * 6 + 3 * tape[intToNatural(curr_pos)] + 1];
	const goto = machine[curr_state * 6 + 3 * tape[intToNatural(curr_pos)] + 2] - 1;

	if (goto == -1) return [null, null];

	tape[intToNatural(curr_pos)] = write;
	const next_pos = curr_pos + (move ? -1 : 1);
	return [goto, next_pos];
}
