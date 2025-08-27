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

// Palette for Blaze rendering (WASM expects a flat Uint8Array of RGB triplets)
function defaultPaletteBytes(isDark: boolean): Uint8Array {
	if (isDark) {
		return new Uint8Array([
			255, 255, 255, // white (symbol 0)
			0, 0, 0,       // black (symbol 1)
			128, 128, 128, // 50% gray (symbol 2)
			64, 64, 64,    // 25% gray (symbol 3)
			192, 192, 192  // 75% gray (symbol 4)
		]);
	}
	return new Uint8Array([
		255, 255, 255, // white (symbol 0)
		255, 165, 0,   // orange (symbol 1)
		255, 255, 0,   // yellow (symbol 2)
		255, 0, 255,   // magenta (symbol 3)
		0, 255, 255    // cyan (symbol 4)
	]);
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

function parse_initial_tape(machine: TM, initial_tape: string) {
	const raw_tape = [];
	let state = 0;
	let pos = 0;

	for (let i = 0; i < initial_tape.length; i++) {
		const c = initial_tape.charCodeAt(i);
		if (48 <= c && c < 48 + machine.symbols) {
			raw_tape.push(c - 48);
		}
		else if ((65 <= c && c < 65 + machine.states) || (97 <= c && c < 97 + machine.states)) {
			state = (c - 1) % 32;
			pos = raw_tape.length;
		}
	}

	const tape = [];
	for (let i = 0; i < raw_tape.length; i++) {
		tape[intToNatural(i - pos)] = raw_tape[i];
	}

	return {tape, state};
}

export function render_history(machine: TM, initial_tape = '0', height = 1000) {
	const history = [];

	let {tape, state: curr_state} = parse_initial_tape(machine, initial_tape);
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
	// Stop any active Blaze worker before starting the explore mode
	if (isBlazeRunning()) {
		stopBlazeWorker();
	}

	// Hide any existing status element from blaze mode
	const statusElement = document.getElementById('tm-blaze-status');
	if (statusElement) {
		statusElement.style.display = 'none';
	}

	// Always use black background for Explore mode, regardless of darkMode setting
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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

			if (curr_state !== null && curr_state < colorList.length) {
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
	// Fix the transform matrix - change the 0 to zoomt);
	ctx.setTransform(zoom, 0, 0, zoom, +x_offset, +y_offset);
	render();

	return () => ctx.canvas.removeEventListener('wheel', wheel);
}

// Helper function to render PNG data to canvas (without status text)
function renderPngDataToCanvas(
    ctx: CanvasRenderingContext2D,
    pngData: ArrayBuffer,
    stretch: boolean,
    backgroundColor: string = "white", // Add backgroundColor parameter
    onComplete?: () => void
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        // Create an object URL for the PNG data
        const blobUrl = URL.createObjectURL(new Blob([pngData], { type: 'image/png' }));
        
        // Create an image and render it to the canvas
        const image = new Image();
        image.onload = () => {
            // Fill the canvas with the provided background color
            ctx.fillStyle = backgroundColor; // Use the backgroundColor parameter
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.imageSmoothingEnabled = false;

            // Determine rendering approach:
            // 1. If stretch=true OR image is at least as large as canvas in both dimensions, stretch to fill
            // 2. Otherwise (stretch=false AND at least one dimension is smaller), scale proportionally
            if (stretch || (image.width >= ctx.canvas.width && image.height >= ctx.canvas.height)) {
                // Always stretch to fill the entire canvas in these cases
                ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, ctx.canvas.width, ctx.canvas.height);
            } else {
                // Only use proportional scaling when stretch=false AND image is smaller in at least one dimension
                const scale = Math.min(ctx.canvas.height / image.height, ctx.canvas.width / image.width);
                const x = (ctx.canvas.width - image.width * scale) / 2;
                const y = (ctx.canvas.height - image.height * scale) / 2;
                ctx.drawImage(image, 0, 0, image.width, image.height, x, y, image.width * scale, image.height * scale);
            }

            URL.revokeObjectURL(blobUrl);
            
            if (onComplete) onComplete();
            resolve();
        };
        
        image.onerror = (error) => {
            console.error("Error loading image:", error);
            URL.revokeObjectURL(blobUrl);
            reject(new Error("Failed to load image"));
        };
        
        image.src = blobUrl;
    });
}

// Store the last Blaze image data and worker for reuse when toggling stretch
let lastBlazeImageData: ArrayBuffer | null = null;
let lastBlazeParams: {
    machineCode: string;
    canvasWidth: number;
    canvasHeight: number;
    binning: boolean;
    stepCount: bigint;
} | null = null;
let activeWorker: Worker | null = null;
let isRunningBlaze = false; // Add this to track if blaze is running
let wasManuallyStopped = false; // Add this to track if blaze was manually stopped

