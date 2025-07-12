<script lang="ts">
	import { numberWithCommas } from '$lib/utils';
	import Katex from './Katex.svelte';
	import HighlightedMachine from './highlighted_machine.svelte';
	import {
		BB5_23M_steps_halter,
		BB5_2M_steps_halter,
		BB5_champion,
		BB6_mxdys_champion_2025,
		BB7_Wythagoras_champion,
		Skelet_machines,
		Marxen_and_Buntrock_chaotic_id,
		Marxen_and_Buntrock_complex_counter_id,
		Justin_inverted_counter,
		Justin_helix,
		Justin_pointy_wide
	} from './machine_repertoire';
	import { TMDecisionStatus } from './tm';

	// Cannot inline { .. } because of svelte
	let ApproxBB72 = '\\simeq 10\\uparrow\\uparrow 5';
	let ApproxBB6 = '> 2\\uparrow\\uparrow\\uparrow 5';

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	const highlighted_undecided_machines = [7410754, 2977651, 9005190, 43374927, 14263231, 36909813];
</script>

<div class="ml-2">
	<div class="text-sm ml-2">Interesting machines:</div>
	<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
		<HighlightedMachine
			ref_link="https://bbchallenge.org"
			ref_authors="bbchallenge"
			ref_year="2023"
		>
			<span
				class="cursor-pointer"
				on:click={() => {
					dispatch('machine_id', { machine_id: Justin_inverted_counter });
				}}>&middot;&nbsp;"<span class="underline">inverted counter</span>"</span
			>
		</HighlightedMachine>
		<HighlightedMachine
			ref_link="https://bbchallenge.org"
			ref_authors="bbchallenge"
			ref_year="2023"
		>
			<span
				class="cursor-pointer"
				on:click={() => {
					dispatch('machine_id', { machine_id: Justin_helix });
				}}>&middot;&nbsp;"<span class="underline">helix</span>"</span
			>
		</HighlightedMachine>
		<HighlightedMachine
			ref_link="https://bbchallenge.org"
			ref_authors="bbchallenge"
			ref_year="2023"
		>
			<span
				class="cursor-pointer"
				on:click={() => {
					dispatch('machine_id', { machine_id: Justin_pointy_wide });
				}}>&middot;&nbsp;"<span class="underline">pointy wide</span>"</span
			>
		</HighlightedMachine>
		<HighlightedMachine
			ref_link="http://turbotm.de/~heiner/BB/mabu90.html"
			ref_authors="Marxen & Buntrock"
			ref_year="1990"
		>
			<span
				class="cursor-pointer"
				on:click={() => {
					dispatch('machine_id', { machine_id: Marxen_and_Buntrock_chaotic_id });
				}}>&middot;&nbsp;"<span class="underline">chaotic</span>"</span
			>
		</HighlightedMachine>
		<HighlightedMachine
			on:machine_id
			ref_link="http://turbotm.de/~heiner/BB/mabu90.html"
			ref_authors="Marxen & Buntrock"
			ref_year="1990"
		>
			<span
				class="cursor-pointer"
				on:click={() => {
					dispatch('machine_id', { machine_id: Marxen_and_Buntrock_complex_counter_id });
				}}>&middot;&nbsp;"<span class="underline">complex counter</span>"</span
			></HighlightedMachine
		>
		{#each highlighted_undecided_machines as m_id}
			<HighlightedMachine on:machine_id machine_id={m_id}>&middot;&nbsp;Machine</HighlightedMachine>
		{/each}
	</div>
</div>
<div class="ml-2">
	<div class="text-sm w-[400px] ml-2">BB champions and other halting machines:</div>
	<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
		<HighlightedMachine
			on:machine_code
			machine_code={BB5_2M_steps_halter}
			machine_status={TMDecisionStatus.DECIDED_HALT}
			ref_link="http://bbchallenge.org"
			ref_authors="bbchallenge"
			ref_year="2021">&middot;&nbsp;2,133,492-halter</HighlightedMachine
		>

		<HighlightedMachine
			on:machine_code
			machine_code={BB5_23M_steps_halter}
			machine_status={TMDecisionStatus.DECIDED_HALT}
			ref_link="http://bbchallenge.org"
			ref_authors="bbchallenge"
			ref_year="2021">&middot;&nbsp;23,554,764-halter</HighlightedMachine
		>

		<HighlightedMachine
			on:machine_code
			machine_code={BB5_champion}
			machine_status={TMDecisionStatus.DECIDED_HALT}
			ref_link="http://turbotm.de/~heiner/BB/mabu90.html"
			ref_authors="Marxen & Buntrock"
			ref_year="1990">&middot;&nbsp;BB(5): 47,176,870-halter</HighlightedMachine
		>
		<HighlightedMachine
			on:machine_code
			machine_code={BB6_mxdys_champion_2025}
			machine_status={TMDecisionStatus.DECIDED_HALT}
			ref_link="https://wiki.bbchallenge.org/wiki/1RB1RA_1RC1RZ_1LD0RF_1RA0LE_0LD1RC_1RA0RE"
			ref_authors="mxdys"
			ref_year="2025">&middot;&nbsp;BB(6): <Katex math={ApproxBB6} />-halter</HighlightedMachine
		>
		<!-- <HighlightedMachine
				on:machine_code
				machine_code={BB7_Wythagoras_champion}
				machine_status={TMDecisionStatus.DECIDED_HALT}
				ref_link="https://googology.fandom.com/wiki/User_blog:Wythagoras/A_good_bound_for_S(7)%3F"
				ref_authors="Wythagoras"
				ref_year="2014">&middot;&nbsp;BB(7): <Katex math={ApproxBB72} />-halter</HighlightedMachine
			> -->
	</div>
</div>
<div class="ml-2">
	<div class="text-sm w-[400px] ml-2 mt-1">
		Some <a href="/story#skelets-43-undecided-machines" rel="external" class="underline"
			>Skelet's machines</a
		>:
	</div>
	<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
		{#each [0, 16] as i}
			<HighlightedMachine
				machine_status={TMDecisionStatus.DECIDED_NON_HALT}
				on:machine_code
				machine_code={Skelet_machines[i].bbchallenge_code}
			>
				&middot;&nbsp;Skelet's machine {i + 1}

				<span
					class="text-xs"
					on:click={() => {
						dispatch('machine_id', {
							machine_id: Skelet_machines[i].bbchallenge_id
						});
					}}
				>
					≈ Machine <span class="cursor-pointer underline"
						>#{numberWithCommas(Skelet_machines[i].bbchallenge_id)}</span
					>
				</span></HighlightedMachine
			>
		{/each}
	</div>

	<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
		<a class="cursor-pointer leading-tight" href="/skelet" rel="external">
			&middot;&nbsp;<span class="underline">full list</span>
		</a>
	</div>
</div>
