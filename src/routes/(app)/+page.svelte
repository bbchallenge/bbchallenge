<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import TmTable from '$lib/tm_table.svelte';
	import { API } from '$lib/api_server';
	import { addToHistory, getHistory, numberWithCommas } from '$lib/utils';
	import {
		TMDecisionStatus,
		tm_trace_to_image,
		tm_explore,
		tm_blaze,
		tmToMachineCode,
		machineCodeToTM,
		DB_SIZE,
		APIDecisionStatusToTMDecisionStatus,
		formatStepCountWithCommas,
		parseFormattedStepCount
	} from '$lib/tm';
	import { BB5_23M_steps_halter, BB5_champion, Skelet_machines } from '$lib/machine_repertoire';

	import DecidersAndZoology from '$lib/deciders-and-zoology.svelte';
	import Highlights_BB5 from '$lib/highlights_bb5.svelte';
	import Highlights_BB6 from '$lib/highlights_bb6.svelte';
	import Highlights_BB2x5 from '$lib/highlights_bb2x5.svelte';
	import Highlights_BB3x3 from '$lib/highlights_bb3x3.svelte';
	import News from '$lib/news.svelte';
	import SeoTitle from '$lib/seo_title.svelte';
	import MachineCanvas from './MachineCanvas.svelte';

	enum Challenge {
		BB5 = 'BB(5)',
		BB6 = 'BB(6)',
		BB2x5 = 'BB(2,5)',
		BB3x3 = 'BB(3,3)'
	}

	enum VisualizationMode {
		DEFAULT = 'default',
		EXPLORE = 'explore',
		BLAZE = 'blaze'
	}

	function isDefaultMode(mode: VisualizationMode) {
		return mode === VisualizationMode.DEFAULT;
	}

	function isExploreMode(mode: VisualizationMode) {
		return mode === VisualizationMode.EXPLORE;
	}

	function isBlazeMode(mode: VisualizationMode) {
		return mode === VisualizationMode.BLAZE;
	}

	function showBlazeOption(machine: any) {
		return machine !== null && machine.symbols === 2;
	}

	function challenge_to_state_string(challenge: Challenge) {
		if (challenge == Challenge.BB5) {
			return '5-state 2-symbol';
		} else if (challenge == Challenge.BB6) {
			return '6-state 2-symbol';
		} else if (challenge == Challenge.BB2x5) {
			return '2-state 5-symbol';
		} else if (challenge == Challenge.BB3x3) {
			return '3-state 3-symbol';
		}
	}

	function challenge_to_interesting_machine_file(challenge: Challenge) {
		if (challenge == Challenge.BB6) {
			return 'BB6_holdouts_10020.txt';
		} else if (challenge == Challenge.BB2x5) {
			return '2x5_holdouts_217.txt';
		} else if (challenge == Challenge.BB3x3) {
			return '3x3.todo.txt';
		}
	}

	let machine = null;
	export let machineID = null;
	export let machineCode = null;
	export let preSeed = false;
	export let machineStatus = null;

	let machineDecider = null;
	let history = getHistory();
	let showHistory = false;
	let showSimulationParams = false;

	let curr_challenge = Challenge.BB5;

	//machine = b64URLSafetoTM('mAQACAAAAAQEDAAAEAQAFAQEEAQACAAAFAQECAQED');
	//console.log(machine);

	let visualizationMode = VisualizationMode.DEFAULT;
	// Initialize previousVisualizationMode to null
	let previousVisualizationMode: VisualizationMode | null = null;
	let showHeadMove = true;

	// Renamed from xStretch to stretch
	let stretch = true;

	// New state for quality toggle in Blaze mode
	let quality = true;

	// New state for light/dark mode toggle in Blaze mode
	let darkMode = false;

	const nbIterDefault = 10000n;
	const tapeWidthDefault = 400;
	const origin_xDefault = 0.5;
	export let nbIter: bigint = nbIterDefault;
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

		// Create URL object to properly handle and preserve query parameters
		const url = new URL(window.location.origin + '/' + secondPrefix);

		// Add simulation parameters
		if (nbIter !== nbIterDefault) {
			url.searchParams.set('s', nbIter.toString());
		}
		if (tapeWidth !== tapeWidthDefault) {
			url.searchParams.set('w', tapeWidth.toString());
		}
		if (origin_x !== origin_xDefault) {
			url.searchParams.set('ox', origin_x.toString());
		}

		// For local navigation, just return the pathname and search
		if (!forCopy) {
			return url.pathname + url.search;
		}

		// For copying, return the full URL
		return url.href;
	}

	let showRandomOptions = false;

	let randomType = 'all_undecided';

	async function getRandomMachine() {
		if (curr_challenge == Challenge.BB5) {
			try {
				const response = await API.get(`/machine/random?type=${randomType}`, '');

				machine = machineCodeToTM(response.data['machine_code']);
				machineCode = response.data['machine_code'];
				machineID = response.data['machine_id'];
				machineDecider = null;
				window.history.pushState({}, '', getSimulationLink());
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
		} else {
			const response = await fetch(challenge_to_interesting_machine_file(curr_challenge));
			const text = (await response.text()).split('\n');
			const random_machine_list_id = Math.floor(Math.random() * text.length);
			let machine_code = text[random_machine_list_id].trim();
			machineStatus = null;
			// In case empty line
			while (machine_code === '') {
				const random_machine_list_id = Math.floor(Math.random() * text.length);
				machine_code = text[random_machine_list_id].trim();
			}

			machineID = null;
			machine = machineCodeToTM(machine_code);
			machineCode = machine_code;

			window.history.pushState({}, '', getSimulationLink());
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

			window.history.pushState({}, '', getSimulationLink());

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
		machine_code = machine_code.trim().toUpperCase();
		try {
			machineCodeError = null;
			machineCode = machine_code;
			machine = machineCodeToTM(machine_code);

			window.history.pushState({}, '', getSimulationLink());
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
				console.log('HERRRE');
				await getRandomMachine();
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

		if (machine !== null) {
			if (machine.states == 5 && machine.symbols == 2) {
				curr_challenge = Challenge.BB5;
			} else if (machine.states == 6 && machine.symbols == 2) {
				curr_challenge = Challenge.BB6;
			} else if (machine.states == 2 && machine.symbols == 5) {
				curr_challenge = Challenge.BB2x5;
			} else if (machine.states == 3 && machine.symbols == 3) {
				curr_challenge = Challenge.BB3x3;
			}
		}
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
				break;
		}
	}

	let serverDown = false;

	// Reactive statement to detect transition from Blaze to non-Blaze mode.
	$: {
		if (
			previousVisualizationMode === VisualizationMode.BLAZE &&
			visualizationMode !== VisualizationMode.BLAZE
		) {
			if (nbIter > 10000) {
				nbIter = 10000n;
				window.history.pushState({}, '', getSimulationLink());
				console.log('Switched from Blaze: nbIter limited to 10,000');
			}
		}
		// Update previousVisualizationMode *after* the check
		previousVisualizationMode = visualizationMode;
	}

	// New reactive statement: when switching to Blaze mode, show simulation parameters.
	$: if (visualizationMode === VisualizationMode.BLAZE) {
		showSimulationParams = true;
	}

	// New reactive statement: auto-switch from Blaze to Default mode for machines with more than 2 symbols
	$: if (machine !== null && visualizationMode === VisualizationMode.BLAZE && machine.symbols > 2) {
		visualizationMode = VisualizationMode.DEFAULT;
		console.log('Auto-switched from Blaze to Default mode: machine has more than 2 symbols');
	}

	// Add a new variable to hold the formatted steps value for display
	let formattedNbIter = '';

	// Update formattedNbIter whenever nbIter changes
	$: formattedNbIter = formatStepCountWithCommas(nbIter.toString());
</script>

{#key machineID || machineCode}
	<SeoTitle value={machineID || machineCode} />
{/key}

<svelte:window on:keydown={keydown} />

<div>
	{#if serverDown}
		<div class="text-xs mb-1 mt-2 md:ml-3 ml-0">
			<div class="flex flex-col">
				<div class="text-red-500">
					Our API, forum and wiki are momentarily down, please try again later, sorry!
				</div>
			</div>
		</div>
	{/if}
	{#if apiDown}
		<div class="text-xs mb-1 mt-2 md:ml-3 ml-0">
			<div class="flex flex-col">
				<div class="text-red-500">Our API is momentarily down, please try again later, sorry!</div>
			</div>
		</div>
	{/if}

	<div class="text-sm mb-1 mt-2 md:ml-3 ml-0">
		<div class="flex flex-col space-y-1 mb-3">
			<span class="underline">Choose challenge</span>
			<div>
				<select
					class="text-black"
					bind:value={curr_challenge}
					on:change={async () => {
						await getRandomMachine();
					}}
				>
					{#each Object.values(Challenge) as challenge}
						<option value={challenge}>{challenge}</option>
					{/each}
				</select>
			</div>
		</div>
		<div class="flex flex-col space-y-1 min-h-[65px]">
			<span class="underline">Challenge goal</span>
			<div class="flex flex-col items-start">
				<div>
					{#if curr_challenge == Challenge.BB5}
						There remain <strong>0</strong> machine with 5 states to decide!! 🥳
						<br />
						We have reached
						<a
							href="https://bbchallenge.org/story#goal"
							class="text-blue-400 hover:text-blue-300 cursor-pointer"
							rel="external">our goal</a
						>
						of proving "<a
							href="https://wiki.bbchallenge.org/wiki/BB(5)"
							class="text-blue-400 hover:text-blue-300 cursor-pointer"
							rel="external">BB(5)</a
						>
						= 47,176,870":
						<ul class="list-disc ml-10">
							<li>
								See the formal <a
									href="https://github.com/ccz181078/Coq-BB5"
									class="text-blue-400 hover:text-blue-300 cursor-pointer">Coq proof</a
								>
							</li>
							<li>
								See the <a
									href="https://discuss.bbchallenge.org/t/july-2nd-2024-we-have-proved-bb-5-47-176-870/237"
									class="text-blue-400 hover:text-blue-300 cursor-pointer">official announcement</a
								>
							</li>
						</ul>
						<br />
						Here's what's next:
						<ul class="list-decimal ml-10">
							<li>We are writing a human-readable paper presenting the BB(5) proof</li>
							<li>
								We are working on new busy beaver values such as BB(6) and setting new goals for
								these
							</li>
							<li>
								We are maintaining busy beaver knowledge through our <a
									href="https://discord.gg/wuZhtTvYU3"
									class="text-blue-400 hover:text-blue-300 cursor-pointer"
									rel="external">Discord</a
								>,
								<a
									href="https://discuss.bbchallenge.org/"
									class="text-blue-400 hover:text-blue-300 cursor-pointer"
									rel="external">forum</a
								>
								and
								<a
									href="https://wiki.bbchallenge.org/"
									class="text-blue-400 hover:text-blue-300 cursor-pointer"
									rel="external">wiki</a
								>
							</li>
						</ul>
					{:else}
						Setting the challenge's goal is work in progress.<br />Meanwhile, you can browse
						<a
							href={'/' + challenge_to_interesting_machine_file(curr_challenge)}
							rel="external"
							class="text-blue-400 hover:text-blue-300 cursor-pointer">a list</a
						>
						of interesting {challenge_to_state_string(curr_challenge)} machines.
					{/if}
				</div>
				<!-- <div style="font-size:0.65rem">
							Only {numberWithCommas(metrics['total_undecided_with_heuristcs'])} if considering heuristics
						</div> -->
				<div class="flex items-center space-x-1">
					<div>
						<a
							href="https://discord.gg/wuZhtTvYU3"
							rel="external"
							style="font-size:0.6rem"
							class="text-blue-400 hover:text-blue-300 cursor-pointer"
						>
							Join our Discord server
						</a>
					</div>
					<div>&middot;</div>
					<div>
						<a
							href="/contribute"
							rel="external"
							style="font-size:0.6rem"
							class="text-blue-400 hover:text-blue-300 cursor-pointer"
						>
							You can help!!
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="flex md:justify-center">
		<div class="flex flex-col">
			<div
				class="flex flex-col mt-3"
				class:md:flex-row={isDefaultMode(visualizationMode)}
				class:items-start={isDefaultMode(visualizationMode)}
				class:colors={isExploreMode(visualizationMode)}
			>
				<div class="flex flex-col items-start">
					<MachineCanvas
						{visualizationMode}
						{machine}
						{initial_tape}
						{tapeWidth}
						{nbIter}
						{origin_x}
						{showHeadMove}
						machineName={machineCode || machineID}
						{stretch}
						{quality}
						{darkMode}
					/>
					<div class="text-xs pt-0 flex space-x-1 mt-2">
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
							class="text-blue-400 hover:text-blue-300 cursor-pointer"
						>
							What is this?
						</a>
						<div>&middot;</div>
						<button
							class="text-blue-400 hover:text-blue-300 cursor-pointer"
							class:text-blue-300={showSimulationParams}
							on:click={() => {
								showSimulationParams = !showSimulationParams;
							}}
						>
							Simulation Parameters
						</button>
					</div>
					<div class="mt-1 flex flex-col">
						{#if showSimulationParams}
							<div class="mb-2">
								<div class="flex space-x-3 text-sm">
									<label class="flex flex-col">
										steps
										<div class="flex items-center">
											<input
												class={isBlazeMode(visualizationMode)
													? 'w-[150px] text-black'
													: 'w-[70px] text-black'}
												type="text"
												value={formattedNbIter}
												on:input={(e) => {
													// Format the input value with commas
													const plainValue = parseFormattedStepCount(e.currentTarget.value);
													if (!isNaN(Number(plainValue))) {
														nbIter = BigInt(plainValue || '0');
														formattedNbIter = formatStepCountWithCommas(plainValue);
														e.currentTarget.value = formattedNbIter;
													}
												}}
												on:change={(e) => {
													const plainValue = parseFormattedStepCount(e.currentTarget.value);
													nbIter = BigInt(plainValue || '0');
													const url = new URL(window.location.href);
													window.history.pushState({}, '', getSimulationLink());
													// Update the displayed value with proper formatting
													formattedNbIter = formatStepCountWithCommas(nbIter.toString());
													e.currentTarget.value = formattedNbIter;
												}}
												on:blur={(e) => {
													if (!isBlazeMode(visualizationMode)) {
														if (isNaN(Number(nbIter)) || nbIter <= 0n) nbIter = 1n;
														if (nbIter > 99999n) nbIter = 99999n;
													}
													formattedNbIter = formatStepCountWithCommas(nbIter.toString());
													e.currentTarget.value = formattedNbIter;
												}}
											/>
											{#if isBlazeMode(visualizationMode)}
												<button
													class="ml-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded"
													on:click={() => {
														nbIter = nbIter * 10n;
														formattedNbIter = formatStepCountWithCommas(nbIter.toString());
														window.history.pushState({}, '', getSimulationLink());
													}}
												>
													▲ ×10
												</button>
												<button
													class="ml-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded"
													on:click={() => {
														nbIter = nbIter > 10n ? nbIter / 10n : 1n;
														formattedNbIter = formatStepCountWithCommas(nbIter.toString());
														window.history.pushState({}, '', getSimulationLink());
													}}
												>
													▼ ÷10
												</button>
												<button
													class="ml-1 text-xs px-1 py-0.5 rounded"
													class:bg-blue-600={stretch}
													class:text-white={stretch}
													class:border={!stretch}
													class:bg-gray-200={!stretch}
													class:text-gray-800={!stretch}
													on:click={() => (stretch = !stretch)}
												>
													stretch
												</button>
												<button
													class="ml-1 text-xs px-1 py-0.5 rounded"
													class:bg-blue-600={quality}
													class:text-white={quality}
													class:border={!quality}
													class:bg-gray-200={!quality}
													class:text-gray-800={!quality}
													on:click={() => (quality = !quality)}
													data-param="quality"
												>
													{quality ? 'quality' : 'speed'}
												</button>
												<button
													class="ml-1 text-xs px-1 py-0.5 rounded border"
													class:bg-white={!darkMode}
													class:bg-black={darkMode}
													class:text-orange-500={!darkMode}
													class:text-white={darkMode}
													on:click={() => (darkMode = !darkMode)}
													data-param="theme"
												>
													{darkMode ? 'dark' : 'light'}
												</button>
												<!-- Add the re-run button with active styling instead of opacity-50 -->
												<button
													class="ml-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded hover:bg-blue-500 active:bg-blue-700"
													id="tm-blaze-rerun"
													data-param="rerun"
												>
													re-run
												</button>
											{/if}
										</div>
									</label>
									{#if !isBlazeMode(visualizationMode)}
										<label class="flex flex-col">
											tape width
											<input
												class="w-[70px] text-black"
												type="number"
												bind:value={tapeWidth}
												on:change={() => {
													const url = new URL(window.location.href);
													window.history.pushState({}, '', getSimulationLink());
												}}
											/>
										</label>
										<label class="flex flex-col">
											x-translation
											<input
												class="w-[70px] text-black"
												type="number"
												bind:value={origin_x}
												on:change={() => {
													const url = new URL(window.location.href);
													window.history.pushState({}, '', getSimulationLink());
												}}
												min="0"
												max="1"
												step="0.1"
											/>
										</label>
									{/if}
								</div>
								{#if !isBlazeMode(visualizationMode)}
									<label class="text-sm mt-2 flex flex-col space-y-1 cursor-pointer">
										<div>initial tape content</div>
										<input bind:value={initial_tape} class="text-black" />
									</label>
								{/if}
							</div>
						{/if}
						{#if isDefaultMode(visualizationMode)}
							<label class="text-sm mt-2 flex items-center space-x-2 cursor-pointer">
								<input type="checkbox" bind:checked={showHeadMove} />
								<div>Show head movement (green for L, red for R)</div>
							</label>
						{/if}
						<div class="text-sm mt-2 flex items-center">
							<span class="mr-2">Visualization:</span>
							<div class="flex items-center border rounded-md">
								<label
									class="px-2 py-1 cursor-pointer"
									class:bg-blue-600={isDefaultMode(visualizationMode)}
									class:text-white={isDefaultMode(visualizationMode)}
								>
									<input
										type="radio"
										class="hidden"
										bind:group={visualizationMode}
										value={VisualizationMode.DEFAULT}
									/>
									Default
								</label>
								<div class="h-4 border-l border-gray-300"></div>
								<label
									class="px-2 py-1 cursor-pointer"
									class:bg-blue-600={isExploreMode(visualizationMode)}
									class:text-white={isExploreMode(visualizationMode)}
								>
									<input
										type="radio"
										class="hidden"
										bind:group={visualizationMode}
										value={VisualizationMode.EXPLORE}
									/>
									Explore
								</label>
								<div class="h-4 border-l border-gray-300"></div>
								<label
									class="px-2 py-1 cursor-pointer"
									class:bg-blue-600={isBlazeMode(visualizationMode)}
									class:text-white={isBlazeMode(visualizationMode)}
									class:opacity-50={!showBlazeOption(machine)}
									class:cursor-not-allowed={!showBlazeOption(machine)}
								>
									<input
										type="radio"
										class="hidden"
										bind:group={visualizationMode}
										value={VisualizationMode.BLAZE}
										disabled={!showBlazeOption(machine)}
									/>
									Blaze
								</label>
							</div>
						</div>
					</div>
				</div>

				<div
					class={isDefaultMode(visualizationMode)
						? 'mt-3 md:mt-0 md:ml-10 lg:ml-20 '
						: 'flex w-full space-x-36 mb-5 mt-3'}
				>
					<div>
						{#if machine !== null}
							{#if machineID !== null}
								<div
									class="text-lg cursor-pointer"
									on:click={async () => {
										await loadMachineFromID(machineID);
									}}
								>
									Machine #<span class="underline">{numberWithCommas(machineID)}</span>
								</div>
							{:else}
								<div
									class="text-lg cursor-pointer"
									on:click={async () => {
										await loadMachineFromMachineCode(tmToMachineCode(machine), machineStatus);
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
							<div class:invisible={curr_challenge != Challenge.BB5}>
								Random machine from the <a
									href="https://bbchallenge.org/method#seed-database"
									class="text-blue-400 hover:text-blue-300 cursor-pointer underline"
									rel="external">seed database</a
								>
							</div>

							<!-- {#if !preSeed} -->
							<div class="flex flex-col items-end mx-3">
								<button
									class="bg-blue-500 p-1 mt-1 w-full ml-2"
									on:click={async () => {
										await getRandomMachine();
										//window.history.replaceState({}, '', getSimulationLink());
									}}>Go (R)andom</button
								>
								{#if curr_challenge == Challenge.BB5}
									<div
										class="text-xs text-right text-blue-400 hover:text-blue-300 cursor-pointer"
										on:click={() => {
											showRandomOptions = !showRandomOptions;
										}}
									>
										{#if !showRandomOptions}More{:else}Less{/if} options
									</div>
								{/if}
							</div>
							<!-- {:else}
							<button
								class="bg-blue-500 p-1 mx-3 mt-1"
								on:click={async () => {
									_goto('/');
								}}>Go Random</button>
							>
						{/if} -->
						</div>
						{#if showRandomOptions}
							<div class="mx-3">
								<label class="flex space-x-2 items-center cursor-pointer">
									<input type="radio" bind:group={randomType} name="randomType" value="all" />
									<div>any machine (88,664,064)</div>
								</label>
								<label class="flex space-x-2 items-center cursor-pointer">
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
									class="mt-2 flex space-x-2 items-center  cursor-pointer w-[300px]"
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
						{#if curr_challenge == Challenge.BB5}
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
								<div class="ml-5 flex items-center space-x-4">
									<input
										type="number"
										class="w-[200px] text-black"
										placeholder="max 88664063"
										min="0"
										max="88664063"
										bind:value={typedMachineID}
										on:change={async () => {
											await loadMachineFromID(typedMachineID);
										}}
									/>
									<button class="bg-blue-500 p-1 px-2">Go</button>
								</div>
							</div>
						{/if}
						<div class="ml-3 mt-1 text-sm">
							<div>
								From <a
									href="https://discuss.bbchallenge.org/t/standard-tm-text-format/60"
									class="text-blue-400 hover:text-blue-300 cursor-pointer">standard format</a
								>:
							</div>
							{#if machineCodeError}
								<div class="text-red-400 text-xs break-words w-[300px]">{machineCodeError}</div>
							{/if}
							<div class="ml-5 flex items-center space-x-4">
								<input
									type="text"
									class="w-[200px] text-black"
									placeholder=""
									bind:value={typedMachineCode}
								/>
								<button
									class="bg-blue-500 p-1 px-2"
									on:click={() => {
										loadMachineFromMachineCode(typedMachineCode);
									}}
									>Go
								</button>
							</div>
						</div>
						<!-- <div>
							{#if history}
								<div class="mt-0 flex flex-col">
									<div class="ml-3 mt-2 text-sm">
										<div
											class="text-blue-400 hover:text-blue-300 cursor-pointer underline"
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
						</div> -->
					</div>
				</div>
			</div>
			<div class="mt-5 mb-10 flex flex-col space-y-8">
				<div class="flex flex-col space-y-5 md:flex-row md:space-x-12 lg:space-y-0">
					<div class="flex flex-col space-y-4">
						<News />
						{#if curr_challenge == Challenge.BB5}
							<DecidersAndZoology
								on:machine_id={async (ev) => {
									let machine_id = ev.detail.machine_id;

									await loadMachineFromID(machine_id);
									defaultSimulationParameters();
								}}
							/>
						{/if}
					</div>

					<div class="max-w-[450px] flex flex-col space-y-2">
						<div class="text-xl">Highlighted machines</div>
						{#if curr_challenge == Challenge.BB5}
							<Highlights_BB5
								on:machine_id={async (ev) => {
									let machine_id = ev.detail.machine_id;

									await loadMachineFromID(machine_id);
									defaultSimulationParameters();
								}}
								on:machine_code={async (ev) => {
									let machine_code = ev.detail.machine_code;
									let machine_status = ev.detail.machine_status;

									await loadMachineFromMachineCode(machine_code, machine_status);
									defaultSimulationParameters();
								}}
							/>
						{/if}
						{#if curr_challenge == Challenge.BB6}
							<Highlights_BB6
								on:machine_id={async (ev) => {
									let machine_id = ev.detail.machine_id;

									await loadMachineFromID(machine_id);
									defaultSimulationParameters();
								}}
								on:machine_code={async (ev) => {
									let machine_code = ev.detail.machine_code;
									let machine_status = ev.detail.machine_status;

									await loadMachineFromMachineCode(machine_code, machine_status);
									defaultSimulationParameters();
								}}
							/>
						{/if}
						{#if curr_challenge == Challenge.BB2x5}
							<Highlights_BB2x5
								on:machine_id={async (ev) => {
									let machine_id = ev.detail.machine_id;

									await loadMachineFromID(machine_id);
									defaultSimulationParameters();
								}}
								on:machine_code={async (ev) => {
									let machine_code = ev.detail.machine_code;
									let machine_status = ev.detail.machine_status;

									await loadMachineFromMachineCode(machine_code, machine_status);
									defaultSimulationParameters();
								}}
							/>
						{/if}
						{#if curr_challenge == Challenge.BB3x3}
							<Highlights_BB3x3
								on:machine_id={async (ev) => {
									let machine_id = ev.detail.machine_id;

									await loadMachineFromID(machine_id);
									defaultSimulationParameters();
								}}
								on:machine_code={async (ev) => {
									let machine_code = ev.detail.machine_code;
									let machine_status = ev.detail.machine_status;

									await loadMachineFromMachineCode(machine_code, machine_status);
									defaultSimulationParameters();
								}}
							/>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
