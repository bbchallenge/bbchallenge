<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { TMDecisionStatus } from './tm';

	export let machine_code = null;
	export let machine_status: TMDecisionStatus = TMDecisionStatus.UNDECIDED;
	export let ref_link = null;
	export let ref_authors = null;
	export let ref_year = null;

	const dispatch = createEventDispatcher();
</script>

<div
	class="cursor-pointer select-none leading-tight"
	on:click={() => {
		dispatch('machine_code', {
			machine_code: machine_code,
			machine_status: machine_status
		});
	}}
>
	<slot />

	{#if ref_link && ref_authors && ref_year}
		<span class="text-xs">
			<a target="_blank" href={ref_link}>[{ref_authors}, {ref_year}]</a>
		</span>
	{/if}
</div>
