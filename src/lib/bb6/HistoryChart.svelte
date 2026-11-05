<script lang="ts">
	// Holdouts on each published BB(6) list (wiki "Holdouts lists"), log or linear, with a few milestones and
	// today's count (the latest list minus the proofs merged since). One series, so no legend.
	export let lists: { date: string; count: number; by: string; link?: string; note?: string }[];
	/** today's count and the date it was checked; null hides the point */
	export let today: { count: number; date: string; solved: number } | null = null;

	// The 2023 lists (1,458,704 and 181,851) are a year before the next one and would flatten the rest, so the
	// axis starts with the first list from the Coq-BB5 deciders; the table view lists them.
	export let from = '2024-05-01';
	$: shown = lists.filter((l) => l.date >= from);

	let scale: 'log' | 'linear' = 'log';
	let table = false;

	// `count: true` puts the count on that date in the label
	type Milestone = { date: string; label: string; href?: string; title?: string; count?: boolean };
	const MILESTONES: Milestone[] = [
		{ date: '2024-05-13', label: 'Coq-BB5 deciders', count: true },
		{
			date: '2024-07-06',
			label: 'Antihydra',
			href: 'https://www.sligocki.com/2024/07/06/bb-6-2-is-hard.html',
			title: 'Shawn Ligocki, “BB(6) is Hard (Antihydra)”'
		},
		{
			date: '2026-10-15',
			label: 'DeepMind paper',
			href: 'https://arxiv.org/abs/2610.22603',
			title: 'Dos Santos et al., “At the Limits of Computability” (11 new potential Cryptids)'
		}
	];

	// the plot fills its box: 280px, or more when the column beside it is taller
	let width = 640;
	let boxH = 0;
	$: H = Math.max(280, boxH);
	const M = { top: 20, right: 16, bottom: 28, left: 52 };
	const t = (d: string) => Date.parse(d + 'T00:00:00Z');
	const end = today ? today.date : lists[lists.length - 1].date;
	$: x0 = t(from);
	$: x1 = t(end) + 20 * 864e5;
	$: sx = (d: string) => M.left + ((t(d) - x0) / (x1 - x0)) * (width - M.left - M.right);

	// log: decades labelled, 2-9 in between as faint lines; linear: round 10k steps
	const LO = 300,
		HI = 5e4,
		LIN_HI = 4e4;
	$: plotH = H - M.top - M.bottom;
	$: sy =
		scale === 'log'
			? (n: number) => M.top + ((Math.log10(HI) - Math.log10(n)) / (Math.log10(HI) - Math.log10(LO))) * plotH
			: (n: number) => M.top + ((LIN_HI - n) / LIN_HI) * plotH;
	const MAJOR = { log: [1e3, 1e4], linear: [0, 1e4, 2e4, 3e4, 4e4] };
	const MINOR = {
		log: [3, 4, 5, 6, 7, 8, 9].map((k) => k * 100).concat([2, 3, 4, 5, 6, 7, 8, 9].map((k) => k * 1e3), [2e4, 3e4, 4e4, 5e4]),
		linear: [] as number[]
	};
	const tickText = (v: number) => (v ? `${v / 1e3}k` : '0');

	// the count holds until the next list: a step line
	$: path =
		shown.map((l, i) => `${i ? `H${sx(l.date)}V` : `M${sx(l.date)},`}${sy(l.count)}`).join('') +
		(today ? `H${sx(today.date)}` : '');
	const fmt = (n: number) => n.toLocaleString('en-US');
	const years = [2025, 2026];
	/** the count in force on a date: the last list on or before it */
	const at = (d: string) => lists.filter((l) => l.date <= d).at(-1)!;

	// Direct labels. Each sits beside its point, left of it unless it would run off the plot. It takes the
	// first offset that clears the dots and the labels already placed (today first, then right to left).
	type Mark = { key: string; px: number; py: number; name: string; value?: number; extra?: string; href?: string; title?: string; today?: boolean };
	type Placed = Mark & { lx: number; ly: number; anchor: 'start' | 'end' };
	const CH = 6.6; // px per character at 12px
	function layout(marks: Mark[], w: number, h: number): Placed[] {
		const boxes = marks.map((m) => [m.px - 6, m.py - 6, m.px + 6, m.py + 6]);
		const out: Placed[] = [];
		for (const m of [...marks].sort((a, b) => Number(!!b.today) - Number(!!a.today) || b.px - a.px)) {
			const tw = (m.name.length + (m.value === undefined ? 0 : fmt(m.value).length + 2) + (m.extra?.length ?? 0)) * CH;
			// left of the point if it fits, else right of it, else flush with the right edge (narrow screens)
			const left = m.px - 8 - tw >= M.left || m.px + 8 + tw > w - M.right;
			const anchor = left ? 'end' : 'start';
			const lx = left ? Math.min(Math.max(m.px - 8, M.left + tw), w - M.right) : m.px + 8;
			const [x0b, x1b] = left ? [lx - tw, lx] : [lx, lx + tw];
			// left of the point the line runs above (counts fall), so try below first; right of it, above
			const offs = (left ? [16, -8, 30, -22, 44, -36] : [-8, 16, -22, 30, -36, 44]).concat([-50, -64, -78]);
			let ly = m.py + offs[0];
			for (const o of offs) {
				const y = m.py + o;
				if (y - 11 < 2 || y + 3 > h - M.bottom - 2) continue;
				if (boxes.some(([a, b, c, d]) => x0b < c && x1b > a && y - 11 < d && y + 3 > b)) continue;
				ly = y;
				break;
			}
			boxes.push([x0b, ly - 11, x1b, ly + 3]);
			out.push({ ...m, lx, ly, anchor });
		}
		return out;
	}
	$: marks = [
		...MILESTONES.filter((m) => m.date >= from && at(m.date)).map((m) => ({
			key: m.date,
			px: sx(m.date),
			py: sy(at(m.date).count),
			name: m.label,
			value: m.count ? at(m.date).count : undefined,
			href: m.href,
			title: m.title
		})),
		...(today
			? [
					{
						key: 'today',
						px: sx(today.date),
						py: sy(today.count),
						name: 'Today',
						value: today.count,
						extra: today.solved ? ` (${today.solved} proved since the list)` : '',
						today: true
					}
			  ]
			: [])
	];
	$: placed = layout(marks, width, H);

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

