<script lang="ts">
	import { numberWithCommas } from '$lib/utils';
	import Katex from './Katex.svelte';
	import HighlightedMachine from './highlighted_machine.svelte';
	import { TMDecisionStatus } from './tm';

	// Cannot inline { .. } because of svelte
	let ApproxBB2x5 = '\\simeq 10^{10^{10^{3314360}}}';

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	const highlighted_undecided_machines = [7410754, 2977651, 9005190, 43374927, 14263231, 36909813];
</script>

<div class="ml-2">
	<div class="text-sm w-[400px] ml-2">BB(2,5) champion:</div>
	<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
		<HighlightedMachine
			on:machine_code
			machine_code="1RB3LA4RB0RB2LA_1LB2LA3LA1RA1RZ"
			machine_status={TMDecisionStatus.DECIDED_HALT}
			ref_link="https://groups.google.com/g/busy-beaver-discuss/c/PGOBAz46K6I/m/af5sjd6MBAAJ"
			ref_authors="Daniel Yuan"
			ref_year="2024"><Katex math={ApproxBB2x5} />-halter</HighlightedMachine
		>
	</div>
</div>

<div class="ml-2">
	<div class="text-sm w-[400px] ml-2">
		2-state 5-symbol <a
			href="https://wiki.bbchallenge.org/wiki/Cryptids"
			class="text-blue-400 hover:text-blue-300 cursor-pointer">Cryptids</a
		>:
	</div>
	<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
		<HighlightedMachine
			on:machine_code
			machine_code="1RB3RB---3LA1RA_2LA3RA4LB0LB0LA"
			ref_link="https://www.sligocki.com/2024/05/10/bb-2-5-is-hard.html"
			ref_authors="Daniel Yuan"
			ref_year="2024">&middot;&nbsp;Hydra</HighlightedMachine
		>
		<HighlightedMachine
			on:machine_code
			machine_code="1RB3RB---3LA1RA_2LA3RA4LB0LB1LB"
			ref_link="https://www.sligocki.com/2024/05/10/bb-2-5-is-hard.html#a-bonus-cryptid"
			ref_authors="Daniel Yuan"
			ref_year="2024">&middot;&nbsp;Bonus Cryptid</HighlightedMachine
		>
	</div>
</div>
