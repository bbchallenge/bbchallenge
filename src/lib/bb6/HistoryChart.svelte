<script lang="ts">
	// Holdouts on each published BB(6) list (wiki "Holdouts lists"), log scale, with a few milestones and
	// today's count (the latest list minus the proofs merged since). One series, so no legend.
	export let lists: { date: string; count: number; by: string; link?: string; note?: string }[];
	/** today's count and the date it was checked; null hides the point */
	export let today: { count: number; date: string; solved: number } | null = null;

	// The 2023 lists (1,458,704 and 181,851) are a year before the next one and would flatten the rest, so the
	// axis starts with the first list from the Coq-BB5 deciders; the caption gives the earlier ones.
	export let from = '2024-05-01';
	$: shown = lists.filter((l) => l.date >= from);
	$: before = lists.filter((l) => l.date < from);

	// labels sit below-left of their point (the line falls to the right, so that corner is empty)
	type Milestone = { date: string; label: string; href?: string; rule?: boolean; aboveRight?: boolean };
	const MILESTONES: Milestone[] = [
		{ date: '2024-05-13', label: 'Coq-BB5 deciders', aboveRight: true },
		{ date: '2024-07-06', label: 'Antihydra: “BB(6) is Hard”', href: 'https://www.sligocki.com/2024/07/06/bb-6-2-is-hard.html', rule: true },
		{ date: '2025-11-14', label: 'List the sheet uses' },
		{ date: '2026-08-31', label: 'First under 1,000' }
	];

	let width = 640;
	const H = 280;
	const M = { top: 28, right: 16, bottom: 28, left: 52 };
	const t = (d: string) => Date.parse(d + 'T00:00:00Z');
	const end = today ? today.date : lists[lists.length - 1].date;
	$: x0 = t(from);
	$: x1 = t(end) + 20 * 864e5;
	$: sx = (d: string) => M.left + ((t(d) - x0) / (x1 - x0)) * (width - M.left - M.right);
	const LO = Math.log10(250),
		HI = Math.log10(5e4);
	const sy = (n: number) => M.top + ((HI - Math.log10(n)) / (HI - LO)) * (H - M.top - M.bottom);

	// the count holds until the next list: a step line
	$: path =
		shown.map((l, i) => `${i ? `H${sx(l.date)}V` : `M${sx(l.date)},`}${sy(l.count)}`).join('') +
		(today ? `H${sx(today.date)}` : '');
	const fmt = (n: number) => n.toLocaleString('en-US');
	const yTicks = [1e3, 3e3, 1e4, 3e4];
	const years = [2025, 2026];
	const byDate = (d: string) => lists.filter((l) => l.date === d).at(-1)!;

	// hover: snap to the nearest list
	let hover: number | null = null;
	function move(e: PointerEvent) {
		const r = (e.currentTarget as SVGElement).getBoundingClientRect();
		const px = e.clientX - r.left;
		let best = 0;
		shown.forEach((l, i) => {
			if (Math.abs(sx(l.date) - px) < Math.abs(sx(shown[best].date) - px)) best = i;
		});
		hover = best;
	}
	$: h = hover === null ? null : shown[hover];
</script>

