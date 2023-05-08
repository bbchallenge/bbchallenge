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

// In order to convert machine codes of `machine_repertoire.ts` after migration to 
// https://discuss.bbchallenge.org/t/standard-tm-text-format/60
export function oldBbchallengeFormatToNew(machineCode: string): string {
	if (machineCode.includes("_")) {
		return machineCode
	}

	let to_ret = "";

	for (let i = 0; i < machineCode.length; i += 1) {
		if (i % 6 != 5) {
			to_ret += machineCode[i]
		} else if (i < machineCode.length - 1) {
			to_ret += machineCode[i] + "_"
		} else {
			to_ret += machineCode[i]
		}
	}

	return to_ret
}

export function tmToMachineCode(machine: Uint8Array): string {
	let to_return = '';
	for (let i = 0; i < machine.length; i += 3) {
		to_return += encodedTransitionToString(machine.slice(i, i + 3));
		if (i % 6 == 3 && i != machine.length - 3) {
			// Support for collaboratively agreed tm format
			// https://discuss.bbchallenge.org/t/standard-tm-text-format/60
			to_return += "_"
		}
	}
	return to_return;
}

export function machineCodeToTM(machineCode: string) {
	// Support for collaboratively agreed tm format
	// https://discuss.bbchallenge.org/t/standard-tm-text-format/60
	machineCode = machineCode.replaceAll("_", "")

	if (machineCode.length % 6 !== 0) throw 'Invalid TM code.';

	const tm = new Uint8Array(machineCode.length);
	for (let i = 0; i < machineCode.length; i++) {
		if (i % 3 == 0) machineCode[i] == '1' ? tm[i] = 1 : tm[i] = 0 // Write symbol
		else if (i % 3 == 1) machineCode[i] == 'L' ? tm[i] = 1 : tm[i] = 0 // Direction
		else {
			if (machineCode[i] == '-') tm[i] == 0 // Undefined transition (halt)
			else tm[i] = machineCode.charCodeAt(i) - 'A'.charCodeAt(0) + 1; // Goto state
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
		if (trans0[2] != 0 && trans0[2] <= machine.length / 6) {
			toReturn +=
				'    ' +
				`0: {write: ${trans0[0]}, ${trans0[1] == 0 ? 'R' : 'L'}: ${String.fromCharCode(
					65 + trans0[2] - 1
				)}}\n`;
		}
		if (trans1[2] != 0 && trans1[2] <= machine.length / 6) {
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

function intToNatural(n: number) {
	return n < 0 ? -n * 2 - 1 : n * 2;
}
function naturalToInt(n: number) {
	return n % 2 == 0 ? n / 2 : -(n + 1) / 2;
}

export function render_history(machine, initial_tape = '0', height = 1000) {
	const history = [];

	let tape = [];
	for (let i = 0; i < initial_tape.length; i++) {
		tape[intToNatural(i)] = initial_tape[i] === '0' ? 0 : 1;
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
			const { tape } = history[row];

			for (let i = 0; i < tape.length; i += 1) {
				const col = naturalToInt(i);
				if (col < minx || col > minx + width) continue;

				if (tape[i]) {
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
	initial_tape = '0',
	width = 900,
	height = 1000,
	origin_x = 0.5,
	fitCanvas = true,
	showHeadMove = false
) {
	const imgData = ctx.createImageData(width, height);

	const history = render_history(machine, initial_tape, height);

	for (let row = 1; row < history.length; row += 1) {
		const last_pos = history[row - 1].curr_pos;
		const { tape, curr_pos } = history[row];
		for (let i = 0; i <= tape.length; i += 1) {
			const pos = naturalToInt(i);
			const col = pos + Math.floor(width * origin_x);
			if (col < 0 || col >= width) continue;

			if (pos == curr_pos && showHeadMove) {
				const imgIndex = 4 * (row * width + col);
				imgData.data[imgIndex + 0] = curr_pos > last_pos ? 255 : 0;
				imgData.data[imgIndex + 1] = curr_pos < last_pos ? 255 : 0;
				imgData.data[imgIndex + 2] = 0;
				imgData.data[imgIndex + 3] = 255;
			} else if (tape[intToNatural(pos)] != undefined) {
				const imgIndex = 4 * (row * width + col);
				let color = 255;
				if (tape[intToNatural(pos)] === 0) color = 0;
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

export function step(machine: TM, curr_state, curr_pos, tape, use_int_positions = false) {
	function identity(x) {
		return x;
	}

	const f = use_int_positions ? identity : intToNatural;

	if (tape[f(curr_pos)] === undefined) {
		tape[f(curr_pos)] = 0;
	}

	const write = machine[curr_state * 6 + 3 * tape[f(curr_pos)]];
	const move = machine[curr_state * 6 + 3 * tape[f(curr_pos)] + 1];
	const goto = machine[curr_state * 6 + 3 * tape[f(curr_pos)] + 2] - 1;

	if (goto == -1) return [null, null];

	tape[f(curr_pos)] = write;
	const next_pos = curr_pos + (move ? -1 : 1);
	return [goto, next_pos];
}
