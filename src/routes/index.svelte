<script lang="ts">
	import { onMount } from 'svelte';
	import TmTable from '$lib/tm_table.svelte';
	import { API } from '$lib/api_server';
	import { addToHistory, getHistory, numberWithCommas } from '$lib/utils';
	import { goto } from '$app/navigation';
	const _goto = goto;
	import {
		TMDecisionStatus,
		tm_trace_to_image,
		b64URLSafetoTM,
		DB_SIZE,
		tmTob64URLSafe
	} from '$lib/tm';
	import SvelteSeo from 'svelte-seo';

	let machine = null;
	export let machineID = null;
	export let machineB64 = null;
	export let preSeed = false;
	export let machineStatus = null;
	let history = getHistory();
	let showHistory = false;

	//machine = b64URLSafetoTM('mAQACAAAAAQEDAAAEAQAFAQEEAQACAAAFAQECAQED');
	//console.log(machine);

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

	export let nbIter = 10000;
	export let tapeWidth = 300;
	export let origin_x = 0.5;

	// Default the params if called with null
	if (nbIter == null) {
		nbIter = 3000;
	}
	if (tapeWidth == null) {
		tapeWidth = 300;
	}
	if (origin_x == null) {
		origin_x = 0.5;
	}

	let fitCanvas = true;
	let showHeadMove = true;

	function getSimulationLink(forCopy = false) {
		let prefix = 'https://bbchalenge.org/';
		if (!forCopy) {
			prefix = '/';
		}
		let secondPrefix = tmTob64URLSafe(machine);
		if (machineID != null) {
			secondPrefix = machineID;
		}

		let last_add = '';
		if (machineStatus == TMDecisionStatus.DECIDED_HALT) {
			last_add = '&status=halt';
		}

		return prefix + `${secondPrefix}&s=${nbIter}&w=${tapeWidth}&ox=${origin_x}` + last_add;
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

	let randomType = 'all_undecided_apply_heuristics';

	async function getRandomMachine() {
		try {
			const response = await API.post('/machine/random', { type: randomType });

			machine = b64URLSafetoTM(response.data['machine']);
			machineID = response.data['machine_id'];

			addToHistory(machineID);
			history = getHistory();

			if (response.data['status'] !== undefined) {
				if (response.data['status'] == 'decided') {
					machineStatus = TMDecisionStatus.DECIDED_NON_HALT;
				} else if (response.data['status'] == 'heuristic') {
					machineStatus = TMDecisionStatus.HEURISTICALLY_DECIDED_NON_HALT;
				} else {
					machineStatus = TMDecisionStatus.UNDECIDED;
				}
			}
		} catch (error) {
			console.log(error);
		}
	}

	let typedMachineID = null;
	let typedMachineError = null;
	async function loadMachineFromID(localMachineID) {
		if (localMachineID == null || localMachineID < 0 || localMachineID >= DB_SIZE) {
			typedMachineError = 'Machine ID must be a number between 0 and 88664063.';
			return;
		}

		typedMachineError = null;
		try {
			const response = await API.get(`/machine/${localMachineID}`, {});

			machine = b64URLSafetoTM(response.data['machine']);
			localMachineID = response.data['machine_id'];
			machineID = localMachineID;

			addToHistory(localMachineID);
			history = getHistory();

			if (response.data['status'] !== undefined) {
				if (response.data['status'] == 'decided') {
					machineStatus = TMDecisionStatus.DECIDED_NON_HALT;
				} else if (response.data['status'] == 'heuristic') {
					machineStatus = TMDecisionStatus.HEURISTICALLY_DECIDED_NON_HALT;
				} else {
					machineStatus = TMDecisionStatus.UNDECIDED;
				}
			}

			console.log(machine, machineID);
		} catch (error) {
			typedMachineError = error;
			console.log(error);
		}
	}

	let typedb64 = null;
	let b64Error = null;
	function loadMachineFromB64(b64, status = null) {
		machine = null;
		machineID = null;
		machineStatus = status;
		try {
			b64Error = null;
			machine = b64URLSafetoTM(b64);
			addToHistory(b64);
			history = getHistory();
			draw();
		} catch (error) {
			b64Error = error;
		}
	}

	let metrics = null;
	let highlighted = null;
	onMount(async () => {
		if (!preSeed) {
			await getRandomMachine();
			window.history.replaceState({}, '', getSimulationLink());
		} else if (machineID != null) {
			await loadMachineFromID(machineID);
		} else if (machineB64 != null) {
			await loadMachineFromB64(machineB64, machineStatus);
		}
		draw();

		let response = await API.get(`/metrics`, {});
		metrics = response.data;
		response = await API.get(`/highlighted`, {});
		highlighted = response.data;
		//console.log(metrics);
	});

	function updateSimulationParameters(link) {
		const urlParams = new URLSearchParams(link);
		if (urlParams.get('s') != null) {
			nbIter = Number(urlParams.get('s'));
		}
		if (urlParams.get('w') != null) {
			tapeWidth = Number(urlParams.get('w'));
		}
		if (urlParams.get('ox') != null) {
			origin_x = Number(urlParams.get('ox'));
		}
	}
</script>

<SvelteSeo title="bbchallenge" />

<div>
	{#if metrics != null}
		<div class="text-xs mb-1 mt-2 ml-3 <md:ml-0">
			<div class="flex md:flex-col space-x-2">
				<span class="underline">Challenge goal</span>
				<div class="flex flex-col">
					<div>
						There remains <strong>{numberWithCommas(metrics['total_undecided'])}</strong> machines
						to decide (out of {numberWithCommas(metrics['total'])})
					</div>
					<div style="font-size:0.65rem">
						Only {numberWithCommas(metrics['total_undecided_with_heuristcs'])} if considering heuristics
					</div>
					<a
						href="/contribute"
						style="font-size:0.6rem"
						class="text-blue-400 hover:text-blue-300 cursor-pointer"
					>
						You can help!!
					</a>
				</div>
			</div>
		</div>
	{/if}
	<div class="mt-3 <sm:mt-3 w-full flex items-start justify-center <sm:flex-col">
		<div class="flex flex-col items-start">
			<div class="bg-black mr-5">
				<canvas bind:this={canvasEl} width={canvas.width} height={canvas.height} />
			</div>

			<div class="mt-1 flex flex-col">
				<div>Simulation parameters:</div>
				<div class="flex space-x-3 pl-2 text-sm ">
					<label class="flex flex-col ">
						steps
						<input
							class="w-[70px]"
							type="number"
							bind:value={nbIter}
							on:change={() => {
								draw();
								window.history.replaceState({}, '', getSimulationLink());
							}}
						/></label
					>
					<label class="flex flex-col">
						tape width
						<input
							class="w-[70px]"
							type="number"
							bind:value={tapeWidth}
							on:change={() => {
								draw();
								window.history.replaceState({}, '', getSimulationLink());
							}}
						/></label
					>
					<label class="flex flex-col">
						origin x
						<input
							class="w-[70px]"
							type="number"
							bind:value={origin_x}
							on:change={() => {
								draw();
								window.history.replaceState({}, '', getSimulationLink());
							}}
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
						navigator.clipboard.writeText(getSimulationLink(true));
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
				{#if machine !== null}
					<div
						class="text-lg cursor-pointer select-none"
						on:click={async () => {
							await loadMachineFromID(machineID);
							draw();
							window.history.replaceState({}, '', getSimulationLink());
						}}
					>
						{#if machineID !== null}
							Machine #<span class="underline">{numberWithCommas(machineID)}</span>
						{:else}
							Machine <span class="underline text-xs" href={getSimulationLink()}
								>{tmTob64URLSafe(machine)}</span
							>
						{/if}
					</div>
					<TmTable {machine} {machineID} decisionStatus={machineStatus} />
				{/if}
			</div>

			<div class="mt-4 flex flex-col items-start">
				<div>Change machine:</div>
				<div class="ml-3 mt-1 text-sm">
					<div>Random machine from the database:</div>

					<!-- {#if !preSeed} -->
					<div class="flex flex-col items-end mx-3 ">
						<button
							class="bg-blue-500 p-1 mt-1 w-full ml-2 "
							on:click={async () => {
								await getRandomMachine();
								draw();
								window.history.replaceState({}, '', getSimulationLink());
							}}>Go Random</button
						>
						<div
							class="text-xs text-right text-blue-400 hover:text-blue-300 cursor-pointer select-none"
							on:click={() => {
								showRandomOptions = !showRandomOptions;
							}}
						>
							{#if !showRandomOptions}More{:else}Less{/if} options
						</div>
					</div>
				</div>
				<div class="ml-3 mt-1 text-sm">
					<div class="ml-2 flex flex-col space-y-1 ">
						<!-- {:else}
							<button
								class="bg-blue-500 p-1 mx-3 mt-1"
								on:click={async () => {
									_goto('/');
								}}>Go Random</button
							>
						{/if} -->

						{#if showRandomOptions}
							<div class="mx-3">
								<label class="flex space-x-2 items-center select-none cursor-pointer">
									<input type="radio" bind:group={randomType} name="randomType" value="all" />
									<div>any machine (88,664,064)</div>
								</label>
								<label class="flex space-x-2 items-center select-none cursor-pointer">
									<input
										type="radio"
										bind:group={randomType}
										name="randomType"
										value="all_undecided"
									/>
									<div>
										only undecided machine {#if metrics !== null}({numberWithCommas(
												metrics['total_undecided']
											)}){/if}
									</div>
								</label>
								<label
									class="mt-2 flex space-x-2 items-center select-none cursor-pointer w-[300px]"
								>
									<input
										type="radio"
										bind:group={randomType}
										name="randomType"
										value="all_undecided_apply_heuristics"
									/>
									<div>
										only undecided machine not heuristically decided {#if metrics !== null}({numberWithCommas(
												metrics['total_undecided_with_heuristcs']
											)}){/if}
									</div>
								</label>
							</div>
						{/if}
					</div>
				</div>
				<div class="ml-3 mt-2 text-sm">
					<div>From id in the database:</div>
					{#if typedMachineError}
						<div class="text-red-400 text-xs break-words w-[300px]">{typedMachineError}</div>
					{/if}
					<div class="ml-5 flex items-center  space-x-4 ">
						<input
							type="number"
							class="w-[200px]"
							placeholder="max 88664063"
							min="0"
							max="88664063"
							bind:value={typedMachineID}
							on:change={async () => {
								await loadMachineFromID(typedMachineID);
								draw();
								window.history.replaceState({}, '', getSimulationLink());
							}}
						/>
						<button class="bg-blue-500 p-1 px-2 ">Go </button>
					</div>
				</div>
				<div class="ml-3 mt-1 text-sm">
					<div>From machine b64:</div>
					{#if b64Error}
						<div class="text-red-400 text-xs break-words w-[300px]">{b64Error}</div>
					{/if}
					<div class="ml-5 flex items-center  space-x-4 ">
						<input
							type="text"
							class="w-[200px]"
							placeholder="Starts with m"
							bind:value={typedb64}
						/>
						<button
							class="bg-blue-500 p-1 px-2 "
							on:click={() => {
								loadMachineFromB64(typedb64);
								draw();
								window.history.replaceState({}, '', getSimulationLink());
							}}
							>Go
						</button>
					</div>
				</div>
			</div>

			{#if history}
				<div class="mt-0 flex flex-col">
					<div class="ml-3 mt-4 text-sm ">
						<div
							class="text-blue-400
				hover:text-blue-300
				cursor-pointer
				select-none underline"
							on:click={() => {
								showHistory = !showHistory;
							}}
						>
							{#if !showHistory}Show{:else}Hide{/if} History
						</div>
						{#if showHistory}
							<div class=" mt-1 ml-3 w-[300px] overflow-x-auto pb-2">
								{#each history as entry}
									{entry}&nbsp;
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<div class="mt-5 w-full mb-10 flex space-x-2 justify-center">
		<div>
			{#if highlighted != null && highlighted['highlighted_undecided'] != null}
				<div class="text-lg">Highlighted undecided machines</div>
				<div class="text-sm w-[400px] mt-1 ml-2">
					Here are some interesting machines that are still undecided:
				</div>
				<div class="mt-1 ml-8 w-full flex flex-col  ">
					{#each highlighted['highlighted_undecided'] as m}
						{#if m['machine_id'] !== undefined}
							<div
								class="cursor-pointer select-none"
								on:click={async () => {
									await loadMachineFromID(m['machine_id']);
									updateSimulationParameters(m['link']);
									draw();
									window.history.replaceState({}, '', m['link']);
								}}
							>
								&middot;&nbsp;{#if m['title'] != undefined}{m['title']}{:else}Machine #<span
										class="underline">{numberWithCommas(m['machine_id'])}</span
									>{/if}
							</div>
						{:else if m['b64'] !== undefined}
							<div
								class="cursor-pointer select-none"
								on:click={async () => {
									await loadMachineFromB64(m['b64']);
									updateSimulationParameters(m['link']);
									draw();
									window.history.replaceState({}, '', m['link']);
								}}
							>
								&middot;&nbsp;{#if m['title'] != undefined}{m['title']}{:else}Machine <span
										class="underline">{m['b64']}</span
									>{/if}
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
		<div>
			{#if highlighted != null && highlighted['highlighted_halt'] != null}
				<div class="text-lg ">Highlighted halting machines</div>
				<div class="text-sm w-[400px] mt-1 ml-2">
					The following 5-state machines halt after quite some steps:
				</div>
				<div class="mt-2 ml-8 w-full flex flex-col space-y-1">
					{#each highlighted['highlighted_halt'] as m}
						{#if m['machine_id'] !== undefined}
							<div
								class="cursor-pointer select-none"
								on:click={async () => {
									await loadMachineFromID(m['machine_id']);
									updateSimulationParameters(m['link']);
									draw();
									window.history.replaceState({}, '', m['link']);
								}}
							>
								&middot;&nbsp;{#if m['title'] != undefined}{m['title']}{:else}Machine #<span
										class="underline">{numberWithCommas(m['machine_id'])}</span
									>{/if}
							</div>
						{:else if m['b64'] !== undefined}
							<div
								class="cursor-pointer select-none"
								on:click={async () => {
									await loadMachineFromB64(m['b64'], TMDecisionStatus.DECIDED_HALT);
									updateSimulationParameters(m['link']);
									draw();
									window.history.replaceState({}, '', m['link']);
								}}
							>
								&middot;&nbsp;{#if m['title'] != undefined}{m['title']}{:else}Machine {m[
										'b64'
									]}{/if}
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
