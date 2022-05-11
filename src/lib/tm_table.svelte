<script lang="ts">
	import { TMDecisionStatus, tmToMachineCode, tmToTuringMachineDotIO } from './tm';

	export let machine;
	export let machineID = null;
	export let decisionStatus = null;
	export let showTitle = true;

	export let currState = null;
	export let currRead = null;

	let error = null;
</script>

<header class="flex flex-col">
	{#if decisionStatus !== null}
		{#if decisionStatus == TMDecisionStatus.UNDECIDED}
			<div>Status: <span class="text-orange-400 font-bold">Undecided</span></div>
		{:else if decisionStatus == TMDecisionStatus.HEURISTICALLY_DECIDED_HALT}
			<div>
				Status: <span class="text-purple-400 font-bold text-sm"
					>Heuristically decided <span class="text-xs">(Halt)</span></span
				>
			</div>
		{:else if decisionStatus == TMDecisionStatus.HEURISTICALLY_DECIDED_NON_HALT}
			<div>
				Status: <span class="text-purple-400 font-bold text-sm"
					>Heuristically decided <span class="text-xs">(Non Halt)</span></span
				>
			</div>
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
					{@const transitions = [machine.slice(6 * i, 6 * i + 3),machine.slice(6 * i + 3, 6 * i + 6)]}
					

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
								{String.fromCharCode(48 + transitions[j][0])}{transitions[j][1] == 0 ? 'R' : 'L'}<span
									class={`color-${transitions[j][2] - 1}`}
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
	<div class="text-xs  mb-2">Compact: <span class="select-all">{tmToMachineCode(machine)}</span></div>
		{#if machineID}
			<div class="text-xs">
				<a
					class="text-blue-400 hover:text-blue-300 cursor-pointer "
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
				class="text-blue-400 hover:text-blue-300 cursor-pointer "
				>Copy code for https://turingmachine.io/</span
			>
		</div>
	{/if}
</div>