<figure class="w-full">
	<figcaption class="mb-2">
		<span class="font-semibold">Holdouts over time</span>
		<span class="block text-sm text-gray-400"
			>Each published list, log scale{#if before.length}. Before these: {before.map((l) => `${fmt(l.count)} (${l.date.slice(0, 7)})`).join(', ')}{/if}.</span
		>
	</figcaption>
	<div class="relative" bind:clientWidth={width}>
		<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
		<svg
			{width}
			height={H}
			role="img"
			aria-label="Number of BB(6) holdouts on each published list, from {fmt(shown[0].count)} in {shown[0].date.slice(0, 7)} to {fmt(lists[lists.length - 1].count)} on {lists[lists.length - 1].date}{today ? `, ${fmt(today.count)} today` : ''}"
			on:pointermove={move}
			on:pointerleave={() => (hover = null)}
		>
			{#each yTicks as v}
				<line class="grid" x1={M.left} x2={width - M.right} y1={sy(v)} y2={sy(v)} />
				<text class="tick" x={M.left - 6} y={sy(v)} text-anchor="end" dominant-baseline="middle">{v / 1e3}k</text>
			{/each}
			{#each years as y}
				<text class="tick" x={sx(`${y}-01-01`)} y={H - 8} text-anchor="middle">{y}</text>
			{/each}
			<line class="axis" x1={M.left} x2={width - M.right} y1={H - M.bottom} y2={H - M.bottom} />

			{#each MILESTONES.filter((m) => m.rule) as m}
				<line class="rule" x1={sx(m.date)} x2={sx(m.date)} y1={M.top + 12} y2={H - M.bottom} />
				<a href={m.href} rel="external"><text class="label link" x={sx(m.date) + 5} y={H - M.bottom - 8}>{m.label}</text></a>
			{/each}

			<path d={path} class="line" />

			{#each MILESTONES.filter((m) => !m.rule && byDate(m.date)) as m}
				{@const l = byDate(m.date)}
				<circle class="dot" cx={sx(m.date)} cy={sy(l.count)} r="4" />
				<text class="label" x={sx(m.date) + (m.aboveRight ? 6 : -6)} y={sy(l.count) + (m.aboveRight ? -10 : 16)} text-anchor={m.aboveRight ? 'start' : 'end'}
					>{m.label}: <tspan class="value">{fmt(l.count)}</tspan></text
				>
			{/each}
			{#if today}
				<circle class="dot today" cx={sx(today.date)} cy={sy(today.count)} r="5" />
				<text class="label" x={sx(today.date) - 8} y={sy(today.count) + 20} text-anchor="end"
					>Today: <tspan class="value">{fmt(today.count)}</tspan>{today.solved ? ` (${today.solved} proved since the list)` : ''}</text
				>
			{/if}

			{#if h}
				<line class="cross" x1={sx(h.date)} x2={sx(h.date)} y1={M.top} y2={H - M.bottom} />
				<circle class="dot hover" cx={sx(h.date)} cy={sy(h.count)} r="5" />
			{/if}
		</svg>
		{#if h}
			<div class="tip" style="left:{Math.min(Math.max(sx(h.date) - 110, 0), width - 230)}px; top:{Math.max(sy(h.count) - 92, 0)}px">
				<strong>{fmt(h.count)}</strong> holdouts · {h.date}<br />
				<span class="text-gray-400">shared by {h.by}</span>
				{#if h.note}<br /><span class="text-gray-400">{h.note}</span>{/if}
			</div>
		{/if}
	</div>
	<details class="text-sm mt-1">
		<summary class="cursor-pointer text-gray-400">As a table</summary>
		<table class="text-sm mt-2">
			<thead><tr><th class="text-left pr-6">List</th><th class="text-right pr-6">Holdouts</th><th class="text-left">Shared by</th></tr></thead>
			<tbody>
				{#each [...lists].reverse() as l}
					<tr>
						<td class="pr-6">{#if l.link}<a class="underline" href={l.link} rel="external">{l.date}</a>{:else}{l.date}{/if}</td>
						<td class="text-right tabular-nums pr-6">{fmt(l.count)}</td>
						<td>{l.by}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</details>
</figure>

<style>
	svg {
		display: block;
		overflow: visible;
		font-size: 12px;
		touch-action: pan-y;
	}
	.grid {
		stroke: #2c2c2a;
		stroke-width: 1;
	}
	.axis {
		stroke: #383835;
		stroke-width: 1;
	}
	.tick {
		fill: #898781;
	}
	.rule {
		stroke: #898781;
		stroke-width: 1;
	}
	.line {
		fill: none;
		stroke: #3987e5;
		stroke-width: 2;
		stroke-linejoin: round;
	}
	.dot {
		fill: #3987e5;
		stroke: #111827;
		stroke-width: 2;
	}
	.dot.today {
		fill: #111827;
		stroke: #3987e5;
	}
	.label {
		fill: #c3c2b7;
	}
	.label.link {
		text-decoration: underline;
		text-decoration-color: #6b7280;
	}
	.value {
		fill: #f0efec;
		font-weight: 600;
	}
	.cross {
		stroke: #6b7280;
		stroke-width: 1;
	}
	.tip {
		position: absolute;
		width: 230px;
		pointer-events: none;
		background: #1f2937;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		padding: 6px 8px;
		font-size: 12px;
		line-height: 1.4;
	}
</style>
