<script lang="ts">
	import { onMount } from 'svelte';
	import { API } from '$lib/api_server';

	import { machineCodeToTM, DB_SIZE, step } from '$lib/tm';

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
		tapeStr = confToStr(tape, headPos, currState);
		const currRead = tape[headPos] ?? 0;
		history = [];

		if (
			stateSymbolRecorder[currState] == undefined ||
			stateSymbolRecorder[currState][currRead] == undefined
		)
			return;

		for (const [time, state, head, historyTape] of stateSymbolRecorder[currState][currRead]) {
			/* Compute radius visited */
			let radiusVisitedLeft = 0;
			let radiusVisitedRight = 0;
			for (const pos in lastTimeVisited) {
				if (lastTimeVisited[pos] >= time) {
					radiusVisitedLeft = Math.max(radiusVisitedLeft, head - parseInt(pos));
					radiusVisitedRight = Math.max(radiusVisitedRight, parseInt(pos) - head);
				}
			}

			history.push([
				time,
				confToStr(historyTape, head, state, radiusVisitedLeft, radiusVisitedRight)
			]);
		}
	}

	function confToStr(
		tape,
		headPos,
		currState,
		radiusVisitedLeft = 0,
		radiusVisitedRight = 0
	): string {
		let to_ret = '';
		let do_underline = !(radiusVisitedLeft == 0 && radiusVisitedRight == 0);
		to_ret += String.fromCharCode(65 + currState) + ' ';
		for (let i = -20; i < 20; i += 1) {
			if (do_underline && i == headPos - radiusVisitedLeft) {
				to_ret += '<span class="underline">';
			}
			if (i == headPos) to_ret += '<span class="bg-green-600">';
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
</script>

<svelte:window on:keydown={keydown} />

<div class="p-4 flex space-x-10 items-center w-full">
	<div class="flex flex-col">
		<div>Machine {machineID}</div>
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

	<div class="flex flex-col items-start space-y-2 w-1/4">
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
				<div>- '<span class="bg-green-600">&nbsp;</span>': head position</div>
				<div>- '<span class="underline">&nbsp;</span>': cells seen between two steps</div>
			</div>
		</div>
	</div>
</div>
