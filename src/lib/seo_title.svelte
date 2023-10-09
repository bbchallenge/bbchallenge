<script lang="ts">
	import { numberWithCommas } from '$lib/utils';
	export let value: string;
</script>

<svelte:head>
	{#if value}
		<!-- If value is a number, add commas -->
		{#if /^\d+$/.test(value)}
			<title>#{numberWithCommas(value)} - bbchallenge</title>
		{:else}
			<title>{value} - bbchallenge</title>
		{/if}
	{:else}
		<title>bbchallenge</title>
	{/if}
</svelte:head>
