<script>
	import { tm_trace_to_image, tm_explore } from '$lib/tm';

	export let exploreMode;
	export let machine;
	export let initial_tape;
	export let tapeWidth;
	export let nbIter;
	export let origin_x;
	export let showHeadMove;

	export let machineName;

	let canvas;

	const drawRect = (context) => {
		context.fillStyle = 'black';
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.fill();
	};

	let drawCleanup;
	function draw() {
		if (drawCleanup) drawCleanup();

		// Update the width of the canvas inside of `draw`, because otherwise
		// it gets updated _afterward_ by the Svelte update loop, which will
		// blank out the canvas entirely.
		canvas.width = exploreMode ? 800 : 400;

		if (!machine) {
			return;
		}

		const context = canvas.getContext('2d');
		drawRect(context);
		if (exploreMode) {
			drawCleanup = tm_explore(context, machine, initial_tape, nbIter);
		} else {
			tm_trace_to_image(
				context,
				machine,
				initial_tape,
				tapeWidth,
				nbIter,
				origin_x,
				true,
				showHeadMove
			);
		}
	}

	$: {
		// Dependencies:
		exploreMode;
		machine;
		initial_tape;
		tapeWidth;
		nbIter;
		origin_x;
		showHeadMove;

		if (canvas) {
			draw();
		}
	}
</script>

<div class="relative mr-5">
	<canvas class="bg-slate-800 image-render-pixel" bind:this={canvas} width="400" height="500" />

	{#if canvas && machine}
		<button
			class="absolute right-2 top-2 text-blue-400 hover:text-blue-300 cursor-pointer"
			on:click={() => {
				var image = new Image();
				image.src = canvas.toDataURL();
				let w = window.open('');

				const title = `machine-${machineName || 'simulation'}`;
				w.document.write(`<head><title>${title}</title></head><body>${image.outerHTML}</body>`);
			}}
		>
			Export image
		</button>
	{/if}
</div>
