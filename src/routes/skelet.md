<script lang="ts">

import { onMount } from 'svelte';
import { API } from '$lib/api_server';
import { numberWithCommas } from '$lib/utils';
import {
		TMDecisionStatus,
		APIDecisionStatusToTMDecisionStatus
	} from '$lib/tm';

// Translating the 43 (HNR and BL_2) Skelet's machines
// cf: https://skelet.ludost.net/bb/nreg.html

let skeletTranslation = [
		[
			'C1L E1L  H1L D1L  D1R D0L  A1L E1R  B0L C0R',
			'mAQEDAQEFAAAAAQEEAQAEAAEEAQEBAQAFAAECAAAD',
			68329601
		],
		[
			'C1L E0R  H1L C0R  D1R A0L  A1R D1R  A1L B0R',
			'mAQEDAAAFAAAAAAADAQAEAAEBAQABAQAEAQEBAAAC',
			55767995
		],
		[
			'C1L A0R  H1L E1L  D1R B0L  A1R C1R  C0L D1L',
			'mAQEDAAABAAAAAQEFAQAEAAECAQABAQADAAEDAQEE',
			5950405
		],
		[
			'C1L D0R  H1L E0L  D1R C1L  E1L A1R  B1L D0L',
			'mAQEDAAAEAAAAAAEFAQAEAQEDAQEFAQABAQECAAEE',
			6897876
		],
		[
			'C1L A1L  H1L D0L  D1R E0L  A1L C0R  C1R B0L',
			'mAQEDAQEBAAAAAAEEAQAEAAEFAQEBAAADAQADAAEC',
			60581745
		],
		[
			'C1L B0R  H1L D0R  D1L A0R  E1R C0L  C1R E1R',
			'mAQEDAAACAAAAAAAEAQEEAAABAQAFAAEDAQADAQAF',
			58211439
		],
		[
			'C1L B0R  H1L E1R  D1L A1L  A1R D0L  A0R C1R',
			'mAQEDAAACAAAAAQAFAQEEAQEBAQABAAEEAAABAQAD',
			7196989
		],
		[
			'C1L B0R  H1L C0R  D1L C0L  E0R C1L  A0R E1R',
			'mAQEDAAACAAAAAAADAQEEAAEDAAAFAQEDAAABAQAF',
			7728246
		],
		[
			'C1L D1R  H1L C0L  A1R C1L  E1R A0R  B1L E0L',
			'mAQEDAQAEAAAAAAEDAQABAQEDAQAFAAABAQECAAEF',
			12554268
		],
		[
			'C1L A0L  H1L C0L  D0R A1L  B1L E1R  D1R E0R',
			'mAQEDAAEBAAAAAAEDAAAEAQEBAQECAQAFAQAEAAAF',
			3810716
		],
		[
			'C1L A0L  H1L A0R  D0R A1L  E0R D1R  A1L B0R',
			'mAQEDAAEBAAAAAAABAAAEAQEBAAAFAQAEAQEBAAAC',
			3810169
		],
		[
			'C1L E0L  H1L E1L  D0R A1L  A0L C1R  C1R B0L',
			'mAQEDAAEFAAAAAQEFAAAEAQEBAAEBAQADAQADAAEC',
			4982511
		],
		[
			'C1L B0R  H1L A1R  D0L E1R  E0R C1L  C1R A0R',
			'mAQEDAAACAAAAAQABAAEEAQAFAAAFAQEDAQADAAAB',
			7566785
		],
		[
			'B1L H1L  C1R E0R  D1L B0R  D0L A1L  C0R A0L',
			'mAQECAAAAAQADAAAFAQEEAAACAAEEAQEBAAADAAEB',
			31357173
		],
		[
			'B1L H1L  C1L B1R  D1R E1L  B1R D0R  A1L C0L',
			'mAQECAAAAAQEDAQACAQAEAQEFAQACAAAEAQEBAAED',
			2204428
		],
		[
			'B1L H1L  C0R D1L  D1R C1R  E1L E0L  A0L B0R',
			'mAQECAAAAAAADAQEEAQAEAQADAQEFAAEFAAEBAAAC',
			20569060
		],
		[
			'B1L H1L  C0R E1L  D0R C1R  A1L B1R  B0L A0L',
			'mAQECAAAAAAADAQEFAAAEAQADAQEBAQACAAECAAEB',
			1365166
		],
		[
			'B1L H1L  C0L D0R  D1L E0R  E1L A0L  C1R D0R',
			'mAQECAAAAAAEDAAAEAQEEAAAFAQEFAAEBAQADAAAE',
			15439451
		],
		[
			'B1L H1L  C0L B0L  C1R D0R  A1L E0R  A0R E0R',
			'mAQECAAAAAAEDAAECAQADAAAEAQEBAAAFAAABAAAF',
			14536286
		],
		[
			'B1L H1L  C0L D1L  D0R C1L  E1R A0L  A1L E0R',
			'mAQECAAAAAAEDAQEEAAAEAQEDAQAFAAEBAQEBAAAF',
			347505
		],
		[
			'C1L E1L  A1L H1L  D1R E0R  B1R E1R  C1R A0L',
			'mAQEDAQEFAQEBAAAAAQAEAAAFAQACAQAFAQADAAEB',
			9980689
		],
		[
			'C1L E0L  A1R H1L  D1R A0L  D0R B1R  C0L B0R',
			'mAQEDAAEFAQABAAAAAQAEAAEBAAAEAQACAAEDAAAC',
			45615747
		],
		[
			'C1L C0R  D0L H1L  D1R E0L  C1L E0R  A1R B1L',
			'mAQEDAAADAAEEAAAAAQAEAAEFAQEDAAAFAQABAQEC',
			6237150
		],
		[
			'C1L A1L  E1R H1L  D1R D0R  B0R E0L  A0L C1R',
			'mAQEDAQEBAQAFAAAAAQAEAAAEAAACAAEFAAEBAQAD',
			60658955
		],
		[
			'C1L A0R  A1L H1L  D1R E1L  A1R D0R  E0L B0R',
			'mAQEDAAABAQEBAAAAAQAEAQEFAQABAAAEAAEFAAAC',
			47260245
		],
		[
			'C1L E1R  D1R H1L  D1L C0L  A1R D1L  B1R A0R',
			'mAQEDAQAFAQAEAAAAAQEEAAEDAQABAQEEAQACAAAB',
			13134219
		],
		[
			'C1L E0R  E0L H1L  D1L B0L  A1R A0L  A0R E1R',
			'mAQEDAAAFAAEFAAAAAQEEAAECAQABAAEBAAABAQAF',
			7163434
		],
		[
			'C1L E0L  D1R H1L  B1L E1L  A1R E1R  A1L D0R',
			'mAQEDAAEFAQAEAAAAAQECAQEFAQABAQAFAQEBAAAE',
			5657318
		],
		[
			'C1L D0R  A0L H1L  A1R D0L  E1R B1L  C1L C0R',
			'mAQEDAAAEAAEBAAAAAQABAAEEAQAFAQECAQEDAAAD',
			6626162
		],
		[
			'C1L E0L  C1R H1L  D0R A1L  A1R E0R  B1R E0L',
			'mAQEDAAEFAQADAAAAAAAEAQEBAQABAAAFAQACAAEF',
			4986661
		],
		[
			'C1L B0R  E0R H1L  D0L C1L  E1L C0L  A1R C0R',
			'mAQEDAAACAAAFAAAAAAEEAQEDAQEFAAEDAQABAAAD',
			56967673
		],
		[
			'C1L E0R  C0L H1L  D0L B0L  D1R A0R  A1R D1L',
			'mAQEDAAAFAAEDAAAAAAEEAAECAQAEAAABAQABAQEE',
			6957734
		],
		[
			'C1L D1R  E1R H1L  D0L C0L  B1R A0R  A1R E1L',
			'mAQEDAQAEAQAFAAAAAAEEAAEDAQACAAABAQABAQEF',
			11896833
		],
		[
			'C1L D1R  E1R H1L  D0L C0L  B1R A0R  A1R A1L',
			'mAQEDAQAEAQAFAAAAAAEEAAEDAQACAAABAQABAQEB',
			11896832
		],
		[
			'C1L D1R  E1R H1L  D0L C0L  B1R A0R  A1R A0R',
			'mAQEDAQAEAQAFAAAAAAEEAAEDAQACAAABAQABAAAB',
			11896831
		],
		[
			'C1L E1R  D1R H1L  D0L C0L  B1R A1L  D1L A0R',
			'mAQEDAQAFAQAEAAAAAAEEAAEDAQACAQEBAQEEAAAB',
			13609549
		],
		[
			'C1L B0R  C1R H1L  D0L D0R  A1R E0L  D1L E1L',
			'mAQEDAAACAQADAAAAAAEEAAAEAQABAAEFAQEEAQEF',
			7512832
		],
		[
			'C1L C0L  D1L H1L  B0L D0R  E0R A1L  A1R E1R',
			'mAQEDAAEDAQEEAAAAAAECAAAEAAAFAQEBAQABAQAF',
			35771936
		],
		[
			'B1L D1L  C1R H1L  E1R D1R  E1L C0R  A1L D0L',
			'mAQECAQEEAQADAAAAAQAFAQAEAQEFAAADAQEBAAEE',
			9914965
		],
		[
			'B1L A0L  C1R H1L  C0R D0R  E1L B0L  E0L A1L',
			'mAQECAAEBAQADAAAAAAADAAAEAQEFAAECAAEFAQEB',
			3841616
		],
		[
			'B1L A0R  C1L H1L  D0L E1R  E1L A0L  C1R A0R',
			'mAQECAAABAQEDAAAAAAEEAQAFAQEFAAEBAQADAAAB',
			5915217
		],
		[
			'B1L E0R  C1L H1L  D0L C0L  D1R A0R  B0R E0R',
			'mAQECAAAFAQEDAAAAAAEEAAEDAQAEAAABAAACAAAF',
			57874080
		],
		[
			'B1L A0R  C0L H1L  C1R D1L  E1L A1R  B0L D0R',
			'mAQECAAABAAEDAAAAAQADAQEEAQEFAQABAAECAAAE',
			5878998
		]
	];

	let skeletBBchallengeStatus = {};

	

	onMount(async () => {
		try {
			for (let skeletMachine of skeletTranslation) {
				const response = await API.get(`/machine/${skeletMachine[2]}`, {});
				if (response.data['status'] !== undefined)
					skeletBBchallengeStatus[skeletMachine[2]] = APIDecisionStatusToTMDecisionStatus(
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

Here are  <a href="https://skelet.ludost.net/bb/nreg.html" rel="external">Skelet's 43 undecided machines</a> and their equivalent machines in the <a href="/method#seed-database" rel="external">seed database</a> of the busy beaver challenge. <a href="/story#skelets-43-undecided-machines" rel="external">More info about Skelet's machines</a>.

Some of these 43 machines are claimed to have been decided (way before the busy beaver challenge existed) and only 21 appear to be currently still undecided, see <a href="https://github.com/danbriggs/Turing/blob/master/paper/HNRs.pdf">https://github.com/danbriggs/Turing/blob/master/paper/HNRs.pdf</a>.

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
  {#each skeletTranslation as m, i}
	<tr>
	  <td>{i+1}</td>
		<td class="leading-tight text-sm"><pre class="m-0 inline bg-transparent p-0 select-all -ml-4">{@html m[0]}</pre><br/><span ><a href="/{m[1]}" rel="external" class="text-[0.6rem] underline">{m[1]}</a></span></td>
		<td>Machine <a href="/{m[2]}" rel="external" class="underline">#{numberWithCommas(m[2])}</a></td>
		<td>
		{#if skeletBBchallengeStatus[m[2]] !== undefined}
		{#if skeletBBchallengeStatus[m[2]] == TMDecisionStatus.UNDECIDED}
			<span class="text-orange-400 font-bold">Undecided</span>
		{:else if skeletBBchallengeStatus[m[2]] == TMDecisionStatus.DECIDED_NON_HALT}
			<div>
				<span class="text-green-400 font-bold">Decided (Non Halt)</span>
			</div>
		{:else if skeletBBchallengeStatus[m[2]] == TMDecisionStatus.DECIDED_HALT}
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
