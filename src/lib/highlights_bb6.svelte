<script lang="ts">
	import { numberWithCommas } from '$lib/utils';
	import Katex from './Katex.svelte';
	import HighlightedMachine from './highlighted_machine.svelte';
	import { BB6_Kropitz_champion_2022 } from './machine_repertoire';
	import { TMDecisionStatus } from './tm';

	// Cannot inline { .. } because of svelte
	let ApproxBB72 = '\\simeq 10\\uparrow\\uparrow 5';
	let ApproxBB6 = '\\simeq 10\\uparrow\\uparrow 15';

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	const highlighted_undecided_machines = [7410754, 2977651, 9005190, 43374927, 14263231, 36909813];
</script>

<div class="ml-2">
	<div class="text-sm w-[400px] ml-2">BB(6) champion:</div>
	<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
		<HighlightedMachine
			on:machine_code
			machine_code={BB6_Kropitz_champion_2022}
			machine_status={TMDecisionStatus.DECIDED_HALT}
			ref_link="https://www.sligocki.com/2022/06/21/bb-6-2-t15.html"
			ref_authors="Kropitz"
			ref_year="2022"><Katex math={ApproxBB6} />-halter</HighlightedMachine
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
			ref_authors="mxdys, Yto"
			ref_year="2024">&middot;&nbsp;Not named yet</HighlightedMachine
		>
	</div>
</div>
