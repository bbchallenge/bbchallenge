<script lang="ts">
  export let value: string;
</script>

<svelte:head>
  {#if value}
    <title>{value} - bbchallenge</title>
  {:else}
    <title>bbchallenge</title>
  {/if}
</svelte:head>
