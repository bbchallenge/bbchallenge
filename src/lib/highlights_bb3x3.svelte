<script lang="ts">
	import { numberWithCommas } from '$lib/utils';
	import Katex from './Katex.svelte';
	import HighlightedMachine from './highlighted_machine.svelte';
	import { BB6_Kropitz_champion_2022 } from './machine_repertoire';
	import { TMDecisionStatus } from './tm';

	// Cannot inline { .. } because of svelte
	let ApproxBB3x3 = '\\simeq 119 \\times 10^{15}';

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	const highlighted_undecided_machines = [7410754, 2977651, 9005190, 43374927, 14263231, 36909813];
</script>

<div class="ml-2">
	<div class="text-sm w-[400px] ml-2">BB(3,3) champion:</div>
	<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
		<HighlightedMachine
			on:machine_code
			machine_code="1RB2LA1LC_0LA2RB1LB_1RZ1RA1RC"
			machine_status={TMDecisionStatus.DECIDED_HALT}
			ref_link="https://bbchallenge.org/~pascal.michel/beh#tm33h"
			ref_authors="Terry and Shawn Ligocki"
			ref_year="2007"><Katex math={ApproxBB3x3} />-halter</HighlightedMachine
		>
	</div>
</div>

<div class="ml-2">
	<div class="text-sm w-[400px] ml-2">
		3-state 3-symbol <a href="https://wiki.bbchallenge.org/wiki/Cryptids">Cryptids:</a>
	</div>
	<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
		<HighlightedMachine
			on:machine_code
			machine_code="1RB2RA1LC_2LC1RB2RB_---2LA1LA"
			ref_link="https://www.sligocki.com/2023/10/16/bb-3-3-is-hard.html"
			ref_authors="Shawn Ligocki"
			ref_year="2024">&middot;&nbsp;Bigfoot</HighlightedMachine
		>
	</div>
</div>
