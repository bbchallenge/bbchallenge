<script lang="ts">
	import { tmTob64URLSafe } from '$lib/tm';

	let statesArrayStringRepr = [
		['1RB', '1LC'],
		['1RC', '1RB'],
		['1RD', '0LE'],
		['1LA', '1LD'],
		['???', '0LA']
	];

	// Returns [b64, error]
	function stringReprToBase64(arrayStringRepr): [string, string] {
		let tm: Uint8Array = new Uint8Array(arrayStringRepr.length * 6);

		// Construct the tm's array of byte from array string repr
		for (const [i, state] of arrayStringRepr.entries()) {
			// console.log(state);
			for (let j = 0; j < 2; j += 1) {
				if (state[j].length != 3) {
					return ['', `Transitions in '${state[j]}' must be exactly 3 characters long.`];
				}

				for (let k = 0; k < 3; k += 1) {
					if (k == 0 && !(state[j][k] == '0' || state[j][k] == '1' || state[j][k] == '?')) {
						return ['', `Write symbols in '${state[j]}' must be 0 or 1.`];
					}

					if (k == 1 && !(state[j][k] == 'L' || state[j][k] == 'R' || state[j][k] == '?')) {
						console.log(state);
						return ['', `Tape movements in '${state[j]}' must be R or L.`];
					}

					let byte;
					if (state[j][k] == '0' || state[j][k] == 'R' || state[j][k] == '?') {
						byte = 0;
					} else if (state[j][k] == '1' || state[j][k] == 'L') {
						byte = 1;
					} else {
						// State A is 1 as 0 is reserved for undefined transitions
						byte = state[j][k].charCodeAt(0) - 'A'.charCodeAt(0) + 1;
					}
					tm[6 * i + 3 * j + k] = byte;
				}
			}
		}

		return [tmTob64URLSafe(tm), ''];
	}
	let [computedB64, error] = stringReprToBase64(statesArrayStringRepr);
	$: [computedB64, error] = stringReprToBase64(statesArrayStringRepr);
</script>

<div class="dark w-full ">
	<div
		class="prose prose-invert text-white mt-4  xl:justify-start lg:ml-[170px] ml-0 sm:ml-4 font-sans prose-base w-full"
	>
		<div class="leading-normal ">
			<div>
				This tool allows you to get bbchallenge's base-64 representation of 2-symbol Turing
				machines:
			</div>
		</div>

		<h1 class="text-xl mt-4">Machine</h1>
		<div class="flex justify-center space-x-8 -mt-2">
			<table class="w-1/3">
				<thead>
					<th />
					<th>0</th>
					<th>1</th>
				</thead>
				<tbody>
					{#each statesArrayStringRepr as state, i}
						<tr
							><td>{String.fromCharCode(65 + i)}</td><td>
								<input
									class="w-[50px]"
									type="text"
									value={statesArrayStringRepr[i][0]}
									on:change={(ev) => {
										statesArrayStringRepr[i][0] = ev.target.value;
									}}
								/></td
							><td
								><input
									class="w-[50px]"
									type="text"
									value={statesArrayStringRepr[i][1]}
									on:change={(ev) => {
										statesArrayStringRepr[i][1] = ev.target.value;
									}}
								/></td
							></tr
						>
					{/each}
				</tbody>
			</table>
			<div>
				<h2 class="text-lg">Tips</h2>
				<ul>
					<li>Use `<span class="select-all">???</span>` for undefined transition</li>
					<li>Minimal syntactic verifiaction is performed</li>
				</ul>
			</div>
		</div>
		<button
			class="bg-blue-500 hover:bg-blue-400 cursor-pointer px-2 py-1 rounded-md"
			on:click={() => {
				statesArrayStringRepr.push(['???', '???']);
				statesArrayStringRepr = statesArrayStringRepr;
			}}>Add state</button
		>

		<button
			class="bg-gray-500 hover:bg-gray-400 cursor-pointer px-2 py-1 rounded-md"
			on:click={() => {
				statesArrayStringRepr.pop();
				statesArrayStringRepr = statesArrayStringRepr;
			}}>Remove last</button
		>

		<h1 class="text-xl mt-4">
			{#if error == ''}
				Base-64:
				<a class="text-base ml-2" href="/{computedB64}" rel="external" target="_blank"
					>{computedB64}</a
				>
			{:else}
				Error:
				<span class="text-red-500 text-base">{error}</span>
			{/if}
		</h1>
	</div>
</div>
