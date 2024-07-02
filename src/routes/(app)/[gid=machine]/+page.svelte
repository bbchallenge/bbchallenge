<script lang="ts">
	import { onMount } from 'svelte';
	import MainPage from '../+page.svelte';
	import { page } from '$app/stores';
	import { TMDecisionStatus } from '$lib/tm';

	// Machine ID or machine b64
	let generalisedID = $page.params.gid;

	let machineID = null;
	let machineCode = null;

	if (generalisedID.length > 0 && (generalisedID[1] == 'R' || generalisedID[1] == 'L')) {
		machineCode = generalisedID;
		machineID = null;
	} else {
		machineID = generalisedID;
		machineCode = null;
	}

	let nbIter;
	let tapeWidth;
	let origin_x;
	let machineStatus;

	onMount(() => {
		let urlParams = $page.url.searchParams;
		nbIter = numberFromUrlParam(urlParams, 's');
		tapeWidth = numberFromUrlParam(urlParams, 'w');
		origin_x = numberFromUrlParam(urlParams, 'ox');
		machineStatus = machineStatusFromUrlParam(urlParams);
	});

	function numberFromUrlParam(urlParams: URLSearchParams, name: string): number | undefined {
		const value = urlParams.get(name);
		return value !== null ? Number(value) : undefined;
	}

	function machineStatusFromUrlParam(urlParams: URLSearchParams): TMDecisionStatus {
		const statusUrlParam = urlParams.get('status');
		switch (statusUrlParam) {
			case TMDecisionStatus.DECIDED_HALT:
			case TMDecisionStatus.DECIDED_NON_HALT:
				return statusUrlParam;
			default:
				return TMDecisionStatus.UNDECIDED;
		}
	}
</script>

<svelte:head>
	<meta property="og:title" content="The Busy Beaver Challenge" />
	<meta property="og:site_name" content="bbchallenge" />
	<meta property="og:url" content="https://bbchallenge.org" />
	<meta
		property="og:description"
		content={`Space-time diagram of bbchallenge machine ${$page.url.pathname.replace('/', '')}`}
	/>
	<meta property="og:type" content="" />
	<meta property="og:image" content={`https://bbchallenge.org/thumbnail${$page.url.pathname}`} />
</svelte:head>

{#if machineID != null}
	<MainPage preSeed={true} {machineID} {nbIter} {tapeWidth} {origin_x} {machineStatus} />
{:else}
	<MainPage preSeed={true} {machineCode} {nbIter} {tapeWidth} {origin_x} {machineStatus} />
{/if}
