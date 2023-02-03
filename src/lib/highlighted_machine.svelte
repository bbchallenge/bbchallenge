<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { numberWithCommas } from '$lib/utils';
	import { TMDecisionStatus } from './tm';

	export let machine_code = null;
	export let machine_id = null;
	export let machine_status: TMDecisionStatus = TMDecisionStatus.UNDECIDED;
	export let ref_link = null;
	export let ref_authors = null;
	export let ref_year = null;

	const dispatch = createEventDispatcher();
</script>

<div
	class="cursor-pointer  leading-tight"
	on:click={() => {
		if (machine_code !== null) {
			dispatch('machine_code', {
				machine_code: machine_code,
				machine_status: machine_status,
				
			});
		} else if (machine_id !== null) {
			dispatch('machine_id', {
				machine_id: machine_id
			});
		}
	}}
>
	<slot />
	{#if machine_id !== null}
		<span
			class="cursor-pointer  underline"
			on:click={() => {
				dispatch('machine_id', { machine_id: machine_id });
			}}
		>
			#{numberWithCommas(machine_id)}</span
		>
	{/if}

	{#if ref_link && ref_authors && ref_year}
		<span class="text-xs">
			<a target="_blank" href={ref_link}>[{ref_authors}, {ref_year}]</a>
		</span>
	{/if}
</div>
