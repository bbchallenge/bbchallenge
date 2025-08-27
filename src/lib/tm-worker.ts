/// <reference lib="webworker" />
import init, { SpaceByTimeMachine } from './blaze/pkg/busy_beaver_blaze';

interface WorkerMessage {
	machineCode: string;
	canvasWidth: number;
	canvasHeight: number;
	binning: boolean;
	stepCount: number;
    colors: Uint8Array; // Color palette as flat [r,g,b,...]
}

interface WorkerResponse {
    type: 'result' | 'error'; // Message type
	intermediate: boolean;     // Is this an intermediate result?
    pngData?: Uint8Array;     // Optional PNG data (only for 'result')
    message?: string;         // Optional error message (only for 'error')
    stepsCompleted?: bigint;  // Number of steps completed
    nonblankCount?: number;   // Number of non-zero symbols on the tape
    halted?: boolean;         // Whether the machine has halted
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
	const { machineCode, canvasWidth, canvasHeight, binning, stepCount, colors } = event.data;
	const run_for_seconds = 0.1;

	try {
		// Initialize the WASM module
		await init();

		// Create the SpaceByTimeMachine instance
		const spaceTimeMachine = new SpaceByTimeMachine(
			machineCode,
			canvasWidth,
			canvasHeight,
			binning,
			0n
			);

        // eslint-disable-next-line no-constant-condition
        while (true) {
            // Store the result of step_for_secs to check if we're done
            const stillRunning = spaceTimeMachine.step_for_secs(
                run_for_seconds, 
                BigInt(stepCount), // Convert stepCount to BigInt
                10_000n // Already a BigInt
            );
            
            // Send intermediate result with status information
            const response: WorkerResponse = {
                type: 'result',
                intermediate: stillRunning, // If stillRunning is false, this is the final result
                pngData: spaceTimeMachine.to_png(colors),
                stepsCompleted: spaceTimeMachine.step_count(),
                nonblankCount: spaceTimeMachine.count_nonblanks(),
                halted: spaceTimeMachine.is_halted()
            };
			self.postMessage(response, [response.pngData!.buffer]);
            
            // If we're done, break out of the loop
            if (!stillRunning) break;
        }

	} catch (error: unknown) {
		// Send any errors back to the main thread
		const response: WorkerResponse = {
			type: 'error',
			intermediate: false,
			message: (error instanceof Error) ? error.message : String(error)
		};
		self.postMessage(response);
	}
};
