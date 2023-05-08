<script lang="ts">
	import { onMount } from 'svelte';
	import { API } from '$lib/api_server';
	import {
		TMDecisionStatus,
		tmToMachineCode,
		tmToTuringMachineDotIO,
		APIDecisionStatusToTMDecisionStatus
	} from './tm';
	import TmDecider from './tm_decider.svelte';
	import { numberWithCommas } from '$lib/utils';

	export let machine;
	export let machineID = null;
	export let decisionStatus = null;
	export let showTitle = true;
	export let machineDecider = null;

	export let currState = null;
	export let currRead = null;

	let equivalentMachineCode = null;
	let equivalentMachineID = null;

	async function getEquivalentMachine(machine, machineID) {
		if (machineID !== null) {
			return;
		}
		try {
			let response = await API.get(`/machine/equivalent/${tmToMachineCode(machine)}`, {});

			if (
				response.data['equivalent_machine_id'] !== undefined &&
				response.data['equivalent_machine_id'] !== null
			) {
				equivalentMachineCode = response.data['equivalent_machine_code'];
				equivalentMachineID = response.data['equivalent_machine_id'];

				if (response.data['status'] !== undefined) {
					decisionStatus = APIDecisionStatusToTMDecisionStatus(response.data['status']);
					if (
						decisionStatus == TMDecisionStatus.DECIDED_HALT ||
						decisionStatus == TMDecisionStatus.DECIDED_NON_HALT
					) {
						machineDecider = (await API.get(`/machine/${machineID}/decider`, '')).data[
							'decider_file'
						];
					}
				}
			}
		} catch (error) {
			console.log(error);
		}
	}

	$: getEquivalentMachine(machine, machineID);

	let error = null;
</script>

<header class="flex flex-col">
	{#if equivalentMachineID !== null}
		<div>
			{#if equivalentMachineCode === tmToMachineCode(machine)}
				Machine ID:
			{:else}
				Equivalent ID:
			{/if}
			<a
				class="text-blue-400 hover:text-blue-300 cursor-pointer"
				href="/{equivalentMachineID}"
				rel="external">#{numberWithCommas(equivalentMachineID)}</a
			>
		</div>
	{/if}

	{#if decisionStatus !== null}
		{#if decisionStatus == TMDecisionStatus.UNDECIDED}
			<div>Status: <span class="text-orange-400 font-bold">Undecided</span></div>
		{:else if decisionStatus == TMDecisionStatus.DECIDED_NON_HALT}
			<div>
				Status: <span class="text-green-400 font-bold">Decided (Non Halt)</span>
			</div>
		{:else if decisionStatus == TMDecisionStatus.DECIDED_HALT}
			<div>
				Status: <span class="text-green-400 font-bold">Decided (Halt)</span>
			</div>
		{/if}
	{/if}
	{#if machineDecider !== null && decisionStatus !== null && decisionStatus !== TMDecisionStatus.UNDECIDED}
		<TmDecider {machineDecider} />
	{/if}
</header>
<div class:mt-1={machineID !== null}>
	{#if showTitle}
		<div>Machine code:</div>
	{/if}

	{#if error != null}
		{error}
	{:else}
		<table class="w-[200px] text-left ml-3 font-mono mt-1 mb-1">
			<thead class="font-normal border-b-1">
				<th class="font-normal" />
				<th class="font-normal">0</th>
				<th class="font-normal">1</th>
			</thead>
			<tbody>
				{#each [...Array(machine.length / 6).keys()] as i}
					{@const transitions = [
						machine.slice(6 * i, 6 * i + 3),
						machine.slice(6 * i + 3, 6 * i + 6)
					]}

					<tr
						><td class={`w-1/3 color-${i}`}>{String.fromCharCode(65 + i)}</td>

						{#each [...Array(2).keys()] as j}
							<td
								class="w-1/3"
								class:bg-magenta={currState !== null &&
									currRead !== null &&
									i == currState &&
									currRead == j}
							>
								{#if transitions[j][2] == 0}
									---
								{:else}
									{String.fromCharCode(48 + transitions[j][0])}{transitions[j][1] == 0
										? 'R'
										: 'L'}<span class={`color-${transitions[j][2] - 1}`}
										>{String.fromCharCode(65 + (transitions[j][2] - 1))}</span
									>
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
	{#if showTitle}
		<div class="text-xs">
			<span class="select-all">Compact:</span>
			<span class="select-all">{tmToMachineCode(machine)}</span>
		</div>

		{#if equivalentMachineID !== null && equivalentMachineCode !== tmToMachineCode(machine)}
			<div class="text-xs">
				<span class="select-all">Equivalent machine:</span>
				<span class="select-all">{equivalentMachineCode}</span>
			</div>
		{/if}

		{#if equivalentMachineID !== null}
			<div class="text-xs">
				<span class="select-all"
					>{#if equivalentMachineCode == tmToMachineCode(machine)}
						Machine ID:
					{:else}
						Equivalent ID:
					{/if}</span
				>
				<span class="select-all">{equivalentMachineID}</span>
			</div>
		{/if}

		{#if machineID}
			<div class="text-xs mt-2">
				<a
					class="text-blue-400 hover:text-blue-300 cursor-pointer"
					href="/story#machine-id"
					rel="external">Database id</a
				>: <span class="text-sm select-all">{machineID}</span>
			</div>
		{/if}

		<div class="text-xs mt-1">
			<span
				href="https://turingmachine.io/"
				on:click|preventDefault={() => {
					navigator.clipboard.writeText(tmToTuringMachineDotIO(machine)).then(function () {
						window.open('https://turingmachine.io/', '_blank').focus();
					});
				}}
				target="_blank"
				class="text-blue-400 hover:text-blue-300 cursor-pointer"
				>Copy code for https://turingmachine.io/</span
			>
		</div>
	{/if}
</div>
