<script lang="ts">
	import { numberWithCommas } from '$lib/utils';
	import Katex from './Katex.svelte';
	import HighlightedMachine from './highlighted_machine.svelte';
	import { BB6_Kropitz_champion_2022, BB6_mxdys_champion_2025_old, BB6_mxdys_champion_2025 } from './machine_repertoire';
	import { TMDecisionStatus } from './tm';

	// Cannot inline { .. } because of svelte
	let ApproxBB72 = '\\simeq 10\\uparrow\\uparrow 5';
	let ApproxBB6_2022 = '\\simeq 10\\uparrow\\uparrow 15';
	let ApproxBB6_2025_old = '\\simeq 10\\uparrow\\uparrow 11010000';
	let ApproxBB6 = '> 2\\uparrow\\uparrow\\uparrow 5';

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	const highlighted_undecided_machines = [7410754, 2977651, 9005190, 43374927, 14263231, 36909813];
</script>

<div class="ml-2">
	<div class="text-sm w-[400px] ml-2">BB(6) champion:</div>
	<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
		<HighlightedMachine
			on:machine_code
			machine_code={BB6_mxdys_champion_2025}
			machine_status={TMDecisionStatus.DECIDED_HALT}
			ref_link="https://wiki.bbchallenge.org/wiki/1RB1RA_1RC1RZ_1LD0RF_1RA0LE_0LD1RC_1RA0RE"
			ref_authors="mxdys"
			ref_year="2025">&middot;&nbsp;<Katex math={ApproxBB6} />-halter</HighlightedMachine
		>
	</div>
</div>

<div class="ml-2">
	<div class="text-sm w-[400px] ml-2">Other halting machines:</div>
	<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
		<HighlightedMachine
			on:machine_code
			machine_code={BB6_mxdys_champion_2025_old}
			machine_status={TMDecisionStatus.DECIDED_HALT}
			ref_link="https://wiki.bbchallenge.org/wiki/1RB1LC_1LA1RE_0RD0LA_1RZ1LB_1LD0RF_0RD1RB"
			ref_authors="mxdys"
			ref_year="2025">&middot;&nbsp;<Katex math={ApproxBB6_2025_old} />-halter</HighlightedMachine
		>
		<HighlightedMachine
			on:machine_code
			machine_code={BB6_Kropitz_champion_2022}
			machine_status={TMDecisionStatus.DECIDED_HALT}
			ref_link="https://www.sligocki.com/2022/06/21/bb-6-2-t15.html"
			ref_authors="Kropitz"
			ref_year="2022">&middot;&nbsp;<Katex math={ApproxBB6_2022} />-halter</HighlightedMachine
		>
	</div>
</div>

<div class="ml-2">
	<div class="text-sm w-[400px] ml-2">
		6-state 2-symbol <a
			href="https://wiki.bbchallenge.org/wiki/Cryptids"
			class="text-blue-400 hover:text-blue-300 cursor-pointer">Cryptids</a
		>:
	</div>
	<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
		<HighlightedMachine
			on:machine_code
			machine_code="1RB1RA_0LC1LE_1LD1LC_1LA0LB_1LF1RE_---0RA"
			ref_link="https://www.sligocki.com/2022/06/21/bb-6-2-t15.html"
			ref_authors="mxdys, Racheline"
			ref_year="2024">&middot;&nbsp;Antihydra</HighlightedMachine
		>
	</div>
</div>
