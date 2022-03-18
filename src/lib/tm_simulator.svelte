<script lang="ts">
	import { onMount } from 'svelte';
	import type { TM } from './tm';
	import { b64URLSafetoTM, step } from './tm';

	import TmTable from './tm_table.svelte';

	export let initialB64TM = 'mAQACAQEDAQADAQACAQAEAAEFAQEBAQEEAQAAAAEB';

	let ctx: CanvasRenderingContext2D | null = null;
	let canvas: HTMLCanvasElement | null = null;
	const width = 800;
	const height = 82;
	const cellSize = 50;
	let ox = (width - cellSize) / 2;
	const oy = 20;

	let machine: TM = b64URLSafetoTM(initialB64TM);
	let tape = {};
	let headPos = 0;
	let nbSteps = 0;
	let currState = 0;

	function initalTape() {
		let tape = {};
		for (let i = -100; i < 100; i += 1) {
			tape[i] = 0;
		}
		return tape;
	}

	function drawTape() {
		ctx.lineWidth = 3;
		for (const [pos, val] of Object.entries(tape)) {
			ctx.fillStyle = 'black';
			if (val == 1) ctx.fillStyle = 'white';
			ctx.fillRect(pos * cellSize + ox, oy, cellSize, cellSize);

			if (pos != headPos) {
				ctx.strokeStyle = 'gray';
				ctx.strokeRect(pos * cellSize + ox, oy, cellSize, cellSize);
			}
		}

		// Highlight the head
		ctx.strokeStyle = 'magenta';
		ctx.strokeRect(headPos * cellSize + ox, oy, cellSize, cellSize);
	}

	function next() {
		[currState, headPos] = step(machine, currState, headPos, tape);
		nbSteps += 1;
		drawTape();
	}

	function reset() {
		currState = 0;
		headPos = 0;
		nbSteps = 0;
		ox = (width - cellSize) / 2;
		tape = initalTape();
		drawTape();
	}

	function keydown(e) {
		switch (e.keyCode) {
			case 78:
				next();
				break;
			case 82:
				reset();
				break;
			case 37:
				ox += cellSize * 2.5;
				drawTape();
				break;
			case 39:
				ox -= cellSize * 2.5;
				drawTape();
				break;
		}
	}

	onMount(() => {
		ctx = canvas.getContext('2d');
		tape = initalTape();
		drawTape();
	});
</script>

<svelte:window on:keydown={keydown} />

<div class="flex items-start space-x-8">
	<!-- <div class="-mb-8 ml-0">
		Machine <a href="/{tmTob64URLSafe(machine)}" class="text-sm">{tmTob64URLSafe(machine)}</a>
	</div> -->
	<div>
		<div class="font-bold -mb-5">Machine code</div>
		<TmTable {machine} showTitle={false} {currState} currRead={tape[headPos]} />
	</div>
	<div>
		<div class="font-bold">Memory tape</div>
		<canvas bind:this={canvas} {width} {height} />

		<div class=" ">
			<div class="text-lg mb-2">Step #{nbSteps}</div>
			<div class="flex space-x-3">
				<button class="px-2 py-1.5 bg-blue-500 hover:bg-blue-400 rounded-md" on:click={next}
					>(N)ext</button
				>
				<button class="px-2 py-1.5 bg-blue-500 hover:bg-blue-400 rounded-md" on:click={reset}
					>(R)eset</button
				>
				<div class="flex space-x-2">
					<button
						class="px-2  bg-gray-500 hover:bg-gray-400 rounded-md"
						on:click={() => {
							ox += cellSize * 2.5;
							drawTape();
						}}>←</button
					>
					<button
						class="px-2  bg-gray-500 hover:bg-gray-400 rounded-md"
						on:click={() => {
							ox -= cellSize * 2.5;
							drawTape();
						}}>→</button
					>
				</div>
			</div>
		</div>
	</div>
</div>
