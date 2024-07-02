<script lang="ts">
	import { numberWithCommas } from '$lib/utils';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	const deciders = [
		{ name: 'Cyclers', link: 'https://discuss.bbchallenge.org/t/decider-cyclers/' },
		{
			name: 'Translated Cyclers',
			link: 'https://discuss.bbchallenge.org/t/decider-translated-cyclers/'
		},
		{
			name: 'Backward Reasoning',
			link: 'https://discuss.bbchallenge.org/t/decider-backward-reasoning/'
		},
		{ name: 'Halting Segment', link: 'https://discuss.bbchallenge.org/t/decider-halting-segment' },
		{
			name: 'Finite Automata Reduction',
			link: 'https://discuss.bbchallenge.org/t/decider-finite-automata-reduction/'
		},
		{
			name: 'Bouncers',
			link: 'https://discuss.bbchallenge.org/t/decider-bouncers/126/25'
		},
		{
			name: 'Coq-BB5',
			link: 'https://github.com/ccz181078/Coq-BB5'
		}
	];

	const zoology = [
		{ name: 'Cyclers', decided: true, nb_decided: 11229238, examples: [279081, 4231819, 4239083] },
		{
			name: 'Translated cyclers',
			decided: true,
			nb_decided: 73860604,
			examples: [59645887, 15167997, 59090563, 63687188]
		},
		{ name: 'Bouncers', decided: true, examples: [80747967, 88427177, 5228688, 5608043] },
		{ name: 'Exponential counters', decided: false, examples: [11004366, 10936909, 3840180] },
		{ name: 'Bells', decided: false, examples: [8527536, 73261028, 63938734] },
		{ decided: false, examples: [4446642, 7410754, 43374927] }
	];
</script>

<div id="deciders">
	<div class="text-xl mb-1">Deciders</div>
	<div class="ml-2 text-sm max-w-sm">
		<a
			href="/method#deciders"
			class="text-blue-400 hover:text-blue-300 cursor-pointer"
			target="_blank"
		>
			Deciders</a
		>
		are programs that automatically decide whether machines halt or not.<br />Here are the
		<a
			href="https://discuss.bbchallenge.org/t/currently-applied-deciders/"
			class="text-blue-400 hover:text-blue-300 cursor-pointer"
			target="_blank">currently applied deciders</a
		>:
		<div class="ml-2">
			<div class="flex flex-col space-y-2 mt-2">
				{#each deciders as entry, i}
					<a href={entry['link']}>{i + 1}. <span class="underline">{entry['name']}</span></a>
				{/each}
			</div>
		</div>
	</div>
</div>

<div id="zoology">
	<div class="text-xl mb-1">Zoology</div>
	<div class="ml-2 text-sm">
		This zoology is <a
			href="https://discuss.bbchallenge.org/t/current-zoology/23"
			class="text-blue-400 hover:text-blue-300 cursor-pointer"
			target="_blank">collaborative</a
		>.
	</div>
	<div class="ml-2">
		<div class="flex flex-col space-y-2 mt-2">
			{#each zoology as entry, i}
				<div>
					{#if entry['name'] !== undefined}
						{i + 1}. {entry['name']}
					{:else}
						<div class="text-xs">Not classified yet:</div>
					{/if}

					<div class="ml-8 text-xs">
						e.g:
						{#each entry['examples'] as m_id}
							<span
								class="cursor-pointer underline"
								on:click={() => {
									dispatch('machine_id', { machine_id: m_id });
								}}
							>
								#{numberWithCommas(m_id)}</span
							>&nbsp;
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
