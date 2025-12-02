<script lang="ts">
	import { Skelet_machines } from './machine_repertoire';
	import { numberWithCommas } from './utils';

	export let machineDecider: string;

	const INDEX_FILE_BASE_URL = 'http://docs.bbchallenge.org/bb5_decided_indexes/';

	let decidersMetadata = {
		'backward-reasoning-run-7edeea99bc2d-depth-50-minIndex-0-maxIndex-88664064': {
			name: 'Backward Reasoning',
			url: 'https://discuss.bbchallenge.org/t/decider-backward-reasoning/',
			date: 'October 9th 2022',
			params: ['Depth: 50'],
			total_decided: 2035598
		},
		'cyclers-run-11c0ef00e9c2-time-1000-space-500-minIndex-0-maxIndex-14322029': {
			name: 'Cyclers',
			url: 'https://discuss.bbchallenge.org/t/decider-cyclers/',
			date: 'January 28th 2022',
			params: ['Time limit: 1000', 'Space limit: 500', 'Min index: 0', 'Max index: 14,322,029'],
			total_decided: 11229238
		},
		'translated-cyclers-run-8f5b2539279a-time-1000-space-500-minIndex-14322029-maxIndex-88664064': {
			name: 'Translated Cyclers',
			url: 'https://discuss.bbchallenge.org/t/decider-translated-cyclers',
			date: 'January 29th 2022',
			params: [
				'Time limit: 1000',
				'Space limit: 500',
				'Min index: 14,322,029',
				'Max index: 88,664,064'
			],
			total_decided: 73857622
		},

		'translated-cyclers-run-725fd45b37eb-time-10000-space-5000-minIndex-14322029-maxIndex-88664064':
			{
				name: 'Translated Cyclers',
				url: 'https://discuss.bbchallenge.org/t/decider-translated-cyclers',
				date: 'March 5th 2022',
				params: [
					'Time limit: 10000',
					'Space limit: 5000',
					'Min index: 14,322,029',
					'Max index: 88,664,064'
				],
				total_decided: 1664
			},
		'translated-cyclers-run-85454189d410-time-10000-space-5000-minIndex-14322029-maxIndex-88664064':
			{
				name: 'Translated Cyclers',
				url: 'https://discuss.bbchallenge.org/t/decider-translated-cyclers',
				date: 'April 1st 2022',
				params: [
					'Time limit: 10000',
					'Space limit: 5000',
					'Min index: 14,322,029',
					'Max index: 88,664,064'
				],
				total_decided: 1318
			},
		'halting-segment-reproduction-run-2vlymsaql86b-max-distance-to-end-6': {
			name: 'Halting Segment',
			url: 'https://discuss.bbchallenge.org/t/decider-halting-segment',
			date: 'December 25th 2022',
			params: ['Max segment size: 13', 'Odd sizes only', 'Middle of segment'],
			total_decided: 1002808
		},
		'translated-cyclers-run-TonyG-time-4000000': {
			name: 'Translated Cyclers',
			url: 'http://discuss.bbchallenge.org/t/decider-translated-cyclers/34/2?u=cosmo',
			date: 'October 5th 2022',
			params: ['Time limit: 4,000,000'],
			total_decided: 15
		},
		'FAR-finite-automata-reduction-run-JEB-max-6-DFA-states': {
			name: 'Finite Automata Reduction',
			url: 'https://discuss.bbchallenge.org/t/decider-finite-automata-reduction/',
			date: 'April 9th 2022',
			params: ['Max DFA states: 6'],
			total_decided: 503169
		},
		'bouncers-run-225d25f379a-steps-250000-macro-steps-50000-formula-limit-20': {
			name: 'Bouncers',
			url: 'https://discuss.bbchallenge.org/t/decider-bouncers/126/25',
			date: 'May 2nd 2024',
			params: ['Steps: 250,000', 'Macro steps: 50,000', 'Formula tape limit: 20'],
			total_decided: 29799
		},
		'coq-BB5-run-solves-remaining-bbchallenge-holdouts': {
			name: 'Coq-BB5',
			url: 'https://github.com/ccz181078/Coq-BB5',
			params: [],
			total_decided: null,
			date: 'July 2nd 2024'
		}
	};

	let show_more = false;
</script>

{#if decidersMetadata[machineDecider]}
	<div>
		Decider: <a
			class="underline text-blue-400 hover:text-blue-300 cursor-pointer"
			target="_blank"
			href={decidersMetadata[machineDecider]['url']}>{decidersMetadata[machineDecider]['name']}</a
		>
		{#if !show_more}
			<span
				class="text-sm font-bold cursor-pointer"
				on:click={() => {
					show_more = true;
				}}>➕</span
			>
		{:else}
			<span
				class="text-sm font-bold cursor-pointer"
				on:click={() => {
					show_more = false;
				}}>➖</span
			>
		{/if}
	</div>
	{#if show_more}
		<ul class="ml-8 list-disc text-sm mb-2">
			<li>Date: {decidersMetadata[machineDecider]['date']}</li>
			<li>Parameters:</li>
			<ul class="ml-5 list-disc">
				{#each decidersMetadata[machineDecider]['params'] as param}
					<li>{param}</li>
				{/each}
			</ul>
			<li>
				Total decided:
				{#if decidersMetadata[machineDecider]['total_decided'] === null}
					All 5-state machines.
				{:else}
					{numberWithCommas(decidersMetadata[machineDecider]['total_decided'])}
				{/if}
			</li>
			{#if decidersMetadata[machineDecider]['total_decided'] !== null}
				<li>
					<a
						class="underline text-blue-400 hover:text-blue-300 cursor-pointer"
						target="_blank"
						href={INDEX_FILE_BASE_URL + machineDecider}>Download index file</a
					>
				</li>
			{/if}
		</ul>
	{/if}
{/if}
