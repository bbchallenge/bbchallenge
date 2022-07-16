<script lang="ts">
	import { numberWithCommas } from '$lib/utils';
	import Katex from '../lib/Katex.svelte';
	import HighlightedMachine from './highlighted_machine.svelte';
	import {
		BB5_23M_steps_halter,
		BB5_2M_steps_halter,
		BB5_champion,
		BB6_Kropitz_champion_2022,
		BB7_Wythagoras_champion,
		Skelet_machines,
		Marxen_and_Buntrock_chaotic_id,
		Marxen_and_Buntrock_complex_counter_id
	} from './machine_repertoire';
	import { TMDecisionStatus } from './tm';

	// Cannot inline { .. } because of svelte
	let ApproxBB72 = '\\simeq 10\\uparrow\\uparrow 5';
	let ApproxBB6 = '\\simeq 10\\uparrow\\uparrow 15';

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	const highlighted_undecided_machines = [7410754, 43374927, 36909813];
</script>

<div class="max-w-[450px] flex flex-col space-y-2">
	<div class="ml-2">
		<div class="text-xl mb-1">Highlighted machines</div>
		<div class="text-sm ml-2">Scary undecided machines:</div>
		<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
			{#each highlighted_undecided_machines as m_id}
				<HighlightedMachine on:machine_id machine_id={m_id}
					>&middot;&nbsp;Machine</HighlightedMachine
				>
			{/each}
			<HighlightedMachine
				ref_link="http://turbotm.de/~heiner/BB/mabu90.html"
				ref_authors="Marxen & Buntrock"
				ref_year="1990"
			>
				<span
					class="cursor-pointer select-none"
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
					class="cursor-pointer select-none"
					on:click={() => {
						dispatch('machine_id', { machine_id: Marxen_and_Buntrock_complex_counter_id });
					}}>&middot;&nbsp;"<span class="underline">complex counter</span>"</span
				></HighlightedMachine
			>
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
				machine_code={BB6_Kropitz_champion_2022}
				machine_status={TMDecisionStatus.DECIDED_HALT}
				ref_link="https://www.sligocki.com/2022/06/21/bb-6-2-t15.html"
				ref_authors="Kropitz"
				ref_year="2022">&middot;&nbsp;BB(6): <Katex math={ApproxBB6} />-halter</HighlightedMachine
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
			{#each Array(3) as _, i}
				<HighlightedMachine on:machine_code machine_code={Skelet_machines[i].bbchallenge_code}>
					&middot;&nbsp;Skelet's machine {i + 1}

					<span
						class="text-xs"
						on:click={() => {
							dispatch('machine_id', {
								machine_id: Skelet_machines[i].bbchallenge_id
							});
						}}
					>
						≈ Machine <span class="cursor-pointer select-none underline"
							>#{numberWithCommas(Skelet_machines[i].bbchallenge_id)}</span
						>
					</span></HighlightedMachine
				>
			{/each}
		</div>

		<div class="w-full flex flex-col space-y-2 ml-8 mt-2">
			<a class="cursor-pointer select-none leading-tight" href="/skelet" rel="external">
				&middot;&nbsp;<span class="underline">full list</span>
			</a>
		</div>
	</div>
</div>
