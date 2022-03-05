<script lang="ts">
	// import type { TM } from './tm';
	import { TMDecisionStatus } from './tm';

	import { numberWithCommas } from './utils';

	function encodedTransitionToString(transition) {
		if (transition[2] == 0) {
			return '???';
		}

		let toReturn = '';

		if (transition[0] > 1) throw 'Invalid machine description [write symbol]';
		toReturn += String.fromCharCode(48 + transition[0]);

		if (transition[1] == 0) {
			toReturn += 'R';
		} else if (transition[1] == 1) {
			toReturn += 'L';
		} else {
			throw 'Invalid machine description [move symbol]';
		}

		toReturn += String.fromCharCode(65 + (transition[2] - 1));

		return toReturn;
	}

	// export let machine: TM; //
	// export let machineID: number | null = null;
	// export let decisionStatus: TMDecisionStatus | null = null;
	export let machine; //
	export let machineID = null;
	export let decisionStatus = null;
</script>

<header class="flex flex-col">
	{#if machineID !== null}
		<div class="text-lg">
			Machine <a class="underline" href={'/machine/index/' + machineID}
				>#{numberWithCommas(machineID)}</a
			>
		</div>
	{/if}
	{#if decisionStatus !== null}
		{#if decisionStatus == TMDecisionStatus.UNDECIDED}
			<div>Status: <span class="text-orange-400 font-bold">Undecided</span></div>
		{:else if decisionStatus == TMDecisionStatus.HEURISTICALLY_DECIDED_HALT}
			<div>Status: <span class="text-purple-400 font-bold">Heuristically decided (Halt)</span></div>
		{:else if decisionStatus == TMDecisionStatus.HEURISTICALLY_DECIDED_NON_HALT}
			<div>
				Status: <span class="text-purple-400 font-bold">Heuristically decided (Non Halt)</span>
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
	<div>Description:</div>
	<table
		class="w-[200px] text-left"
		class:ml-3={machineID !== null}
		class:mt-1={machineID !== null}
	>
		<thead class="font-normal border-b-1">
			<th class="font-normal">state</th>
			<th class="font-normal">0</th>
			<th class="font-normal">1</th>
		</thead>
		<tbody>
			{#each [...Array(machine.length / 6).keys()] as i}
				<tr
					><td class="w-1/3">{String.fromCharCode(65 + i)}</td>
					<td class="w-1/3">{encodedTransitionToString(machine.slice(6 * i, 6 * i + 3))}</td>
					<td class="w-1/3">{encodedTransitionToString(machine.slice(6 * i + 3, 6 * i + 6))}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
