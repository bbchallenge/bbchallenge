<script lang="ts">
	import { onMount } from 'svelte';
	import TmTable from '$lib/tm_table.svelte';
	import { API } from '$lib/api_server';
	import { addToHistory, getHistory, numberWithCommas } from '$lib/utils';
	import {
		TMDecisionStatus,
		tm_trace_to_image,
		tm_explore,
		tmToMachineCode,
		machineCodeToTM,
		DB_SIZE,
		APIDecisionStatusToTMDecisionStatus
	} from '$lib/tm';
	import { BB5_champion } from '$lib/machine_repertoire';
	import SvelteSeo from 'svelte-seo';

	import Zoology from '$lib/zoology.svelte';
	import Highlights from '$lib/highlights.svelte';

	let machine = null;
	export let machineID = null;
	export let machineCode = null;
	export let preSeed = false;
	export let machineStatus = null;
	let machineDecider = null;
	let history = getHistory();
	let showHistory = false;
	let showSimulationParams = false;

	//machine = b64URLSafetoTM('mAQACAAAAAQEDAAAEAQAFAQEEAQACAAAFAQECAQED');
	//console.log(machine);

	let canvas;

	let exploreMode = false;
	let showHeadMove = true;

	const drawRect = (context) => {
		context.fillStyle = 'black';
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.fill();
	};

	const nbIterDefault = 10000;
	const tapeWidthDefault = 300;
	const origin_xDefault = 0.5;
	export let nbIter = nbIterDefault;
	export let tapeWidth = tapeWidthDefault;
	export let origin_x = origin_xDefault;

	let initial_tape = '0';
	// Default the params if called with null
	if (nbIter == null) {
		nbIter = nbIterDefault;
	}
	if (tapeWidth == null) {
		tapeWidth = tapeWidthDefault;
	}
	if (origin_x == null) {
		origin_x = origin_xDefault;
	}

	function getSimulationLink(forCopy = false) {
		let prefix = 'https://bbchalenge.org/';
		if (!forCopy) {
			prefix = '/';
		}
		let secondPrefix = tmToMachineCode(machine);
		if (machineID != null) {
			secondPrefix = machineID;
		} else if (machineCode != null) {
			secondPrefix = machineCode;
		}

		let last_add = '';
		if (machineStatus !== null && machineID === null) {
			last_add = `&status=${machineStatus}`;
		}

		let simulationParametersLink = '';
		if (nbIter !== nbIterDefault) {
			simulationParametersLink += `&s=${nbIter}`;
		}
		if (tapeWidth !== tapeWidthDefault) {
			simulationParametersLink += `&w=${tapeWidth}`;
		}
		if (origin_x !== origin_xDefault) {
			simulationParametersLink += `&ox=${origin_x}`;
		}

		return prefix + secondPrefix + simulationParametersLink + last_add;
	}

	let showRandomOptions = false;

	let drawCleanup;
	function draw() {
		if (drawCleanup) drawCleanup();

		const context = canvas.getContext('2d');
		drawRect(context);
		if (exploreMode) {
			drawCleanup = tm_explore(context, machine, initial_tape, nbIter);
		} else {
			tm_trace_to_image(
				context,
				machine,
				initial_tape,
				tapeWidth,
				nbIter,
				origin_x,
				true,
				showHeadMove
			);
		}
	}

	let randomType = 'all_undecided';

	async function getRandomMachine() {
		try {
			const response = await API.post('/machine/random', { type: randomType });

			machine = machineCodeToTM(response.data['machine_code']);
			machineID = response.data['machine_id'];
			machineDecider = null;

			addToHistory(machineID);
			history = getHistory();

			if (response.data['status'] !== undefined) {
				machineStatus = APIDecisionStatusToTMDecisionStatus(response.data['status']);
				if (
					machineStatus == TMDecisionStatus.DECIDED_HALT ||
					machineStatus == TMDecisionStatus.DECIDED_NON_HALT
				) {
					machineDecider = (await API.get(`/machine/${machineID}/decider`, '')).data[
						'decider_file'
					];
					console.log('Decider:', machineDecider);
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

			machine = machineCodeToTM(response.data['machine_code']);
			localMachineID = response.data['machine_id'];
			machineID = localMachineID;
			machineDecider = null;

			addToHistory(localMachineID);
			history = getHistory();

			if (response.data['status'] !== undefined) {
				machineStatus = APIDecisionStatusToTMDecisionStatus(response.data['status']);
				if (
					machineStatus == TMDecisionStatus.DECIDED_HALT ||
					machineStatus == TMDecisionStatus.DECIDED_NON_HALT
				) {
					machineDecider = (await API.get(`/machine/${machineID}/decider`, '')).data[
						'decider_file'
					];
					console.log('Decider:', machineDecider);
				}
			}

			console.log(machine, machineID);
		} catch (error) {
			typedMachineError = error;
			console.log(error);
		}
	}

	let typedMachineCode = null;
	let machineCodeError = null;
	function loadMachineFromMachineCode(machine_code, status = null) {
		machine = null;
		machineID = null;
		machineStatus = status;
		machineDecider = null;
		try {
			machineCodeError = null;
			machine = machineCodeToTM(machine_code);
			addToHistory(machine_code);
			history = getHistory();
			draw();
		} catch (error) {
			machineCodeError = error;
		}
	}

	let metrics = null;

	let apiDown = false;
	onMount(async () => {
		try {
			let response = await API.get(`/metrics`, {});
			metrics = response.data;
		} catch (error) {
			apiDown = true;
		}
		if (!preSeed) {
			try {
				await getRandomMachine();
				window.history.replaceState({}, '', getSimulationLink());
			} catch (error) {
				apiDown = true;
			}
		} else if (machineID != null) {
			try {
				await loadMachineFromID(machineID);
			} catch (error) {
				apiDown = true;
			}
		} else if (machineCode != null) {
			await loadMachineFromMachineCode(machineCode, machineStatus);
		}

		if (apiDown && machineCode == null) {
			await loadMachineFromMachineCode(BB5_champion, TMDecisionStatus.UNDECIDED);
			origin_x = 0.65;
		}

		draw();
		//console.log(metrics);
	});

	function defaultSimulationParameters() {
		origin_x = origin_xDefault;
		nbIter = nbIterDefault;
		tapeWidth = tapeWidthDefault;
	}

	async function keydown(e) {
		switch (e.keyCode) {
			case 82:
				await getRandomMachine();
				draw();
				window.history.replaceState({}, '', getSimulationLink());
				break;
		}
	}
</script>

<svelte:window on:keydown={keydown} />

<SvelteSeo title="bbchallenge" />

<div>
	{#if apiDown}
		<div class="text-xs mb-1 mt-2 md:ml-3 ml-0">
			<div class="flex flex-col">
				<div class="text-red-500">The API is down.</div>
				<div>However you can still load machines from their b64 description.</div>
			</div>
		</div>
	{/if}

	<div class="text-sm mb-1 mt-2 md:ml-3 ml-0">
		<div class="flex flex-col space-y-1 min-h-[65px] ">
			{#if metrics != null}
				<span class="underline">Challenge goal</span>
				<div class="flex flex-col">
					<div>
						There remain <strong>{numberWithCommas(metrics['total_undecided'])}</strong> machines
						with 5 states to decide (out of {numberWithCommas(metrics['total'])})
					</div>
					<!-- <div style="font-size:0.65rem">
							Only {numberWithCommas(metrics['total_undecided_with_heuristcs'])} if considering heuristics
						</div> -->
					<a
						href="/contribute"
						rel="external"
						style="font-size:0.6rem"
						class="text-blue-400 hover:text-blue-300 cursor-pointer"
					>
						You can help!!
					</a>
				</div>
			{/if}
		</div>
	</div>

	<div class="flex md:justify-center ">
		<div class="flex flex-col  ">
			<div
				class="flex  flex-col  mt-3 "
				class:md:flex-row={!exploreMode}
				class:items-start={!exploreMode}
				class:colors={exploreMode}
			>
				<div class="flex flex-col items-start  ">
					<canvas
						class="bg-black mr-5 image-render-pixel"
						bind:this={canvas}
						width={exploreMode ? 800 : 400}
						height="500"
					/>
					<div class="text-xs pt-0 flex  space-x-1 mt-2">
						<!-- <div
							class="text-blue-400 hover:text-blue-300 cursor-pointer"
							on:click={() => {
								navigator.clipboard.writeText(getSimulationLink(true));
							}}
						>
							Copy simulation link
						</div>
						<div>&middot;</div> -->
						<a
							href="/story#space-time-diagrams"
							rel="external"
							class="text-blue-400 hover:text-blue-300 cursor-pointer select-none"
						>
							What is this?
						</a>
						<div>&middot;</div>
						<div
							class="text-blue-400 hover:text-blue-300 cursor-pointer select-none"
							class:text-blue-300={showSimulationParams}
							on:click={() => {
								showSimulationParams = !showSimulationParams;
							}}
						>
							Simulation Parameters
						</div>
						<div>&middot;</div>
						{#if canvas}
							<div
								class="text-blue-400 hover:text-blue-300 cursor-pointer select-none"
								on:click={() => {
									var image = new Image();
									image.src = canvas.toDataURL();
									let w = window.open('');
									w.document.write(image.outerHTML);
								}}
							>
								Export image
							</div>
						{/if}
					</div>
					<div class="mt-1 flex flex-col ">
						{#if showSimulationParams}
							<div class="mb-2">
								<div class="flex space-x-3 text-sm">
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
										x-translation
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
								<label class="text-sm mt-2 flex flex-col space-y-1 cursor-pointer select-none">
									<div>initial tape content</div>
									<input bind:value={initial_tape} on:change={draw} />
								</label>
							</div>
							{#if !exploreMode}
								<label class="text-sm mt-2 flex items-center space-x-2 cursor-pointer select-none">
									<input type="checkbox" bind:checked={showHeadMove} on:change={draw} />
									<div>Show head movement (green for L, red for R)</div>
								</label>
							{/if}
						{/if}
						<label class="text-sm mt-1 flex items-center space-x-2 cursor-pointer select-none">
							<input type="checkbox" bind:checked={exploreMode} on:change={draw} />
							<div>Explore mode</div>
						</label>
					</div>
				</div>

				<div
					class={!exploreMode
						? 'mt-3 md:mt-0 md:ml-10 lg:ml-20 '
						: 'flex w-full space-x-36 mb-5 mt-3'}
				>
					<div>
						{#if machine !== null}
							{#if machineID !== null}
								<div
									class="text-lg cursor-pointer select-none"
									on:click={async () => {
										await loadMachineFromID(machineID);
										draw();
										window.history.replaceState({}, '', getSimulationLink());
									}}
								>
									Machine #<span class="underline">{numberWithCommas(machineID)}</span>
								</div>
							{:else}
								<div
									class="text-lg cursor-pointer select-none"
									on:click={async () => {
										await loadMachineFromMachineCode(tmToMachineCode(machine), machineStatus);
										draw();
										window.history.replaceState({}, '', getSimulationLink());
									}}
								>
									Machine <div class="underline text-sm ml-2 mb-1">{tmToMachineCode(machine)}</div>
								</div>
							{/if}

							<TmTable {machine} {machineID} decisionStatus={machineStatus} {machineDecider} />
						{/if}
					</div>

					<div class="mt-4 flex flex-col items-start">
						<div>Change machine:</div>
						<div class="ml-3 mt-1 text-sm">
							<div>
								Random machine from the <a
									href="https://bbchallenge.org/method#seed-database"
									class="text-blue-400 hover:text-blue-300 cursor-pointer underline"
									rel="external">seed database</a
								>:
							</div>

							<!-- {#if !preSeed} -->
							<div class="flex flex-col items-end mx-3 ">
								<button
									class="bg-blue-500 p-1 mt-1 w-full ml-2 "
									on:click={async () => {
										await getRandomMachine();
										draw();
										window.history.replaceState({}, '', getSimulationLink());
									}}>Go (R)andom</button
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
										<!-- <label
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
										</label> -->
									</div>
								{/if}
							</div>
						</div>
						<div class="ml-3 mt-2 text-sm">
							<div>
								From id in the <a
									href="https://bbchallenge.org/method#seed-database"
									class="text-blue-400 hover:text-blue-300 cursor-pointer underline"
									rel="external">seed database</a
								>:
							</div>
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
							<div>From compact machine code:</div>
							{#if machineCodeError}
								<div class="text-red-400 text-xs break-words w-[300px]">{machineCodeError}</div>
							{/if}
							<div class="ml-5 flex items-center  space-x-4 ">
								<input type="text" class="w-[200px]" placeholder="" bind:value={typedMachineCode} />
								<button
									class="bg-blue-500 p-1 px-2 "
									on:click={() => {
										loadMachineFromMachineCode(typedMachineCode);
										draw();
										window.history.replaceState({}, '', getSimulationLink());
									}}
									>Go
								</button>
							</div>
						</div>

						<div>
							{#if history}
								<div class="mt-0 flex flex-col">
									<div class="ml-3 mt-2 text-sm ">
										<div
											class="text-blue-400 hover:text-blue-300 cursor-pointer select-none underline"
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
				</div>
			</div>
			<div class="mt-5  mb-10 flex flex-col space-y-8 ">
				<div class=" flex flex-col space-y-5 md:flex-row md:space-x-12 lg:space-y-0">
					<Zoology
						on:machine_id={async (ev) => {
							let machine_id = ev.detail.machine_id;

							await loadMachineFromID(machine_id);
							defaultSimulationParameters();
							draw();
							window.history.replaceState({}, '', getSimulationLink());
						}}
					/>
					<Highlights
						on:machine_id={async (ev) => {
							let machine_id = ev.detail.machine_id;

							await loadMachineFromID(machine_id);
							defaultSimulationParameters();

							draw();
							window.history.replaceState({}, '', getSimulationLink());
						}}
						on:machine_code={async (ev) => {
							let machine_code = ev.detail.machine_code;
							let machine_status = ev.detail.machine_status;

							await loadMachineFromMachineCode(machine_code, machine_status);
							defaultSimulationParameters();
							draw();
							window.history.replaceState({}, '', getSimulationLink());
						}}
					/>
				</div>
			</div>
		</div>
	</div>
</div>
