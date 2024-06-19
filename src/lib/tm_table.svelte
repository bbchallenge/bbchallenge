<script lang="ts">
	import { onMount } from 'svelte';
	import { API } from '$lib/api_server';
	import { WIKI_API } from '$lib/api_wiki';
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

	let varIsThereWikiEntry = null;
	let redirectName = null;

	async function isThereWikiEntry(machine) {
		try {
			let response = await WIKI_API.get(
				'',
				{},
				{
					action: 'query',
					titles: tmToMachineCode(machine),
					format: 'json',
					formatversion: '2'
				},
				false
			);
			let data = response.data;
			varIsThereWikiEntry = !data.query.pages[0].hasOwnProperty('missing');
			if (varIsThereWikiEntry) {
				let response = await WIKI_API.get(
					'',
					{},
					{
						action: 'parse',
						page: tmToMachineCode(machine),
						format: 'json',
						redirects: '1'
					},
					false
				);
				let page_title = response.data.parse.title;

				if (page_title.replace(' ', '') === tmToMachineCode(machine).replace('_', '')) {
					redirectName = null;
				} else {
					redirectName = page_title;
				}
			} else {
				redirectName = null;
			}
		} catch (error) {
			console.log(error);
			return false;
		}
	}

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
						machineDecider = (await API.get(`/machine/${equivalentMachineID}/decider`, '')).data[
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
	$: isThereWikiEntry(machine);

	let error = null;
</script>

{#if varIsThereWikiEntry === true}
	<div class:mt-1={machineID !== null}>
		{#if !redirectName}
			<div>
				<em>
					<a
						href="https://wiki.bbchallenge.org/wiki/{tmToMachineCode(machine)}"
						target="_blank"
						class="text-blue-400 hover:text-blue-300 cursor-pointer">Wiki entry</a
					>
				</em>
			</div>
		{:else}
			<div>
				<em>Wiki entry:</em>
				<a
					href="https://wiki.bbchallenge.org/wiki/{tmToMachineCode(machine)}"
					target="_blank"
					class="text-blue-400 hover:text-blue-300 cursor-pointer">{redirectName}</a
				>
			</div>
		{/if}
	</div>
{/if}

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
				{#each [...Array(machine.symbols).keys()] as s}
					<th class="font-normal">{s}</th>
				{/each}
			</thead>
			<tbody>
				{#each [...Array(machine.states).keys()] as q}
					<tr
						><td class={`w-1/3 color-${q}`}>{String.fromCharCode(65 + q)}</td>

						{#each [...Array(machine.symbols).keys()] as s}
							{@const transition = machine.code.slice(
								3 * (machine.symbols * q + s),
								3 * (machine.symbols * q + s + 1)
							)}

							<td
								class="w-1/3"
								class:bg-magenta={currState !== null &&
									currRead !== null &&
									q == currState &&
									currRead == s}
							>
								{#if transition[2] == 0}
									---
								{:else}
									{String.fromCharCode(48 + transition[0])}{transition[1] == 0 ? 'R' : 'L'}<span
										class={`color-${transition[2] - 1}`}
										>{String.fromCharCode(65 + (transition[2] - 1))}</span
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

		{#if !varIsThereWikiEntry}
			<div class="text-xs mt-1">
				<a
					href=" https://wiki.bbchallenge.org/w/index.php?action=edit&title={tmToMachineCode(
						machine
					)}&preload=Template:NewMachinePage&preloadparams%5B%5D={tmToMachineCode(machine)}"
					target="_blank"
					class="text-blue-400 hover:text-blue-300 cursor-pointer">Create wiki entry</a
				>
			</div>
		{/if}
	{/if}
</div>
