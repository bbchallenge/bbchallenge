<script lang="ts">
	import { numberWithCommas } from '$lib/utils';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	const zoology = [
		{ name: 'Cyclers', decided: true, nb_decided: 11229238, examples: [279081, 4231819, 4239083] },
		{
			name: 'Translated cyclers',
			decided: true,
			nb_decided: 73860604,
			examples: [59645887, 15167997, 59090563, 63687188]
		},
		{ name: 'Unilateral bouncers', decided: false, examples: [6048289, 2664944, 9281450, 3833963] },
		{ name: 'Bilateral bouncers', decided: false, examples: [12785688, 8929416, 76727755] },
		{
			name: 'Translated unilateral bouncers',
			decided: false,
			examples: [37005720, 66117258, 20076854]
		},
		{ name: 'Exponential counters', decided: false, examples: [11004366, 10936909, 3840180] },
		{ name: 'Bells', decided: false, examples: [8527536, 73261028, 63938734] },
		{ decided: false, examples: [4446642, 7410754, 43374927] }
	];
</script>

<div id="zoology">
	<div class="text-xl mb-1">Zoology</div>
	<div class="ml-2 text-sm">
		This zoology is <a
			href="https://discuss.bbchallenge.org/t/current-zoology/23"
			class="text-blue-400 hover:text-blue-300 cursor-pointer">collaborative</a
		>.
	</div>
	<div class="ml-2">
		<div class="flex flex-col space-y-2 mt-2">
			{#each zoology as entry, i}
				<div>
					{#if entry['name'] !== undefined}
						{i + 1}. {entry['name']}
						{#if entry['decided']}
							<span class="text-green-400 font-bold">Decided</span>
							<span class="text-[0.6rem]">({numberWithCommas(entry['nb_decided'])} machines)</span>
						{:else}
							<span class="text-yellow-400 font-bold">WIP</span>
						{/if}
					{:else}
						<div class="text-xs">Not classified yet:</div>
					{/if}

					<div class="ml-8 text-xs">
						e.g:
						{#each entry['examples'] as m_id}
							<span
								class="cursor-pointer select-none underline"
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
