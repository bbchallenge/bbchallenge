<script lang="ts">
	import { onMount } from 'svelte';
	import TmTable from '$lib/tm_table.svelte';
	import { TMDecisionStatus, tm_trace_to_image } from '$lib/tm';

	let machine = new Uint8Array([
		1, 0, 2, 1, 1, 2, 1, 1, 3, 0, 0, 5, 0, 1, 4, 0, 0, 1, 1, 0, 1, 0, 1, 4, 0, 0, 0, 0, 0, 3
	]); // Chaotic machine #67279052

	let machineID = 67279052;

	let canvasEl;

	const canvas = {
		width: 400,
		height: 500
	};

	const drawRect = (context) => {
		context.fillStyle = 'black';
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.fill();
	};

	let nbIter = 10000;
	let tapeWidth = 500;
	let offset = 0.5;
	let fitCanvas = true;

	function getSimulationLink(forCopy = true) {
		let prefix = 'https://bbchalenge.org';
		if (!forCopy) {
			prefix = '/';
		}
		return prefix + `${machineID}&s=${nbIter}&w=${tapeWidth}&amp;o=${offset}`;
	}

	function draw() {
		const context = canvasEl.getContext('2d');
		drawRect(context);
		tm_trace_to_image(context, canvas, machine, tapeWidth, nbIter, offset, fitCanvas);
	}

	onMount(() => {
		console.log('Onmount');
		draw();
	});
</script>

<div>
	<div class="mt-4 <sm:mt-3 w-full flex items-start justify-center <sm:flex-col">
		<div class="flex flex-col">
			<div class="bg-black">
				<canvas class="mr-5" bind:this={canvasEl} width={canvas.width} height={canvas.height} />
			</div>

			<div class="text-xs pt-0 ">
				<div
					class="text-blue-400 hover:text-blue-300 cursor-pointer"
					on:click={() => {
						navigator.clipboard.writeText(getSimulationLink());
					}}
				>
					Copy simulation link
				</div>
			</div>
		</div>
		<div class="<sm:mt-3 sm:ml-10 xl:ml-20">
			<div>
				<TmTable
					{machine}
					simulationLink={getSimulationLink(false)}
					{machineID}
					decisionStatus={TMDecisionStatus.UNDECIDED}
				/>
			</div>
			<div class="mt-2 flex flex-col">
				<div>Simulation parameters:</div>
				<div class="flex space-x-3 pl-2 ">
					<label class="flex flex-col">
						steps
						<input class="w-[70px]" type="number" bind:value={nbIter} on:change={draw} /></label
					>
					<label class="flex flex-col">
						width
						<input class="w-[70px]" type="number" bind:value={tapeWidth} on:change={draw} /></label
					>
					<label class="flex flex-col">
						offset
						<input
							class="w-[70px]"
							type="number"
							bind:value={offset}
							on:change={draw}
							min="0"
							max="1"
						/></label
					>
				</div>
				<label class="text-sm mt-1 flex items-center space-x-2 cursor-pointer select-none">
					<input type="checkbox" bind:checked={fitCanvas} on:change={draw} />
					<div>Resize to canvas</div>
				</label>
			</div>
		</div>
	</div>
</div>
