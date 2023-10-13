<script lang="ts">
	import { onMount } from 'svelte';
	import type { TM } from './tm';
	import { machineCodeToTM, step, tmToTuringMachineDotIO, tmToMachineCode } from './tm';
	import { BB5_champion } from '$lib/machine_repertoire';

	import TmTable from './tm_table.svelte';

	export let machineCode = BB5_champion;

	let ctx: CanvasRenderingContext2D | null = null;
	let canvas: HTMLCanvasElement | null = null;
	const width = 500;
	const height = 82;
	const cellSize = 50;
	let ox = (width - cellSize) / 2;
	const oy = 20;

	let machine: TM = machineCodeToTM(machineCode);
	let tape = {};
	let headPos = 0;
	let nbSteps = 0;
	let currState = 0;
	let hasHalted = false;

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
		const [nextState, nextPos] = step(machine, currState, headPos, tape, true);
		if (nextState === null || nextPos == null) {
			if (!hasHalted) nbSteps += 1;
			hasHalted = true;
		}
		if (nextState != null) {
			currState = nextState;
			headPos = nextPos;
			nbSteps += 1;
			drawTape();
		}
	}

	function reset() {
		currState = 0;
		headPos = 0;
		nbSteps = 0;
		ox = (width - cellSize) / 2;
		tape = initalTape();
		hasHalted = false;
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

<div class="flex items-start space-x-10 text-white">
	<!-- <div class="-mb-8 ml-0">
		Machine <a href="/{tmTob64URLSafe(machine)}" class="text-sm">{tmTob64URLSafe(machine)}</a>
	</div> -->
	<div>
		<div class="font-bold">Machine code</div>
		<div class="text-xs w-full mt-1">
			<div>
				<div class="text-xs select-all mb-1">{tmToMachineCode(machine)}</div>
				<span
					on:click|preventDefault={() => {
						navigator.clipboard.writeText(tmToTuringMachineDotIO(machine)).then(function () {
							window.open('https://turingmachine.io/', '_blank').focus();
						});
					}}
					target="_blank"
					class="text-blue-400 hover:text-blue-300 cursor-pointer "
					>Copy for https://turingmachine.io/</span
				>
			</div>
			<!-- <div>
				<a
					href="/{b64TM}"
					rel="external"
					target="_blank"
					class="text-blue-400 hover:text-blue-300 cursor-pointer text-[0.6rem] no-underline"
					>{b64TM}</a
				>
			</div> -->
		</div>
		<div class="mt-1" />
		<TmTable {machine} showTitle={false} {currState} currRead={tape[headPos]} />
	</div>
	<div>
		<div class="font-bold">Memory tape</div>
		<canvas bind:this={canvas} {width} {height} />

		<div class=" ">
			<div class="text-lg" class:mb-2={!hasHalted}>Step #{nbSteps}</div>
			{#if hasHalted}
				<div class="text-lg mb-2 ">The machine has halted!</div>
			{/if}
			<div class="flex space-x-3">
				<button
					class="px-2 py-1.5 bg-blue-500 hover:bg-blue-400 rounded-md disabled:opacity-50 disabled:hover:bg-blue-500 disabled:cursor-not-allowed"
					on:click={next}
					disabled={hasHalted}>(N)ext</button
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