<figure class="flex w-full flex-1 flex-col">
	<figcaption class="mb-2 flex items-start justify-between gap-3">
		<div>
			<span class="font-semibold">Holdouts over time</span>
			<span class="block text-sm text-gray-400"
				>Each published list since May 2024</span
			>
		</div>
		<div class="seg" role="group" aria-label="View">
			<button type="button" class:on={!table && scale === 'log'} aria-pressed={!table && scale === 'log'} on:click={() => ((scale = 'log'), (table = false))}>Log</button>
			<button type="button" class:on={!table && scale === 'linear'} aria-pressed={!table && scale === 'linear'} on:click={() => ((scale = 'linear'), (table = false))}>Linear</button>
			<button type="button" class:on={table} aria-pressed={table} on:click={() => (table = true)}>Table</button>
		</div>
	</figcaption>
	<div class="relative min-h-[280px] flex-1" bind:clientWidth={width} bind:clientHeight={boxH}>
		{#if table}
		<div class="absolute inset-0 overflow-y-auto">
			<table class="text-sm">
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
		</div>
		{:else}
		<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
		<svg
			class="absolute inset-0"
			{width}
			height={H}
			role="img"
			aria-label="Number of BB(6) holdouts on each published list, from {fmt(shown[0].count)} in {shown[0].date.slice(0, 7)} to {fmt(lists[lists.length - 1].count)} on {lists[lists.length - 1].date}{today ? `, ${fmt(today.count)} today` : ''}"
			on:pointermove={move}
			on:pointerleave={() => (hover = null)}
		>
			{#each MINOR[scale] as v}
				<line class="grid minor" x1={M.left} x2={width - M.right} y1={sy(v)} y2={sy(v)} />
			{/each}
			{#each MAJOR[scale] as v}
				<line class="grid" x1={M.left} x2={width - M.right} y1={sy(v)} y2={sy(v)} />
				<text class="tick" x={M.left - 6} y={sy(v)} text-anchor="end" dominant-baseline="middle">{tickText(v)}</text>
			{/each}
			{#each years as y}
				<line class="grid minor" x1={sx(`${y}-01-01`)} x2={sx(`${y}-01-01`)} y1={H - M.bottom} y2={H - M.bottom + 4} />
				<text class="tick" x={sx(`${y}-01-01`)} y={H - 8} text-anchor="middle">{y}</text>
			{/each}
			<line class="axis" x1={M.left} x2={width - M.right} y1={H - M.bottom} y2={H - M.bottom} />

			<path d={path} class="line" />

			{#each placed as m (m.key)}
				{#if Math.abs(m.ly - m.py) > 20}
					<!-- the label had to move away from its point: a short connector says whose it is -->
					<line class="leader" x1={m.px} y1={m.py} x2={m.anchor === 'end' ? m.lx + 2 : m.lx - 2} y2={m.ly - 4} />
				{/if}
				<circle class="dot" class:today={m.today} cx={m.px} cy={m.py} r={m.today ? 5 : 4} />
				{#if m.href}
					<a href={m.href} rel="external"
						><text class="label link" x={m.lx} y={m.ly} text-anchor={m.anchor}>{#if m.title}<title>{m.title}</title>{/if}{m.name}</text></a
					>
				{:else}
					<text class="label" x={m.lx} y={m.ly} text-anchor={m.anchor}
						>{m.name}{#if m.value !== undefined}: <tspan class="value">{fmt(m.value)}</tspan>{/if}{m.extra ?? ''}</text
					>
				{/if}
			{/each}

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
		{/if}
	</div>
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
	.leader {
		stroke: #4b5563;
		stroke-width: 1;
	}
	.grid.minor {
		stroke: #1f2329;
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
		paint-order: stroke;
		stroke: #111827;
		stroke-width: 4px;
		stroke-linejoin: round;
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
	.seg {
		display: inline-flex;
		flex: none;
		border: 1px solid #374151;
		border-radius: 9999px;
		padding: 2px;
		font-size: 0.8125rem;
	}
	.seg button {
		padding: 0.15rem 0.75rem;
		border-radius: 9999px;
		color: #9ca3af;
	}
	.seg button:hover {
		color: #f0efec;
	}
	.seg button.on {
		background: #374151;
		color: #f0efec;
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