// Add a function to format numbers with thousand separators
function formatWithCommas(num: string | number | bigint): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Add a function to clear the cached data that can be called from outside
export function clearBlazeCache() {
    lastBlazeImageData = null;
    lastBlazeParams = null;
    if (activeWorker) {
        activeWorker.terminate();
        activeWorker = null;
    }
    isRunningBlaze = false; // Reset the running state
    wasManuallyStopped = false; // Reset the manually stopped state
}

// Add a function to stop the active worker
export function stopBlazeWorker() {
    if (activeWorker) {
        wasManuallyStopped = true; // Set the manually stopped flag
        activeWorker.terminate();
        activeWorker = null;
        isRunningBlaze = false; // Reset the running state
        
        // Find and update the status element immediately
        const statusElement = document.getElementById('tm-blaze-status');
        if (statusElement) {
            // Extract the current status text and replace "Running" with "Stopped"
            const currentText = statusElement.textContent || '';
            const updatedText = currentText.replace(/Running/, 'Stopped');
            statusElement.innerHTML = `<em>${updatedText}</em>`;
        }
        
        return true; // Return true if a worker was actually stopped
    }
    return false; // Return false if no worker was running
}

// Add a function to check if blaze is running
export function isBlazeRunning() {
    return isRunningBlaze;
}

// Add a function to check if blaze was manually stopped
export function wasBlazeManuallyStoppped() {
    return wasManuallyStopped;
}

