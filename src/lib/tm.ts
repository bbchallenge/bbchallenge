export type TM = { states: number, symbols: number, code: Uint8Array };

export const DB_SIZE = 88664064;

export function encodedTransitionToString(transition): string {
	try {
		if (transition[2] == 0) {
			return '---';
		}

		let toReturn = '';

		if (transition[0] > 9) throw 'Invalid machine description [write symbol]';
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

export function tmToMachineCode(machine: TM): string {
	// Support for collaboratively agreed tm format
	// https://discuss.bbchallenge.org/t/standard-tm-text-format/60
	let to_return = '';
	for (let q = 0; q < machine.states; q += 1) {
		for (let s = 0; s < machine.symbols; s += 1) {
			to_return += encodedTransitionToString(machine.code.slice(3*(q * machine.symbols + s), 3*(q * machine.symbols + s + 1)));
		}
		if (q < machine.states - 1) {
			to_return += "_";
		}
	}
	return to_return;
}

export function machineCodeToTM(machineCode: string) {
	// Support for collaboratively agreed tm format
	// https://discuss.bbchallenge.org/t/standard-tm-text-format/60
	const len_with_underscores = machineCode.length;
	machineCode = machineCode.replaceAll("_", "");
	const states = (len_with_underscores - machineCode.length) + 1;
	if (machineCode.length % (3 * states) !== 0) throw 'Invalid TM code.';
	const symbols = machineCode.length / (3 * states);

	const tm = { states: states, symbols: symbols, code: new Uint8Array(machineCode.length) };
	for (let i = 0; 3*i < machineCode.length; i++) {
		tm.code[3*i+0] = parseInt(machineCode[3*i+0]); // Write symbol
		tm.code[3*i+1] = (machineCode[3*i+1] == 'L' ? 1 : 0); // Direction
		tm.code[3*i+2] = (machineCode[3*i+2] == '-' ? 0 : 1 + machineCode.charCodeAt(3*i+2) - 65); // Goto state
	}
	return tm;
}

export function legacy_tmTob64URLSafe(machine: TM) {
	let binary = '';
	const len = machine.code.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(machine.code[i]);
	}
	return 'm' + btoa(binary).replace('+', '-').replace('/', '_').replace(/=+$/, '');
}

export function legacy_b64URLSafetoTM(base64URLSafe: string) {
	if (base64URLSafe[0] != 'm') throw "Invalid TM base64 description: must start with 'm'.";

	const base64 = base64URLSafe.substring(1).replace('-', '+').replace('_', '/');
	const binary = atob(base64);
	const tm = { states: binary.length/2, symbols: 2, code: new Uint8Array(binary.length) };
	for (let i = 0; i < binary.length; i++) {
		tm.code[i] = binary.charCodeAt(i);
	}
	return tm;
}

export function tmToTuringMachineDotIO(machine: TM) {
	let toReturn = "blank: '0'\n";
	toReturn += 'start state: A\n';
	toReturn += 'table:\n';

	for (let q = 0; q < machine.states; q += 1) {
		toReturn += '  ' + String.fromCharCode(65 + q) + ':\n';
		for (let s = 0; s < machine.symbols; s += 1) {
			const trans = machine.code.slice(3*(q * machine.symbols + s), 3*(q * machine.symbols + s + 1));
			if (trans[2] != 0 && trans[2] <= machine.states) {
				toReturn +=
					'    ' +
					`${s}: {write: ${trans[0]}, ${trans[1] == 0 ? 'R' : 'L'}: ${String.fromCharCode(
						65 + trans[2] - 1
					)}}\n`;
			}
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

export function render_history(machine: TM, initial_tape = '0', height = 1000) {
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
		if (curr_state === null || curr_state >= machine.states) {
			break;
		}
	}
	return history;
}

export function tm_explore(
	ctx: CanvasRenderingContext2D,
	machine: TM,
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
		const color_scale = 255 / (machine.symbols - 1);

		for (let row = Math.max(miny, 0); row < Math.min(miny + height + 1, history.length); row++) {
			if (!history[row]) continue;
			const { tape, curr_pos, curr_state } = history[row];

			for (let i = 0; i < tape.length; i += 1) {
				const col = naturalToInt(i);
				if (col < minx || col > minx + width) continue;

				if (tape[i]) {
					const color = Math.floor(color_scale * tape[i]);
					ctx.fillStyle = `rgb(${color}, ${color}, ${color})`;
					ctx.fillRect(col, row, 1, 1);
				}
			}

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
	machine: TM,
	initial_tape = '0',
	width = 900,
	height = 1000,
	origin_x = 0.5,
	fitCanvas = true,
	showHeadMove = false
) {
	width = Math.max(1, Math.min(99_999, Math.floor(width) || 0));
	height = Math.max(1, Math.min(99_999, Math.floor(height) || 0));

	const imgData = ctx.createImageData(width, height);
	const color_scale = 255 / (machine.symbols - 1);
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
				const color = Math.floor(color_scale * tape[intToNatural(pos)]);
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

	const i = 3 * (curr_state * machine.symbols + tape[f(curr_pos)]);
	const write = machine.code[i];
	const move = machine.code[i + 1];
	const goto = machine.code[i + 2] - 1;

	if (goto == -1) return [null, null];

	tape[f(curr_pos)] = write;
	const next_pos = curr_pos + (move ? -1 : 1);
	return [goto, next_pos];
}
