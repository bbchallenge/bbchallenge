<script lang="ts">
	import { onMount } from 'svelte';
	import { API } from '$lib/api_server';

	import { machineCodeToTM, DB_SIZE, step } from '$lib/tm';
	import { numberWithCommas } from '$lib/utils';

	let machine = null;
	let machineID = 46001750;

	onMount(async () => {
		await loadMachineFromID(machineID);
		console.log(machine);
	});

	/* MODEL */

	let headPos = 0;
	let tape = {};
	let lastTimeVisited = {};
	let currState = 0;
	let currTime = 0;
	let stateSymbolRecorder = {};

	function recordConfiguration(currTime, currState, headPos, tape) {
		const currRead = tape[headPos] ?? 0;

		if (stateSymbolRecorder[currState] == undefined) {
			stateSymbolRecorder[currState] = {};
		}

		if (stateSymbolRecorder[currState][currRead] == undefined) {
			stateSymbolRecorder[currState][currRead] = [];
		}

		console.log(String.fromCharCode(65 + currState), currRead);

		stateSymbolRecorder[currState][currRead].push([currTime, currState, headPos, { ...tape }]);
	}

	function next() {
		[currState, headPos] = step(machine, currState, headPos, tape, true);
		currTime += 1;
		lastTimeVisited[headPos] = currTime;

		updateView();
		recordConfiguration(currTime, currState, headPos, tape);
	}

	/* VIEW */

	let tapeStr = confToStr(tape, headPos, currState);
	let history = [];

	function updateView() {
		const currRead = tape[headPos] ?? 0;
		history = [];

		let globalDoContraction = false;
		if (
			stateSymbolRecorder[currState] == undefined ||
			stateSymbolRecorder[currState][currRead] == undefined
		) {
			tapeStr = confToStr(tape, headPos, currState, 0, 0, globalDoContraction);
			return;
		}

		let theRadiusLeft = 0,
			theRadiusRight = 0;
		for (const [time, state, head, historyTape] of stateSymbolRecorder[currState][currRead]) {
			/* Compute radius visited */
			let radiusVisitedLeft = 0;
			let radiusVisitedRight = 0;
			for (const pos in lastTimeVisited) {
				if (lastTimeVisited[pos] >= time && lastTimeVisited[pos] < currTime) {
					radiusVisitedLeft = Math.max(radiusVisitedLeft, head - parseInt(pos));
					radiusVisitedRight = Math.max(radiusVisitedRight, parseInt(pos) - head);
				}
			}

			let doContraction = true;
			for (let offset = -1 * radiusVisitedLeft; offset <= radiusVisitedRight; offset += 1) {
				if (tape[headPos + offset] == undefined || historyTape[head + offset] == undefined) {
					doContraction = false;
					break;
				}

				if (tape[headPos + offset] != historyTape[head + offset]) {
					doContraction = false;
					break;
				}
			}
			globalDoContraction = globalDoContraction || doContraction;

			if (doContraction) {
				theRadiusLeft = radiusVisitedLeft;
				theRadiusRight = radiusVisitedRight;
			}

			history.push([
				time,
				confToStr(historyTape, head, state, radiusVisitedLeft, radiusVisitedRight, doContraction)
			]);
		}

		tapeStr = confToStr(
			tape,
			headPos,
			currState,
			theRadiusLeft,
			theRadiusRight,
			globalDoContraction
		);
	}

	function confToStr(
		tape,
		headPos,
		currState,
		radiusVisitedLeft = 0,
		radiusVisitedRight = 0,
		doContraction = false
	): string {
		let to_ret = '';
		let do_underline = !(radiusVisitedLeft == 0 && radiusVisitedRight == 0);
		to_ret += String.fromCharCode(65 + currState) + ' ';
		for (let i = -20; i < 20; i += 1) {
			if (do_underline && i == headPos - radiusVisitedLeft) {
				to_ret += '<span class="underline';
				if (doContraction) {
					to_ret += ' bg-green-500';
				}
				to_ret += '">';
			}
			if (i == headPos) to_ret += '<span class="border-2">';
			if (tape[i] == undefined) {
				to_ret += '#';
			} else if (tape[i] == 0) {
				to_ret += '0';
			} else {
				to_ret += '1';
			}
			if (i == headPos) to_ret += '</span>';
			if (do_underline && i == headPos + radiusVisitedRight) {
				to_ret += '</span>';
			}
		}
		return to_ret;
	}

	async function keydown(e) {
		switch (e.keyCode) {
			case 78:
				next();
				break;
		}
	}

	/* LOAD */
	/* This code is copy pasted from website's index. 
     TODO: factorise this + UI of changing machine for being re-usable. */
	async function loadMachineFromID(localMachineID) {
		if (localMachineID == null || localMachineID < 0 || localMachineID >= DB_SIZE) {
			return;
		}

		try {
			const response = await API.get(`/machine/${localMachineID}`, {});

			machine = machineCodeToTM(response.data['machine_code']);
			localMachineID = response.data['machine_id'];
			machineID = localMachineID;
			recordConfiguration(currTime, currState, headPos, tape);
			lastTimeVisited[headPos] = currTime;
			console.log(machine, machineID);
		} catch (error) {
			console.log(error);
		}
	}

	function loadMachineFromMachineCode(machine_code, status = null) {
		machine = null;
		machineID = null;

		try {
			machine = machineCodeToTM(machine_code);
		} catch (error) {}
	}

	/* INPUTS */
	let typedMachineID;
	let typedMachineCode;
