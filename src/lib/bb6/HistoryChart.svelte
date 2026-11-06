<script lang="ts">
	// Holdouts on each published BB(6) list (wiki "Holdouts lists"), log or linear, with a few milestones and
	// today's count (the latest list minus the proofs merged since). One series, so no legend.
	export let lists: { date: string; count: number; by: string; link?: string; note?: string }[];
	/** today's count and the date it was checked; null hides the point */
	export let today: { count: number; date: string; solved: number } | null = null;

	// The 2023 lists (1,458,704 and 181,851) are a year before the next one and would flatten the rest, so the
	// axis starts with the first list from the Coq-BB5 deciders; the caption gives the earlier ones.
	export let from = '2024-05-01';
	$: shown = lists.filter((l) => l.date >= from);
	$: before = lists.filter((l) => l.date < from);

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
		{ date: '2025-11-14', label: 'List the sheet uses', count: true },
		{ date: '2026-08-31', label: 'First under 1,000', count: true },
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
	// room on the right for today's count at the end of the line
	$: M = { top: 20, right: today ? 48 : 16, bottom: 28, left: 52 };
	const t = (d: string) => Date.parse(d + 'T00:00:00Z');
	const end = today ? today.date : lists[lists.length - 1].date;
	$: x0 = t(from);
	$: x1 = t(end) + 20 * 864e5;
	$: sx = (d: string) => M.left + ((t(d) - x0) / (x1 - x0)) * (width - M.left - M.right);

	// log: 1-2-5 steps labelled up to the top of the axis, the rest as faint lines; linear: round 10k steps
	const LO = 300,
		HI = 5e4,
		LIN_HI = 4e4;
	$: plotH = H - M.top - M.bottom;
	$: sy =
		scale === 'log'
			? (n: number) => M.top + ((Math.log10(HI) - Math.log10(n)) / (Math.log10(HI) - Math.log10(LO))) * plotH
			: (n: number) => M.top + ((LIN_HI - n) / LIN_HI) * plotH;
	const MAJOR = { log: [500, 1e3, 2e3, 5e3, 1e4, 2e4, 5e4], linear: [0, 1e4, 2e4, 3e4, 4e4] };
	const MINOR = {
		log: [300, 400, 600, 700, 800, 900, 3e3, 4e3, 6e3, 7e3, 8e3, 9e3, 3e4, 4e4],
		linear: [] as number[]
	};
	const tickText = (v: number) => (v >= 1e3 ? `${v / 1e3}k` : `${v}`);

	// x axis: a tick each month, the year at each January, and Apr/Jul/Oct when there is room
	const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	$: months = (() => {
		const out: { d: string; m: number; y: number }[] = [];
		const a = new Date(x0), b = new Date(x1);
		for (let y = a.getUTCFullYear(), m = a.getUTCMonth() + 1; y < b.getUTCFullYear() || (y === b.getUTCFullYear() && m <= b.getUTCMonth()); m === 11 ? ((m = 0), y++) : m++)
			out.push({ d: `${y}-${String(m + 1).padStart(2, '0')}-01`, m, y });
		return out;
	})();
	$: quarterLabels = months.length && (width - M.left - M.right) / months.length >= 12;

	// the count holds until the next list: a step line
	$: path =
		shown.map((l, i) => `${i ? `H${sx(l.date)}V` : `M${sx(l.date)},`}${sy(l.count)}`).join('') +
		(today ? `H${sx(today.date)}` : '');
	const fmt = (n: number) => n.toLocaleString('en-US');
	/** the count in force on a date: the last list on or before it */
	const at = (d: string) => lists.filter((l) => l.date <= d).at(-1)!;

	// Direct labels. Each sits beside its point, left of it unless it would run off the plot. It takes the
	// first offset that clears the line, the dots and the labels already placed (today first, then right to left).
	type Mark = { key: string; px: number; py: number; name: string; value?: number; extra?: string; href?: string; title?: string; today?: boolean };
	type Placed = Mark & { lx: number; ly: number; anchor: 'start' | 'end' };
	const CH = 6.6; // px per character at 12px
	/** the step line as segments [x0, y0, x1, y1] */
	$: segs = (() => {
		const pts = shown.map((l) => [sx(l.date), sy(l.count)]);
		if (today) pts.push([sx(today.date), sy(today.count)]);
		const out: number[][] = [];
		for (let i = 1; i < pts.length; i++) {
			const [xa, ya] = pts[i - 1], [xb, yb] = pts[i];
			out.push([xa, ya, xb, ya], [xb, ya, xb, yb]);
		}
		return out;
	})();
	const crosses = (sg: number[][], a: number, b: number, c: number, d: number) =>
		sg.some(([x0, y0, x1, y1]) => Math.max(x0, x1) >= a && Math.min(x0, x1) <= c && Math.max(y0, y1) >= b && Math.min(y0, y1) <= d);
	function layout(marks: Mark[], w: number, h: number, sg: number[][]): Placed[] {
		const boxes = marks.map((m) => [m.px - 6, m.py - 6, m.px + 6, m.py + 6]);
		const out: Placed[] = [];
		for (const m of [...marks].sort((a, b) => Number(!!b.today) - Number(!!a.today) || b.px - a.px)) {
			// today's count sits just right of the line's end, in the margin kept for it
			if (m.today) {
				out.push({ ...m, lx: m.px + 9, ly: m.py + 4, anchor: 'start' });
				continue;
			}
			const tw = (m.name.length + (m.href ? 2 : 0) + (m.value === undefined ? 0 : fmt(m.value).length + 2) + (m.extra?.length ?? 0)) * CH;
			// left of the point if it fits, else right of it, else flush with the right edge (narrow screens)
			const left = m.px - 8 - tw >= M.left || m.px + 8 + tw > w - M.right;
			const anchor = left ? 'end' : 'start';
			const lx = left ? Math.min(Math.max(m.px - 8, M.left + tw), w - M.right) : m.px + 8;
			const [x0b, x1b] = left ? [lx - tw, lx] : [lx, lx + tw];
			// left of the point the line runs above (counts fall), so try below first; right of it, above
			const offs = (left ? [16, -8, 30, -22, 44, -36, 58, 72, 86] : [-8, 16, -22, 30, -36, 44, -50]).concat([-50, -64, -78, -92]);
			const fits = (y: number, line: boolean) =>
				y - 11 >= 2 &&
				y + 3 <= h - M.bottom - 2 &&
				!boxes.some(([a, b, c, d]) => x0b < c && x1b > a && y - 11 < d && y + 3 > b) &&
				!(line && crosses(sg, x0b - 2, y - 12, x1b + 2, y + 4));
			const o = offs.find((o) => fits(m.py + o, true)) ?? offs.find((o) => fits(m.py + o, false)) ?? offs[0];
			const ly = m.py + o;
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
						name: 'today',
						value: today.count,
						title: `${fmt(today.count)} today: the latest list minus ${today.solved} proved since`,
						today: true
					}
			  ]
			: [])
	];
	$: placed = layout(marks, width, H, segs);

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
				>Each published list since May 2024{#if before.length}; the two from 2023 had {before.map((l) => fmt(l.count)).join(' and ')}{/if}.</span
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
			{#each months as mo}
				{#if mo.m === 0}
					<line class="grid minor" x1={sx(mo.d)} x2={sx(mo.d)} y1={M.top} y2={H - M.bottom} />
				{/if}
				<line class="axis" x1={sx(mo.d)} x2={sx(mo.d)} y1={H - M.bottom} y2={H - M.bottom + (mo.m % 3 ? 3 : 5)} />
				{#if mo.m === 0}
					<text class="tick year" x={sx(mo.d)} y={H - 8} text-anchor="middle">{mo.y}</text>
				{:else if quarterLabels && mo.m % 3 === 0}
					<text class="tick" x={sx(mo.d)} y={H - 8} text-anchor="middle">{MON[mo.m]}</text>
				{/if}
			{/each}
			<line class="axis" x1={M.left} x2={width - M.right} y1={H - M.bottom} y2={H - M.bottom} />

			<path d={path} class="line" />

			{#each placed as m (m.key)}
				{#if Math.abs(m.ly - m.py) > 20}
					<!-- the label had to move away from its point: a short connector says whose it is -->
					<line class="leader" x1={m.px} y1={m.py} x2={m.anchor === 'end' ? m.lx + 2 : m.lx - 2} y2={m.ly - 4} />
				{/if}
				<circle class="dot" class:today={m.today} cx={m.px} cy={m.py} r={m.today ? 5 : 4} />
				{#if m.today}
					<text class="label" x={m.lx} y={m.ly}>{#if m.title}<title>{m.title}</title>{/if}<tspan class="value">{fmt(m.value ?? 0)}</tspan></text>
					<text class="label sub" x={m.lx} y={m.ly + 13}>today</text>
				{:else if m.href}
					<a href={m.href} rel="external"
						><text class="label link" x={m.lx} y={m.ly} text-anchor={m.anchor}>{#if m.title}<title>{m.title}</title>{/if}{m.name} ↗</text></a
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
		fill: #93c5fd;
	}
	a:hover .label.link {
		fill: #dbeafe;
	}
	.label.sub {
		fill: #898781;
		font-size: 11px;
	}
	.tick.year {
		fill: #c3c2b7;
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
