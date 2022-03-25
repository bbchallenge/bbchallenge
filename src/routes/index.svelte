<script lang="ts">
	import { onMount } from 'svelte';
	import TmTable from '$lib/tm_table.svelte';
	import { API } from '$lib/api_server';
	import { addToHistory, getHistory, numberWithCommas } from '$lib/utils';
	import {
		TMDecisionStatus,
		tm_trace_to_image,
		b64URLSafetoTM,
		DB_SIZE,
		tmTob64URLSafe,
		APIDecisionStatusToTMDecisionStatus
	} from '$lib/tm';
	import SvelteSeo from 'svelte-seo';
	import Katex from '../lib/Katex.svelte';

	let machine = null;
	export let machineID = null;
	export let machineB64 = null;
	export let preSeed = false;
	export let machineStatus = null;
	let history = getHistory();
	let showHistory = false;
	let showSimulationParams = false;

	// Cannot inline { .. } because of svelte
	let ApproxBB72 = '\\simeq 10\\uparrow\\uparrow 5';
	let ApproxBB6 = '\\simeq 10^{36,534}';

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

	let randomType = 'all_undecided';

	async function getRandomMachine() {
		try {
			const response = await API.post('/machine/random', { type: randomType });

			machine = b64URLSafetoTM(response.data['machine']);
			machineID = response.data['machine_id'];

			addToHistory(machineID);
			history = getHistory();

			if (response.data['status'] !== undefined) {
				machineStatus = APIDecisionStatusToTMDecisionStatus(response.data['status']);
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
				machineStatus = APIDecisionStatusToTMDecisionStatus(response.data['status']);
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
	let apiDown = false;
	onMount(async () => {
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
		} else if (machineB64 != null) {
			await loadMachineFromB64(machineB64, machineStatus);
		}

		try {
			let response = await API.get(`/metrics`, {});
			metrics = response.data;
			response = await API.get(`/highlighted`, {});
			highlighted = response.data;
		} catch (error) {
			apiDown = true;
		}

		if (apiDown && machineB64 == null) {
			console.log('hey');
			await loadMachineFromB64(
				'mAQACAAAEAQEDAQECAQABAAECAAAFAQAEAAAAAQAB',
				TMDecisionStatus.UNDECIDED
			);
			origin_x = 0.65;
		}

		draw();
		//console.log(metrics);
	});

	function updateSimulationParameters(link) {
		if (!isNaN(link)) {
			origin_x = 0.5;
			nbIter = 10000;
			return;
		}

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
			<div class="flex  items-start flex-col md:flex-row mt-3">
				<div class="flex flex-col items-start">
					<div class="bg-black mr-5">
						<canvas bind:this={canvasEl} width={canvas.width} height={canvas.height} />
					</div>
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
						{#if canvasEl}
							<div
								class="text-blue-400 hover:text-blue-300 cursor-pointer select-none"
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
					<div class="mt-1 flex flex-col">
						{#if showSimulationParams}
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
							<label class="text-sm mt-2 flex items-center space-x-2 cursor-pointer select-none">
								<input type="checkbox" bind:checked={showHeadMove} on:change={draw} />
								<div>show head movement</div>
							</label>
						{/if}
						<!-- <label class="text-sm mt-1 flex items-center space-x-2 cursor-pointer select-none">
					<input type="checkbox" bind:checked={fitCanvas} on:change={draw} />
					<div>fit to canvas</div>
				</label> -->
					</div>
				</div>

				<div class="mt-3 md:mt-0 md:ml-10 lg:ml-20">
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
										await loadMachineFromB64(tmTob64URLSafe(machine), machineStatus);
										draw();
										window.history.replaceState({}, '', getSimulationLink());
									}}
								>
									Machine <div class="underline text-xs ml-2 mb-1">{tmTob64URLSafe(machine)}</div>
								</div>
							{/if}

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
			<div class="mt-5  mb-10 flex flex-col space-y-8 ">
				<div class=" flex flex-col space-y-5 md:flex-row md:space-x-12    lg:space-y-0">
					<div id="zoology">
						<div class="text-xl">Zoology</div>
						<div class="ml-3 text-sm">
							This zoology is <a
								href="https://discuss.bbchallenge.org"
								class="text-blue-400 hover:text-blue-300 cursor-pointer">collaborative</a
							>.
						</div>
						<div class="ml-3">
							<div class="flex flex-col space-y-2 mt-2">
								<div>
									1. Cyclers: <span class="text-green-400 font-bold">Decided</span>
									<span class="text-[0.6rem]">(11,229,238 machines)</span>
									<div class="ml-8 text-xs">
										e.g:
										{#each [279081, 4231819, 279081] as m}
											<span
												class="cursor-pointer select-none underline"
												on:click={async () => {
													await loadMachineFromID(m);
													updateSimulationParameters(m);
													draw();
													window.history.replaceState({}, '', `/${m}&s=10000&w=300&ox=0.5`);
												}}
											>
												#{numberWithCommas(m)}</span
											>&nbsp;
										{/each}
									</div>
								</div>
								<div>
									2. Translated Cyclers: <span class="text-green-400 font-bold">Decided</span>
									<span class="text-[0.6rem]">(73,859,286 machines)</span>
									<div class="ml-8 text-xs">
										e.g:
										{#each [59645887, 15167997, 59090563] as m}
											<span
												class="cursor-pointer select-none underline"
												on:click={async () => {
													await loadMachineFromID(m);
													updateSimulationParameters(m);
													draw();
													window.history.replaceState({}, '', `/${m}&s=10000&w=300&ox=0.5`);
												}}
											>
												#{numberWithCommas(m)}</span
											>&nbsp;
										{/each}
									</div>
								</div>
								<div>
									3. Unilateral Pongs: <span class="text-yellow-400 font-bold">WIP</span>
									<div class="ml-8 text-xs">
										e.g:
										{#each [6048289, 4175994, 9281450] as m}
											<span
												class="cursor-pointer select-none underline"
												on:click={async () => {
													await loadMachineFromID(m);
													updateSimulationParameters(m);
													draw();
													window.history.replaceState({}, '', `/${m}&s=10000&w=300&ox=0.5`);
												}}
											>
												#{numberWithCommas(m)}</span
											>&nbsp;
										{/each}
									</div>
								</div>
								<div>
									4. Bilateral Pongs: <span class="text-yellow-400 font-bold">WIP</span>
									<div class="ml-8 text-xs">
										e.g:
										{#each [12785688, 8929416, 76727755] as m}
											<span
												class="cursor-pointer select-none underline"
												on:click={async () => {
													await loadMachineFromID(m);
													updateSimulationParameters(m);
													draw();
													window.history.replaceState({}, '', `/${m}&s=10000&w=300&ox=0.5`);
												}}
											>
												#{numberWithCommas(m)}</span
											>&nbsp;
										{/each}
									</div>
								</div>
								<div>
									5. Translated Unilateral Pongs: <span class="text-yellow-400 font-bold">WIP</span>
									<div class="ml-8 text-xs">
										e.g:
										{#each [6164147, 31837821, 20076854] as m}
											<span
												class="cursor-pointer select-none underline"
												on:click={async () => {
													await loadMachineFromID(m);
													updateSimulationParameters(m);
													draw();
													window.history.replaceState({}, '', `/${m}&s=10000&w=300&ox=0.5`);
												}}
											>
												#{numberWithCommas(m)}</span
											>&nbsp;
										{/each}
									</div>
								</div>
								<div>
									6. Exponential counters: <span class="text-yellow-400 font-bold">WIP</span>
									<div class="ml-8 text-xs">
										e.g:
										{#each [14244805, 10936909, 3840180] as m}
											<span
												class="cursor-pointer select-none underline"
												on:click={async () => {
													await loadMachineFromID(m);
													updateSimulationParameters(m);
													draw();
													window.history.replaceState({}, '', `/${m}&s=10000&w=300&ox=0.5`);
												}}
											>
												#{numberWithCommas(m)}</span
											>&nbsp;
										{/each}
									</div>
								</div>
								<div>
									7. Bells: <span class="text-yellow-400 font-bold">WIP</span>
									<div class="ml-8 text-xs">
										e.g:
										{#each [73261028, 63938734, 8527536] as m}
											<span
												class="cursor-pointer select-none underline"
												on:click={async () => {
													await loadMachineFromID(m);
													updateSimulationParameters(m);
													draw();
													window.history.replaceState({}, '', `/${m}&s=10000&w=300&ox=0.5`);
												}}
											>
												#{numberWithCommas(m)}</span
											>&nbsp;
										{/each}
									</div>
								</div>
								<div class="text-xs">
									Not classified yet:
									<div class="ml-8 text-xs">
										e.g:
										{#each [6490892, 11018350, 9390305] as m}
											<span
												class="cursor-pointer select-none underline"
												on:click={async () => {
													await loadMachineFromID(m);
													updateSimulationParameters(m);
													draw();
													window.history.replaceState({}, '', `/${m}&s=10000&w=300&ox=0.5`);
												}}
											>
												#{numberWithCommas(m)}</span
											>&nbsp;
										{/each}
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="max-w-[450px] flex flex-col space-y-2">
						<div>
							<div class="text-xl">Highlighted machines</div>
							{#if highlighted != null && highlighted['highlighted_undecided'] != null}
								<div class="text-sm w-[400px] mt-1 ml-2">Scary undecided machines:</div>
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
						<div class="">
							<div class="text-sm w-[400px] ml-2">BB champions and other halting machines:</div>
							<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
								<div
									class="cursor-pointer select-none leading-tight"
									on:click={async () => {
										await loadMachineFromB64(
											'mAQACAQEDAQADAQACAQAEAAEFAQEBAQEEAQAAAAEB',
											TMDecisionStatus.DECIDED_HALT
										);
										updateSimulationParameters(
											'/mAQACAQEDAQADAQACAQAEAAEFAQEBAQEEAQAAAAEB&s=10000&w=250&ox=0.8&status=halt'
										);
										draw();
										window.history.replaceState(
											{},
											'',
											'mAQACAQEDAQADAQACAQAEAAEFAQEBAQEEAQAAAAEB'
										);
									}}
								>
									&middot;&nbsp;BB(5): 47,176,870-halter

									<span class=" text-xs">
										<a href="http://turbotm.de/~heiner/BB/mabu90.html " target="_blank"
											>[Marxen & Buntrock, 1990]</a
										>
									</span>
								</div>
								<div
									class="cursor-pointer select-none leading-tight"
									on:click={async () => {
										await loadMachineFromB64(
											'mAQACAAEEAQADAAAGAQEDAQEBAAEFAAAAAQEBAAACAAADAAAF',
											TMDecisionStatus.DECIDED_HALT
										);
										updateSimulationParameters(
											'/mAQACAAEEAQADAAAGAQEDAQEBAAEFAAAAAQEBAAACAAADAAAF&s=20000&w=500&ox=0.3&status=halt'
										);
										draw();
										window.history.replaceState(
											{},
											'',
											'mAQACAAEEAQADAAAGAQEDAQEBAAEFAAAAAQEBAAACAAADAAAF'
										);
									}}
								>
									&middot;&nbsp;BB(6): <Katex math={ApproxBB6} />-halter

									<span class="text-xs">
										<a href="http://turbotm.de/~heiner/BB/bb-xlist.txt" target="_blank"
											>[Kropitz, 2010]</a
										>
									</span>
								</div>
								<div
									class="cursor-pointer select-none leading-tight"
									on:click={async () => {
										await loadMachineFromB64(
											'mAQEFAAAAAQADAQAGAQEEAAACAQAFAAEDAQEHAAAEAAAAAQADAQACAQEF',
											TMDecisionStatus.DECIDED_HALT
										);
										updateSimulationParameters(
											'/mAQEFAAAAAQADAQAGAQEEAAACAQAFAAEDAQEHAAAEAAAAAQADAQACAQEF&s=20000&w=400&ox=0.08&status=halt'
										);
										draw();
										window.history.replaceState(
											{},
											'',
											'mAQEFAAAAAQADAQAGAQEEAAACAQAFAAEDAQEHAAAEAAAAAQADAQACAQEF'
										);
									}}
								>
									&middot;&nbsp;BB(7): <Katex math={ApproxBB72} />-halter

									<span class="text-xs">
										<a
											target="_blank"
											href="https://googology.fandom.com/wiki/User_blog:Wythagoras/A_good_bound_for_S(7)%3F"
											>[Wythagoras, 2014]</a
										>
									</span>
								</div>
							</div>
							<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
								<div
									class="cursor-pointer select-none leading-tight"
									on:click={async () => {
										await loadMachineFromB64(
											'mAQACAAEEAQEDAQAEAQEBAQEDAAAAAQAFAQABAAAC',
											TMDecisionStatus.DECIDED_HALT
										);
										updateSimulationParameters(
											'/mAQACAAEEAQEDAQAEAQEBAQEDAAAAAQAFAQABAAAC&s=20000&ox=0.1&status=halt'
										);
										draw();
										window.history.replaceState(
											{},
											'',
											'mAQACAAEEAQEDAQAEAQEBAQEDAAAAAQAFAQABAAAC'
										);
									}}
								>
									&middot;&nbsp;23,554,764-halter
									<span class="text-xs">
										<a href="http://bbchallenge.org" target="_blank">[bbchallenge, 2021]</a>
									</span>
								</div>
							</div>
							<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
								<div
									class="cursor-pointer select-none leading-tight"
									on:click={async () => {
										await loadMachineFromB64(
											'mAQACAQEDAAEBAAEEAQEBAAAAAQECAQAFAAAEAAAC',
											TMDecisionStatus.DECIDED_HALT
										);
										updateSimulationParameters(
											'/mAQACAQEDAAEBAAEEAQEBAAAAAQECAQAFAAAEAAAC&s=20000&w=300&ox=0.98&status=halt'
										);
										draw();
										window.history.replaceState(
											{},
											'',
											'mAQACAQEDAAEBAAEEAQEBAAAAAQECAQAFAAAEAAAC'
										);
									}}
								>
									&middot;&nbsp;2,133,492-halter

									<span class="text-xs">
										<a href="http://bbchallenge.org" target="_blank">[bbchallenge, 2021]</a>
									</span>
								</div>
							</div>
						</div>
						<div class="">
							<div class="text-sm w-[400px] ml-2 mt-1">
								The first 3 <a
									href="/story#skelets-43-undecided-machines"
									rel="external"
									class="underline">Skelet's machines</a
								>:
							</div>
							<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
								<div>
									<span
										class="cursor-pointer select-none leading-tight"
										on:click={async () => {
											await loadMachineFromB64(
												'mAQEDAQEFAAAAAQEEAQAEAAEEAQEBAQAFAAECAAAD',
												TMDecisionStatus.DECIDED_HALT
											);
											updateSimulationParameters(
												'/mAQEDAQEFAAAAAQEEAQAEAAEEAQEBAQAFAAECAAAD&s=10000&ox=0.9'
											);
											draw();
											window.history.replaceState(
												{},
												'',
												'mAQEDAQEFAAAAAQEEAQAEAAEEAQEBAQAFAAECAAAD'
											);
										}}
									>
										&middot;&nbsp;Skelet's machine 1
									</span>
									<span class="text-xs"
										>≈ Machine <a href="/68329601" rel="external" class="underline"
											>#{numberWithCommas(68329601)}</a
										></span
									>
								</div>
								<div>
									<span
										class="cursor-pointer select-none leading-tight"
										on:click={async () => {
											await loadMachineFromB64(
												'mAQEDAAAFAAAAAAADAQAEAAEBAQABAQAEAQEBAAAC',
												TMDecisionStatus.DECIDED_HALT
											);
											updateSimulationParameters(
												'/mAQEDAAAFAAAAAAADAQAEAAEBAQABAQAEAQEBAAAC&s=20000&ox=0.1'
											);
											draw();
											window.history.replaceState(
												{},
												'',
												'mAQEDAAAFAAAAAAADAQAEAAEBAQABAQAEAQEBAAAC'
											);
										}}
									>
										&middot;&nbsp;Skelet's machine 2
									</span>
									<span class="text-xs"
										>≈ Machine <a href="/55767995" rel="external" class="underline"
											>#{numberWithCommas(55767995)}</a
										></span
									>
								</div>
								<div>
									<span
										class="cursor-pointer select-none leading-tight"
										on:click={async () => {
											await loadMachineFromB64(
												'mAQEDAAABAAAAAQEFAQAEAAECAQABAQADAAEDAQEE',
												TMDecisionStatus.DECIDED_HALT
											);
											updateSimulationParameters(
												'/mAQEDAAABAAAAAQEFAQAEAAECAQABAQADAAEDAQEE&s=20000'
											);
											draw();
											window.history.replaceState(
												{},
												'',
												'mAQEDAAABAAAAAQEFAQAEAAECAQABAQADAAEDAQEE'
											);
										}}
									>
										&middot;&nbsp;Skelet's machine 3
									</span>
									<span class="text-xs"
										>≈ Machine <a href="/5950405" rel="external" class="underline"
											>#{numberWithCommas(5950405)}</a
										></span
									>
								</div>
							</div>
							<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
								<a class="cursor-pointer select-none leading-tight" href="/skelet" rel="external">
									&middot;&nbsp;<span class="underline">full list</span>
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
