<script lang="ts">
	import { onMount } from 'svelte';
	import TmTable from '$lib/tm_table.svelte';
	import { TMDecisionStatus, tm_trace_to_image, b64URLSafetoTM } from '$lib/tm';

	let machine = new Uint8Array([
		1, 0, 2, 1, 1, 2, 1, 1, 3, 0, 0, 5, 0, 1, 4, 0, 0, 1, 1, 0, 1, 0, 1, 4, 0, 0, 0, 0, 0, 3
	]); // Chaotic machine #67279052

	machine = b64URLSafetoTM('mAQACAQECAQEDAAAFAAEEAAABAQABAAEEAAAAAAAD');
	console.log(machine);
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
	let tapeWidth = 300;
	let origin_x = 0.5;
	let fitCanvas = true;
	let showHeadMove = false;

	function getSimulationLink(forCopy = true) {
		let prefix = 'https://bbchalenge.org';
		if (!forCopy) {
			prefix = '/';
		}
		return prefix + `${machineID}&s=${nbIter}&w=${tapeWidth}&amp;ox=${origin_x}`;
	}

	let showRandomOptions = false;

	function draw() {
		const context = canvasEl.getContext('2d');
		drawRect(context);
		tm_trace_to_image(
			context,
			canvas,
			machine,
			tapeWidth,
			nbIter,
			origin_x,
			fitCanvas,
			showHeadMove
		);
	}

	onMount(() => {
		console.log('Onmount');
		draw();
	});
</script>

<div>
	<div class="mt-4 <sm:mt-3 w-full flex items-start justify-center <sm:flex-col">
		<div class="flex flex-col">
			<div class="bg-black mr-5">
				<canvas bind:this={canvasEl} width={canvas.width} height={canvas.height} />
			</div>

			<div class="mt-0 flex flex-col">
				<div>Simulation parameters:</div>
				<div class="flex space-x-3 pl-2 text-sm ">
					<label class="flex flex-col ">
						steps
						<input class="w-[70px]" type="number" bind:value={nbIter} on:change={draw} /></label
					>
					<label class="flex flex-col">
						tape width
						<input class="w-[70px]" type="number" bind:value={tapeWidth} on:change={draw} /></label
					>
					<label class="flex flex-col">
						origin x
						<input
							class="w-[70px]"
							type="number"
							bind:value={origin_x}
							on:change={draw}
							min="0"
							max="1"
							step="0.1"
						/></label
					>
				</div>
				<label class="text-sm mt-2 flex items-center space-x-2 cursor-pointer select-none">
					<input type="checkbox" bind:checked={showHeadMove} on:change={draw} />
					<div>show head movement</div>
				</label>
				<!-- <label class="text-sm mt-1 flex items-center space-x-2 cursor-pointer select-none">
					<input type="checkbox" bind:checked={fitCanvas} on:change={draw} />
					<div>fit to canvas</div>
				</label> -->
			</div>
			<div class="text-xs pt-0 flex items-center space-x-1">
				<div
					class="text-blue-400 hover:text-blue-300 cursor-pointer"
					on:click={() => {
						navigator.clipboard.writeText(getSimulationLink());
					}}
				>
					Copy simulation link
				</div>
				<div>&middot;</div>
				{#if canvasEl}
					<div
						class="text-blue-400 hover:text-blue-300 cursor-pointer"
						on:click={() => {
							var image = new Image();
							image.src = canvasEl.toDataURL();
							let w = window.open('');
							w.document.write(image.outerHTML);
						}}
					>
						Export image
					</div>
				{/if}
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

			<div class="mt-4 flex flex-col">
				<div>Change machine:</div>
				<div class="ml-3 mt-1 text-sm">
					<div>Random machine from the database:</div>

					<div class="ml-2 flex flex-col space-y-1 ">
						<button class="bg-blue-500 p-1 mx-3 mt-1">Go Random</button>
						<div
							class="text-xs text-right mx-3 text-blue-400 hover:text-blue-300 cursor-pointer select-none"
							on:click={() => {
								showRandomOptions = !showRandomOptions;
							}}
						>
							{#if !showRandomOptions}More{:else}Less{/if} options
						</div>

						{#if showRandomOptions}
							<div class="mx-3">
								<label class="flex space-x-2 items-center select-none cursor-pointer">
									<input type="radio" />
									<div>any machine (88,664,064)</div>
								</label>
								<label class="flex space-x-2 items-center select-none cursor-pointer">
									<input type="radio" />
									<div>any undecided machine (2,322,122)</div>
								</label>
								<label class="flex space-x-2 items-center select-none cursor-pointer w-[300px]">
									<input type="radio" />
									<div>any undecided machine not heuristically decided (206,784)</div>
								</label>
							</div>
						{/if}
					</div>
				</div>
				<div class="ml-3 mt-3 text-sm">
					<div>From id in the database:</div>
					<div class="ml-5 flex items-center  space-x-4 ">
						<input
							type="number"
							class="w-[200px]"
							placeholder="Between 0 and 88664063"
							min="0"
							max="88664063"
						/>
						<button class="bg-blue-500 p-1 px-2 ">Go </button>
					</div>
				</div>
				<div class="ml-3 mt-1 text-sm">
					<div>From machine b64:</div>
					<div class="ml-5 flex items-center  space-x-4 ">
						<input type="text" class="w-[200px]" placeholder="Starts with m" />
						<button class="bg-blue-500 p-1 px-2 ">Go </button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
