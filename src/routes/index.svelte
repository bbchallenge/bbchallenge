<script lang="ts">
	import { onMount } from 'svelte';
	import TmTable from '$lib/tm_table.svelte';
	import { TMDecisionStatus, tm_trace_to_image } from '$lib/tm';

	let machine = new Uint8Array([
		1, 0, 2, 1, 1, 2, 1, 1, 3, 0, 0, 5, 0, 1, 4, 0, 0, 1, 1, 0, 1, 0, 1, 4, 0, 0, 0, 0, 0, 3
	]); // Chaotic machine #67279052

	let canvasEl;

	const canvas = {
		width: 400,
		height: 500
	};

	const drawRect = (context) => {
		context.fillStyle = 'black';
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.fill();
	};

	onMount(() => {
		console.log('Onmount');
		const context = canvasEl.getContext('2d');

		//drawRect(context);
		tm_trace_to_image(context, canvas, machine, 500, 10000);
	});
</script>

<div>
	<div class="mt-4 <sm:mt-3 w-full flex items-start justify-center <sm:flex-col">
		<div class="bg-black">
			<canvas class="mr-5" bind:this={canvasEl} width={canvas.width} height={canvas.height} />
		</div>
		<div class="<sm:mt-3 sm:ml-10 xl:ml-20">
			<div>
				<TmTable {machine} machineID={67279052} decisionStatus={TMDecisionStatus.UNDECIDED} />
			</div>
		</div>
	</div>
</div>