</script>

<svelte:window on:keydown={keydown} />

<div class="p-4 flex space-x-10 items-start w-full">
	<div class="flex flex-col">
		<div>
			Machine #<a
				href="/{machineID}"
				rel="external"
				target="_blank"
				class="underline cursor-pointer"
			>
				{numberWithCommas(machineID)}</a
			> <span class="text-xs">(<span class="select-all">{machineID}</span>)</span>
		</div>
		<div>History for current state and symbol</div>
		{#if history.length > 0}
			{#each history as historyTapeTimeAndStr}
				<div>
					<div class="mt-2 -mb-4">t = {historyTapeTimeAndStr[0]}</div>
					<pre>
	{@html historyTapeTimeAndStr[1]}
				</pre>
				</div>
			{/each}
		{:else}
			<span class="p-2">No history.</span>
		{/if}
		<div class="border-white border-2 w-full" />

		<div>
			<div class="mt-2 -mb-4">
				t = {currTime}
			</div>
			<pre>
	{@html tapeStr}
  </pre>
		</div>
	</div>

	<div class="flex flex-col items-start space-y-2 ">
		<button
			class="bg-blue-500 p-2 mt-1 ml-2 rounded-sm"
			on:click={() => {
				next();
			}}>(N)ext</button
		>
		<div class="p-2">
			<strong>Legend:</strong>
			<div class="flex flex-col space-y-2">
				<div>- '#': unseen cell (hence 0)</div>
				<div>- '<span class="border-2">&nbsp;</span>': head position</div>
				<div>
					- '<span class="underline">&nbsp;</span>': cells seen between historic and current step<br
					/>
					(excluding current head)
				</div>
				<div>- '<span class="bg-green-500">&nbsp;</span>': contracting event possible</div>
			</div>
		</div>
		<div class="ml-3 mt-2 text-sm">
			<strong>Change Machine:</strong>
			<div>
				From id in the <a
					href="https://bbchallenge.org/method#seed-database"
					class="text-blue-400 hover:text-blue-300 cursor-pointer underline"
					rel="external">seed database</a
				>:
			</div>
			<!-- {#if typedMachineError}
				<div class="text-red-400 text-xs break-words w-[300px]">{typedMachineError}</div>
			{/if} -->
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
					}}
				/>
				<button class="bg-blue-500 p-1 px-2 ">Go </button>
			</div>
		</div>
		<div class="ml-3 mt-1 text-sm">
			<div>From compact machine code:</div>
			<!-- {#if machineCodeError}
				<div class="text-red-400 text-xs break-words w-[300px]">{machineCodeError}</div>
			{/if} -->
			<div class="ml-5 flex items-center  space-x-4 ">
				<input type="text" class="w-[200px]" placeholder="" bind:value={typedMachineCode} />
				<button
					class="bg-blue-500 p-1 px-2 "
					on:click={() => {
						loadMachineFromMachineCode(typedMachineCode);
					}}
					>Go
				</button>
			</div>
		</div>
	</div>
</div>
