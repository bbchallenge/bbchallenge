<script lang="ts">

import { onMount } from 'svelte';
import { API } from '$lib/api_server';
import { numberWithCommas } from '$lib/utils';
import {
		TMDecisionStatus,
		APIDecisionStatusToTMDecisionStatus
	} from '$lib/tm';


import { Skelet_machines } from '$lib/machine_repertoire';

let skeletBBchallengeStatus = {};

onMount(async () => {
	try {
		for (let skeletMachine of Skelet_machines) {
			const response = await API.get(`/machine/${skeletMachine.bbchallenge_id}`, {});
			if (response.data['status'] !== undefined)
				skeletBBchallengeStatus[skeletMachine.bbchallenge_id] = APIDecisionStatusToTMDecisionStatus(
					response.data['status']
				);
		}
	} catch (error) {
		console.log(error);
	}
});
</script>
<div class="dark w-full ">
<div class="prose prose-invert text-white -mt-4  xl:justify-start lg:ml-[170px] ml-0 sm:ml-4 font-sans prose-base sm:prose-lg w-full">
<div class="leading-normal ">
<div>

<!-- This is needed as a hack when no table of contents is used because of :global(.prose h2:first-child) in __layout.svelte -->

##

## Skelet's 43 machines

Here are <a href="https://skelet.ludost.net/bb/nreg.html" rel="external">Skelet's 43 undecided machines</a> and their equivalent machines in the <a href="/method#seed-database" rel="external">seed database</a> of The Busy Beaver Challenge. <a href="/story#skelets-43-undecided-machines" rel="external">More info about Skelet's machines</a>.

Some of these 43 machines are claimed to have been decided (way before The Busy Beaver Challenge existed) and only 21 appear to be currently still undecided, see <a href="https://github.com/danbriggs/Turing">Dan Briggs' github</a>.

In order to find the equivalent machines to Skelet's in our database the following transformations are applied:

1. Rename states so that they come in the order in which they are discovered when the machine is executed from all-0 tape.
2. If needed, symmetrise the machine by converting any tape movement "L" to tape movement "R" so that the first tape movement is "R".

<table>
<thead>
<th></th>
<th>Skelet machine</th>
<th>Equivalent bbchallenge machine</th>
<th>bbchallenge status</th>
</thead>
<tbody>
  {#each Skelet_machines as m, i}
	<tr>
	  <td>{i+1}</td>
		<td class="leading-tight text-sm"><pre class="m-0 inline bg-transparent p-0 select-all -ml-5">{@html m.original_code}</pre><br/><span ><a href="/{m.bbchallenge_code}&s=20000" rel="external" class="text-[0.6rem] underline">{m.bbchallenge_code}</a></span></td>
		<td>Machine <a href="/{m.bbchallenge_id}&s=20000" rel="external" class="underline">#{numberWithCommas(m.bbchallenge_id)}</a></td>
		<td>
		{#if skeletBBchallengeStatus[m.bbchallenge_id] !== undefined}
		{#if skeletBBchallengeStatus[m.bbchallenge_id] == TMDecisionStatus.UNDECIDED}
			<span class="text-orange-400 font-bold">Undecided</span>
		{:else if skeletBBchallengeStatus[m.bbchallenge_id] == TMDecisionStatus.DECIDED_NON_HALT}
			<div>
				<span class="text-green-400 font-bold">Decided (Non Halt)</span>
			</div>
		{:else if skeletBBchallengeStatus[m.bbchallenge_id] == TMDecisionStatus.DECIDED_HALT}
			<div>
				<span class="text-green-400 font-bold">Decided (Halt)</span>
			</div>
		{/if}{/if}</td>
		
	</tr>
	{/each}
</tbody>

</table>

</div>
</div>
</div>
</div>
