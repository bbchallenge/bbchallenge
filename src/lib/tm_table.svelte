<script lang="ts">
	// import type { TM } from './tm';
	import { TMDecisionStatus, tmTob64URLSafe, tmToTuringMachineDotIO } from './tm';

	function encodedTransitionToString(transition) {
		try {
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
		} catch (error) {
			return 'invalid';
		}
	}

	// export let machine: TM; //
	// export let machineID: number | null = null;
	// export let decisionStatus: TMDecisionStatus | null = null;
	export let machine; //
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
		<table class="w-[200px] text-left ml-3 font-mono">
			<thead class="font-normal border-b-1">
				<th class="font-normal" />
				<th class="font-normal">0</th>
				<th class="font-normal">1</th>
			</thead>
			<tbody>
				{#each [...Array(machine.length / 6).keys()] as i}
					<tr
						><td class={`w-1/3 color-${i}`}>{String.fromCharCode(65 + i)}</td>
						<td
							class="w-1/3"
							class:bg-magenta={currState !== null &&
								currRead !== null &&
								i == currState &&
								currRead == 0}>{encodedTransitionToString(machine.slice(6 * i, 6 * i + 3))}</td
						>
						<td
							class="w-1/3"
							class:bg-magenta={currState !== null &&
								currRead !== null &&
								i == currState &&
								currRead == 1}>{encodedTransitionToString(machine.slice(6 * i + 3, 6 * i + 6))}</td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
	{#if showTitle}
		{#if machineID}
			<div class="text-xs">
				<a
					class="text-blue-400 hover:text-blue-300 cursor-pointer "
					href="/story#machine-id"
					rel="external">id</a
				>: <span class="text-xs select-all">{machineID}</span>
			</div>
		{/if}
		<div class="text-xs">
			<a
				class="text-blue-400 hover:text-blue-300 cursor-pointer "
				href="/story#base-64"
				rel="external">b64</a
			>: <span class="text-xs select-all">{tmTob64URLSafe(machine)}</span>
		</div>
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
