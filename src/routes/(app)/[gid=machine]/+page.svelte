<script lang="ts">
	import MainPage from '../+page.svelte';
	import { page } from '$app/stores';
	import { TMDecisionStatus } from '$lib/tm';

	// Machine ID or machine b64
	let generalisedIDAndParams = $page.params.gid;

	let generalisedID = generalisedIDAndParams.split('&')[0];

	let machineID = null;
	let machineCode = null;

	if ((generalisedID.length > 0 && generalisedID[1] == 'R') || generalisedID[1] == 'L') {
		machineCode = generalisedID;
		machineID = null;
	} else {
		machineID = generalisedID;
		machineCode = null;
	}

	let urlParams = new URLSearchParams(generalisedIDAndParams);
	let sUrlParam = urlParams.get('s');
	let nbIter = sUrlParam ? Number(sUrlParam) : undefined;
	let wUrlParam = urlParams.get('w');
	let tapeWidth = wUrlParam ? Number(wUrlParam) : undefined;
	let oxUrlParam = urlParams.get('ox');
	let origin_x = oxUrlParam ? Number(oxUrlParam) : undefined;
	let machineStatus = machineStatusFromUrlParam(urlParams);

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