export async function tm_blaze(
    ctx: CanvasRenderingContext2D,
    machine: TM,
    step_count = 1000n,
    stretch = true,
    quality = true,
    backgroundColor: string = "white",
	_foregroundColor: string = "orange",
    statusElement?: HTMLElement // Optional parameter for the status element
) {
	// Reference unused parameter to satisfy noUnusedParameters rule without changing API
	void _foregroundColor;
    // Get current machine code
    const machineCode = tmToMachineCode(machine);
    
    // Check if we're just toggling stretch with the same parameters
    const isJustTogglingStretch = lastBlazeImageData !== null && 
                                 lastBlazeParams !== null &&
                                 lastBlazeParams.machineCode === machineCode &&
                                 lastBlazeParams.canvasWidth === ctx.canvas.width &&
                                 lastBlazeParams.canvasHeight === ctx.canvas.height &&
                                 lastBlazeParams.binning === quality &&
                                 lastBlazeParams.stepCount === step_count;
    
    if (isJustTogglingStretch) {
        // Just re-render the existing image with the new stretch setting
        await renderPngDataToCanvas(ctx, lastBlazeImageData, stretch, backgroundColor);
        return;
    }
    
    // Terminate any active worker before starting a new one
    if (activeWorker) {
        activeWorker.terminate();
        activeWorker = null;
    }
    
    // If parameters changed, clear the cached data
    lastBlazeImageData = null;
    
    // Immediately set background color to match the theme
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    try {
        // Set the running state to true
        isRunningBlaze = true;
        
        // Save the current parameters for future checks
        lastBlazeParams = {
            machineCode,
            canvasWidth: ctx.canvas.width,
            canvasHeight: ctx.canvas.height,
            binning: quality,
            stepCount: step_count
        };

        // Set binning based on the quality parameter
        const binning = quality;

        // Create a worker using the tm-worker.ts file
        const worker = new Worker(new URL('./tm-worker.ts', import.meta.url), { type: 'module' });
        activeWorker = worker;

        // Track start time
        const startTime = performance.now();

        // Create or find status element if not provided
        if (!statusElement) {
            // Try to find an existing status element with our special ID
            const existingStatusElement = document.getElementById('tm-blaze-status');
            
            if (existingStatusElement) {
                // Use the existing element
                statusElement = existingStatusElement as HTMLElement;
                // Update styles in case they were previously set differently
                statusElement.style.fontSize = '0.75em';
                statusElement.style.marginBottom = '2px';
                statusElement.style.padding = '1px';
            } else {
                // Create a new status element
                statusElement = document.createElement('div');
                statusElement.id = 'tm-blaze-status';
                statusElement.style.fontStyle = 'italic';
                statusElement.style.fontSize = '0.75em';
                statusElement.style.marginBottom = '2px';
                statusElement.style.padding = '1px';
                
                // Try to find the parent container of the canvas
                const canvasParent = ctx.canvas.parentElement;
                
                // Insert the status element before the canvas
                if (canvasParent) {
                    canvasParent.insertBefore(statusElement, ctx.canvas);
                } else {
                    // If can't find parent, insert right before the canvas in the DOM
                    ctx.canvas.parentNode?.insertBefore(statusElement, ctx.canvas);
                }
                
            }
        }

	// Initial status update
	statusElement.innerHTML = '<em>Time: 0.00s • Steps: 0 • Nonzeros: 0 • Running</em>';
        statusElement.style.display = 'block';
        
        // Remove the code that adds the re-run button
        // The button is now added directly in the Svelte component

        // Send data to the worker
        const promise = new Promise<void>((resolve, reject) => {
            worker.onmessage = async (event) => {
                // Skip processing messages from terminated workers
                if (worker !== activeWorker) {
                    return;
                }
                
                if (event.data.type === 'error') {
                    if (statusElement) {
                        statusElement.innerHTML = `<em>Error: ${event.data.message}</em>`;
                    }
                    isRunningBlaze = false; // Update running state on error
                    reject(new Error(event.data.message));
                    worker.terminate();
                    if (activeWorker === worker) {
                        activeWorker = null;
                    }
                    return;
                }

                try {
                    // Calculate elapsed time
                    const elapsedTime = (performance.now() - startTime) / 1000;
                    
                    // Update status element
                    if (statusElement) {
                        // Format steps with commas
                        const stepsCompleted = event.data.stepsCompleted || 0n;
                        const formattedSteps = formatWithCommas(stepsCompleted);
                        
                        // Determine machine state
                        let machineState;
                        if (wasManuallyStopped) {
                            machineState = 'Stopped';
                        } else {
                            machineState = event.data.halted ? 'Halted' : event.data.intermediate ? 'Running' : 'Not Halted';
                        }
                        
						// Create status text with commas in Nonzero count
						const nonblankCount = event.data.nonblankCount || 0;
						const formattedNonblankCount = formatWithCommas(nonblankCount);
						const statusText = `Time: ${elapsedTime.toFixed(2)}s • Steps: ${formattedSteps} • Nonzeros: ${formattedNonblankCount} • ${machineState}`;
                        
                        // Update the status element
                        statusElement.innerHTML = `<em>${statusText}</em>`;
                    }

                    // Store the latest image data for stretch toggling
                    // Create a copy of the buffer to ensure we keep it even if the original is detached
                    const bufferCopy = new Uint8Array(event.data.pngData).buffer;
                    lastBlazeImageData = bufferCopy;
                    
                    // Render the image data without status info, passing the backgroundColor
                    await renderPngDataToCanvas(ctx, event.data.pngData, stretch, backgroundColor);
                    
                    // If this is the final result, resolve the promise
                    if (!event.data.intermediate) {
                        isRunningBlaze = false; // Update running state when done
                        worker.terminate();
                        if (activeWorker === worker) {
                            activeWorker = null;
                        }
                        resolve();
                    }
                } catch (error) {
                    if (!event.data.intermediate) {
                        isRunningBlaze = false; // Update running state on error
                        worker.terminate();
                        if (activeWorker === worker) {
                            activeWorker = null;
                        }
                        reject(error);
                    }
                }
            };

            worker.onerror = (error) => {
                if (statusElement) {
                    statusElement.innerHTML = `<em>Error: ${error.message}</em>`;
                }
                isRunningBlaze = false; // Update running state on error
                reject(error);
                worker.terminate();
                if (activeWorker === worker) {
                    activeWorker = null;
                }
            };
        });

		// Build color palette from provided dark/light context
		const isDark = (backgroundColor || '').toLowerCase() === 'black';
		const palette = defaultPaletteBytes(isDark);

		worker.postMessage({
			machineCode,
			canvasWidth: ctx.canvas.width,
			canvasHeight: ctx.canvas.height,
			binning,
			stepCount: step_count,
			colors: palette
		});

        // Wait for the worker to finish
        await promise;
    } catch (error) {
        isRunningBlaze = false; // Update running state on error
        console.error("Error in tm_blaze:", error);
        throw error;
    }
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
	// Stop any active Blaze worker before starting the trace mode
	if (isBlazeRunning()) {
		stopBlazeWorker();
	}

	// Hide any existing status element from blaze mode
	const statusElement = document.getElementById('tm-blaze-status');
	if (statusElement) {
		statusElement.style.display = 'none';
	}

	// Always use black background for Default mode, regardless of darkMode setting
	ctx.fillStyle = 'black'; 
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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

// Function to format step count with thousand separators for input fields
export function formatStepCountWithCommas(value: string): string {
    // Remove any existing commas
    const plainNumber = value.replace(/,/g, '');
    
    // Check if it's a valid number
    if (!plainNumber || isNaN(Number(plainNumber))) {
        return plainNumber; // Return as is if not a valid number
    }
    
    // Format with thousand separators
    return plainNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Function to convert a formatted string with commas back to a plain number
export function parseFormattedStepCount(formattedValue: string): string {
    // Remove all commas to get the plain number
    return formattedValue.replace(/,/g, '');
}
