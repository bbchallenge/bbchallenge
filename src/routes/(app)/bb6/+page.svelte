<script lang="ts">
	import '$lib/bb6/table.css';
	import { onMount, onDestroy } from 'svelte';
	import SeoTitle from '$lib/seo_title.svelte';
	import HistoryChart from '$lib/bb6/HistoryChart.svelte';
	import data from '../../../../static/bb6/holdouts.json';
	import { canonicalKey, TM_RE } from '$lib/bb6/tm_key.js';
	import { fetchLive, overlay } from '$lib/bb6/busycoq_live.js';
	import { machineCodeToTM, tm_trace_to_image } from '$lib/tm';
	import { CLASS_WIKI, WIKI, STATUS_LABEL, STATUS_HELP, STATUS_ORDER, log10Of } from '$lib/bb6/classes.js';

	type Holdout = (typeof data.holdouts)[number];
	const holdouts: Holdout[] = data.holdouts;
	const sheetCell = (c: { tab: string; ref: string }) =>
		`${data.sources.sheet.url}/edit#gid=${(data.sheet_tabs as Record<string, string>)[c.tab]}&range=${c.ref}`;
	const prUrl = (n: number) => `https://github.com/${data.busycoq.repo}/pull/${n}`;
	const fileUrl = (f: string) => `https://github.com/${data.busycoq.repo}/blob/${data.busycoq.head.sha}/verify/${f}`;
	const sheetMachine = (h: Holdout): string => (h.sheet as any)?.machine ?? '';
	const discordUrl = (l: { channel_id: string; message: string }) =>
		((data.url_templates as any).discord_message as string)
			.replace('{channel_id}', l.channel_id)
			.replace('{message}', l.message);
	const author = (p: any): string => p.author ?? '';
	const fmtDate = (s: string) => s.slice(0, 10);
	const srcUrl = (k: string): string => (data.sources as Record<string, { url: string }>)[k]?.url ?? '';

	// ---- live overlay -------------------------------------------------------------------------
	let live: any = null;
	let liveState: 'checking' | 'ok' | 'failed' = 'checking';
	$: changedCount = [...ov.values()].filter((v) => v.changed).length;
	let cooling = false; // "check again" may be used once a minute
	let coolTimer: ReturnType<typeof setTimeout> | undefined;
	async function check(force = false) {
		liveState = 'checking';
		live = await fetchLive(data, { force });
		liveState = live.ok ? 'ok' : 'failed';
	}
	$: ov = overlay(data, live);
	// busycoq's status, except that a machine with no proof but a simulated halt shows that instead
	$: st = new Map([...ov].map(([i, v]) => [i, v.status === 'open' && holdouts[i].simulated_halt ? 'sim_halt' : v.status]));

	// ---- search, filter, sort ---------------------------------------------------------------
	let q = '';
	let cls = '';
	let status = 'all';
	let sort = 'list';
	let rev = false; // a second click on a column header reverses it
	let onlyWiki = false;
	let tag = '';
	let expanded = new Set<number>();
	let urlReady = false;

	const classes = [...new Set(holdouts.map((h) => h.class).filter(Boolean) as string[])].sort();
	// community tags (data/bb6/sources/notable.json): Cryptid, Probviously halting, Energy vampire, BMO1…
	const tagInfo = data.tags as Record<string, { url: string; help: string }>;
	const tagGroup = (t: string) => (/^BMO\d+$/.test(t) ? 'BMO' : t);
	const tagCounts = new Map<string, number>();
	for (const h of holdouts) for (const g of new Set(h.tags.map(tagGroup))) tagCounts.set(g, (tagCounts.get(g) ?? 0) + 1);
	const tagList = Object.keys(tagInfo).filter((t) => tagCounts.has(t));
	const named = holdouts.filter((h) => h.name);
	const PARTS = ['pr_open', 'sim_halt', 'open'] as const;
	const PART_LABEL = { pr_open: 'in an open PR, awaiting merge', solved: 'merged since the list (off the count)', sim_halt: 'simulated to a halt', open: 'no proof yet' };
	const GROUPS = [
		{ label: 'Rocq proof', parts: ['pr_open', 'solved'] },
		{ label: 'Informal', parts: ['sim_halt'] },
		{ label: 'None', parts: ['open'] }
	] as const;
	// a row counts under every class some source gives it, as the Class filter matches
	const classCount = new Map(classes.map((c) => [c, holdouts.filter((h) => h.classifications.some((x) => x.class === c)).length]));
	// machines of the older base list decided since (hidden until opened)
	type Decided = (typeof data.decided)[number];
	const decided: Decided[] = data.decided;
	const TM_EXACT = new RegExp(`^${TM_RE.source}$`);
	let showDecided = false;
	// phones show the first rows as cards, the rest on request: 608 cards are a very long page
	const PHONE_ROWS = 50;
	let allRows = false;
	const decidedKey = new Map(decided.map((d) => [canonicalKey(d.tm)!, d.n]));
	function decidedMatch(d: Decided, q: string, cls: string): boolean {
		if (cls && d.class !== cls) return false;
		const typed = q.trim();
		const needle = typed.toLowerCase();
		if (!needle) return true;
		if (TM_EXACT.test(typed)) return decidedKey.get(canonicalKey(typed)!) === d.n;
		if (/^#?\d+$/.test(needle)) return false; // numbers refer to today's list
		return `${d.tm} ${d.class ?? ''} ${d.file ?? ''}`.toLowerCase().includes(needle);
	}
	$: decidedRows = decided.filter((d) => decidedMatch(d, q, cls));
	$: if (q.trim() && decidedRows.length && decidedRows.length < decided.length) showDecided = true;
	const keyIndex = new Map<string, number>();
	holdouts.forEach((h, i) => {
		keyIndex.set(canonicalKey(h.tm)!, i);
		for (const a of h.aliases) keyIndex.set(canonicalKey(a.tm)!, i);
	});
	const haystack = holdouts.map((h) =>
		[h.n, h.tm, ...h.aliases.map((a) => a.tm), h.name ?? '', h.class ?? '', ...h.tags, ...h.classifications.map((c) => c.class)].join(' ').toLowerCase()
	);

	// One format for every figure: 1.0e15, 6.0e79, 1.0e146
	function sci(log: number) {
		let e = Math.floor(log + 1e-9);
		let m = Math.round(10 ** (log - e) * 10) / 10;
		if (m >= 10) (m /= 10), e++;
		return `${m.toFixed(1)}e${e}`;
	}
	// set only when the vampire's code differs from the list's (no current row has it, so the JSON type lacks it)
	const simMachine = (s: object) => (s as { machine?: string }).machine;
	function simulated(h: Holdout): { text: string; log: number } | null {
		const halt = h.simulated_halt?.steps_log10;
		if (halt) return { text: `halts after ≈ 10^(${sci(Math.log10(halt))})`, log: halt };
		const s = h.slugbird?.simulated ? log10Of(h.slugbird.simulated) : null;
		const k = h.sheet?.simulated_log10_min ?? null;
		if (s !== null && (k === null || s >= k)) return { text: sci(s), log: s };
		if (k !== null) return { text: `≥ ${sci(k)}`, log: k };
		return null;
	}

	type Filters = { q: string; cls: string; status: string; onlyWiki: boolean; tag: string };
	// Svelte only tracks variables named inside the `$:` statement, so the filters are passed in explicitly.
	function matches(h: Holdout, i: number, f: Filters, st: string): boolean {
		// 'rocq' is the group: a Rocq proof, merged or in a PR
		if (f.status !== 'all' && !(f.status === 'rocq' ? st === 'pr_open' || st === 'solved' : st === f.status)) return false;
		if (f.cls && !h.classifications.some((c) => c.class === f.cls)) return false;
		if (f.onlyWiki && !h.wiki_pages.length) return false;
		if (f.tag && !(f.tag === 'named' ? h.name : h.tags.some((t) => tagGroup(t) === f.tag))) return false;
		const typed = f.q.trim();
		const needle = typed.toLowerCase().replace(/^#/, '');
		if (!needle) return true;
		if (TM_EXACT.test(typed)) return keyIndex.get(canonicalKey(typed)!) === i; // any mirror/renaming/alias
		if (/^\d+$/.test(needle)) return String(h.n) === needle;
		return haystack[i].includes(needle);
	}

	$: rows = holdouts
		.map((h, i) => ({ h, i }))
		.filter(({ h, i }) => matches(h, i, { q, cls, status, onlyWiki, tag }, st.get(i)!))
		.sort((a, b) => (rev ? -1 : 1) * cmp(a, b, sort));
	function cmp(a: { h: Holdout; i: number }, b: { h: Holdout; i: number }, sort: string) {
		switch (sort) {
			case 'class':
				return (a.h.class ?? '~').localeCompare(b.h.class ?? '~') || a.h.n - b.h.n;
			case 'status':
				return STATUS_ORDER[st.get(a.i)!] - STATUS_ORDER[st.get(b.i)!] || a.h.n - b.h.n;
			case 'sim':
				return (simulated(b.h)?.log ?? -1) - (simulated(a.h)?.log ?? -1) || a.h.n - b.h.n;
			case 'sim-asc':
				return (simulated(a.h)?.log ?? 1e9) - (simulated(b.h)?.log ?? 1e9) || a.h.n - b.h.n;
			default:
				return a.h.n - b.h.n;
		}
	}
	$: left = holdouts.length - counts.solved;
	$: counts = (() => {
		const c = { open: 0, sim_halt: 0, pr_open: 0, solved: 0 };
		for (const v of st.values()) c[v]++;
		return c;
	})();

	// keep the filters in the URL so a view can be shared
	$: if (urlReady && typeof window !== 'undefined') {
		const p = new URLSearchParams();
		if (q) p.set('q', q);
		if (cls) p.set('class', cls);
		if (status !== 'all') p.set('status', status);
		if (sort !== 'list') p.set('sort', sort);
		if (rev) p.set('rev', '1');
		if (onlyWiki) p.set('wiki', '1');
		if (tag) p.set('tag', tag);
		const s = p.toString();
		window.history.replaceState(window.history.state, '', (s ? `?${s}` : window.location.pathname) + window.location.hash);
	}

	$: filtered = !!(q || cls || tag || onlyWiki || status !== 'all');
	function clear() {
		q = '';
		cls = '';
		status = 'all';
		onlyWiki = false;
		tag = '';
	}
	// a named machine: just its row, opened
	function onlyMachine(h: Holdout) {
		clear();
		q = h.tm;
		expanded.add(h.n);
		expanded = expanded;
		document.getElementById('table')?.scrollIntoView({ behavior: 'smooth' });
	}
	// the viewer's default picture: 10,000 steps from a blank tape, 400 cells wide
	function diagram(canvas: HTMLCanvasElement, tm: string) {
		tm_trace_to_image(canvas.getContext('2d')!, machineCodeToTM(tm), '0', 400, 10_000, 0.5, true, true);
	}
	// column headers sort like the dropdown; a second click reverses
	const sortKey = (s: string) => (s === 'sim-asc' ? 'sim' : s);
	function sortBy(k: string) {
		if (k === 'sim' && sortKey(sort) === 'sim') sort = sort === 'sim' ? 'sim-asc' : 'sim';
		else if (sort === k) rev = !rev;
		else (sort = k), (rev = false);
	}
	// aria-sort and the arrow say the real direction: ▴ ascending, ▾ descending
	$: ascending = sort === 'sim' ? false : sort === 'sim-asc' ? true : !rev;

	function toggle(n: number) {
		expanded.has(n) ? expanded.delete(n) : expanded.add(n);
		expanded = expanded;
	}
	let copied = '';
	async function copy(tm: string) {
		try {
			await navigator.clipboard.writeText(tm);
			copied = tm;
			setTimeout(() => (copied = ''), 1500);
		} catch {
			copied = 'failed ' + tm;
			setTimeout(() => (copied = ''), 1500);
		}
	}

	onDestroy(() => clearTimeout(coolTimer));

	onMount(() => {
		const p = new URLSearchParams(window.location.search);
		q = p.get('q') ?? '';
		cls = p.get('class') ?? '';
		status = p.get('status') ?? 'all';
		sort = p.get('sort') ?? 'list';
		rev = p.get('rev') === '1';
		onlyWiki = p.get('wiki') === '1';
		tag = p.get('tag') ?? '';
		if (window.location.hash === '#decided') showDecided = true;
		urlReady = true;
		check();
	});

	// where a "Proved" chip points: the proof file, else the merged pull request
	const proofLink = (h: Holdout, v: { prs: { number: number; state: string; relation: string }[] }) => {
		if ('proof_url' in v && v.proof_url) return v.proof_url as string;
		const f = h.busycoq.solved_in[0];
		if (f) return fileUrl(f.file);
		const m = v.prs.find((p) => p.relation === 'proves' && p.state === 'merged');
		return m ? prUrl(m.number) : null;
	};
	const sourceName: Record<string, string> = { sheet: 'RobinCodes’s sheet', slugbird: 'slugbird’s guide' };
	const relText: Record<string, string> = {
		exact: 'same machine',
		mirror: 'mirror / state renaming',
		equivalent: 'equivalent machine (mxdys’s equivalence groups)'
	};
</script>

<SeoTitle value="BB(6) holdouts" />
<svelte:head>
	<link rel="alternate" type="application/json" href="/bb6/holdouts.json" title="BB(6) holdouts data (schema: docs/bb6-holdouts.md)" />
</svelte:head>

<div class="dark w-full">
	<div class="max-w-[1400px] mx-auto px-0 sm:px-4 lg:px-6 font-sans text-gray-100 leading-relaxed">
		<!-- the count, with how it moves, beside the chart of how it got here -->
		<div class="grid gap-x-12 gap-y-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] mt-8 mb-8">
			<div class="min-w-0">
				<h1 class="text-3xl font-bold mb-2">BB(6) holdouts</h1>
				<p class="text-gray-300 mb-6 max-w-[62ch]">
					The 6-state, 2-symbol Turing machines still standing between us and
					<a class="link" href="https://wiki.bbchallenge.org/wiki/BB(6)" rel="external">BB(6)</a>: each one’s class, its Rocq proof status in
					<a class="link" href="https://github.com/{data.busycoq.repo}/tree/{data.busycoq.branch}" rel="external">busycoq</a>, simulation depth,
					space-time diagram and links.
				</p>

				<!-- the latest list minus what busycoq has proved since, so it moves with each merge -->
				<div aria-live="polite">
					<p class="flex items-baseline gap-3">
						<strong class="text-6xl font-bold tabular-nums leading-none">{left}</strong>
						<span class="text-xl font-semibold">holdouts left</span>
					</p>
					<p class="text-sm text-gray-400 mt-2">
						{holdouts.length} on the <a class="link" href={data.list.discord_url} rel="external">{fmtDate(data.list.published)} list</a>{#if counts.solved}, minus {counts.solved} proved since{/if}.
					</p>
				</div>

				<!-- what the count is made of: one bar, its legend doubles as the status filter -->
				<div class="bar mt-5" role="img" aria-label="{counts.pr_open} proved in an open PR, {counts.sim_halt} simulated to a halt, {counts.open} with no proof">
					{#each PARTS as k}<span class="seg-{k}" style="flex-grow:{counts[k]}" />{/each}
				</div>
				<!-- grouped by kind of evidence: a Rocq proof, an informal result, nothing yet -->
				<dl class="groups mt-3 text-sm">
					{#each GROUPS as g}
						<dt>{g.label}</dt>
						<dd>
							{#each g.parts as k}
								{#if k !== 'solved' || counts.solved}
									<button class="legend" class:on={status === k} aria-pressed={status === k} title={status === k ? 'Show all' : 'Show only these'} on:click={() => (status = status === k ? 'all' : k)}
										><span class="sw seg-{k}" /><strong class="tabular-nums">{counts[k]}</strong> {PART_LABEL[k]}</button
									>
								{/if}
							{/each}
						</dd>
					{/each}
				</dl>

				<!-- one line: the decided machines are here too, and how fresh the busycoq status is -->
				<p class="text-sm text-gray-400 mt-4" role="status" aria-live="polite">
					{#if data.base_list}<span class="cursor-help underline decoration-dotted decoration-gray-500 underline-offset-2" title="Every machine of the {data.base_list.count.toLocaleString('en-US')}-machine list of {data.base_list.published} is on this page: {holdouts.length} on today’s list, {data.base_list.decided} decided since (below), and the other {data.base_list.count - holdouts.length - data.base_list.decided} as equivalents of a machine on today’s list (‘+N equivalent machines’ in its row).">All {data.base_list.count.toLocaleString('en-US')} here</span>, incl.
						<a class="link" href="#decided" on:click={() => (showDecided = true)}>{data.base_list.decided} decided since</a> ·{/if}
					{#if liveState === 'checking'}
						checking busycoq…
					{:else if liveState === 'ok' && live}
						<span title="busycoq {data.busycoq.head.sha.slice(0, 7)} ({fmtDate(data.busycoq.head.date)}); the page checks for newer commits"
							>busycoq checked {new Date(live.checked_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span
						>{#if live.commits_ahead}:
							<a class="link text-gray-200" href={live.compare_url} rel="external">{live.commits_ahead} new commit{live.commits_ahead === 1 ? '' : 's'}</a>,
							{changedCount} status{changedCount === 1 ? '' : 'es'} changed{/if}
						{#each live.notes as n}<span class="block text-yellow-300">{n}</span>{/each}
					{:else}
						<span class="text-yellow-300" title={live?.error}>busycoq check failed</span>, showing {fmtDate(data.busycoq.snapshot_fetched_at)}
					{/if}
					·
					<button
						class="link disabled:opacity-50 disabled:no-underline"
						disabled={liveState === 'checking' || cooling}
						on:click={() => {
							cooling = true;
							clearTimeout(coolTimer);
							coolTimer = setTimeout(() => (cooling = false), 60_000);
							check(true);
						}}>check again</button
					>
				</p>

			</div>
			<section class="flex min-w-0 flex-col xl:pt-2">
				<HistoryChart
					lists={data.history}
					today={{ count: holdouts.length - counts.solved, solved: counts.solved, date: new Date(live?.checked_at ?? data.busycoq.snapshot_fetched_at).toISOString().slice(0, 10) }}
				/>
			</section>
		</div>

		<!-- intro -->
		<details class="mb-6 rounded-lg border border-gray-700/70 px-4 py-3">
			<summary class="cursor-pointer font-semibold py-1">Background and notation</summary>
			<div class="mt-3 space-y-3 text-gray-200 max-w-[75ch]">
				<p>
					To determine the value of BB(6), we first need to show for every 6-state, 2-symbol machine whether it halts or
					runs forever starting from an all-0 tape. To save time, we enumerate all 6-state machines using
					<a class="link" href="https://wiki.bbchallenge.org/wiki/Tree_Normal_Form" rel="external">Tree Normal Form</a>. The
					<a class="link" href="https://wiki.bbchallenge.org/wiki/Holdouts_lists" rel="external">holdouts</a> are the
					machines still undecided. mxdys maintains the official list and posts updates in
					<a class="link" href="https://discord.gg/wuZhtTvYU3" rel="external">#bb6 on Discord</a>. Each row in the
					table contains either one Turing machine or a group of Turing machines with similar behavior that have been
					shown to have the same halting status.
				</p>
				<p>
					Machines are written as six <code>_</code>-separated groups, one per state A–F, each giving the transitions on
					reading 0 and 1: <code>1RB</code> writes 1, moves right and enters B, and
					<code class="whitespace-nowrap">---</code> halts. Holdout #1, for example:
					<code class="block mt-2 break-all">1RB1RF_1LC1LB_1RD1LD_1RE0RA_---0LB_0LF0RC</code>
				</p>
				<dl class="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
					<dt class="font-semibold">Class</dt>
					<dd>
						Informal behavioural category, e.g.
						<a class="link" href="https://wiki.bbchallenge.org/wiki/Bell" rel="external">Bell</a>,
						<a class="link" href="https://wiki.bbchallenge.org/wiki/Bouncer" rel="external">bouncer</a> or
						<a class="link" href="https://wiki.bbchallenge.org/wiki/Counter" rel="external">counter</a>.
					</dd>
					<dt class="font-semibold">Tags</dt>
					<dd>
						Community labels, from the wiki’s <a class="link" href="https://wiki.bbchallenge.org/wiki/BB(6)#Cryptids" rel="external">BB(6) page</a>
						and <a class="link" href="https://wiki.bbchallenge.org/wiki/Beaver_Math_Olympiad" rel="external">Beaver Math Olympiad</a>
						and from Discord. A <a class="link" href="https://wiki.bbchallenge.org/wiki/Cryptids" rel="external">Cryptid</a> is a
						machine whose blank-tape behaviour follows a simple rule whose halting question is an unsolved, presumed-hard math problem.
						Most known ones are <a class="link" href="https://wiki.bbchallenge.org/wiki/Collatz-like" rel="external">Collatz-like</a> (e.g. <a class="link" href="/antihydra">Antihydra</a>); others are not (e.g. Space Needle).
						<a class="link" href="https://wiki.bbchallenge.org/wiki/Probvious" rel="external">probviously</a> halting or
						non-halting means probabilistic arguments say so, without a proof.
					</dd>
					<dt class="font-semibold">Proof status</dt>
					<dd>
						Grouped by the kind of evidence. <strong>Rocq proof</strong>, in busycoq (mxdys’s repository of Rocq proofs):
						<strong>Proof in PR</strong> when it is in an unmerged pull request, <strong>Proved</strong> once merged since the list was
						published (a holdout leaves the next list then). <strong>Informal</strong>: <strong>Simulated halt</strong>, an accelerated
						simulation found a halt, with no Rocq proof yet. <strong>None</strong>: no proof of either kind. Probviously
						halting or non-halting is a tag, not a proof.
					</dd>
					<dt class="font-semibold">Steps simulated</dt>
					<dd>Steps run from a blank tape without halting, i.e. a lower bound on the running time if it halts.</dd>
					<dt class="font-semibold">Tools</dt>
					<dd>
						<strong>viewer</strong> (this site) and
						<a class="link" href="https://fiery.pages.dev/turing" rel="external">fiery</a> draw space-time diagrams;
						<a class="link" href="https://ccz181078.github.io/TM/LongAcc/index.html" rel="external">LongAcc</a> runs a simulation with
						longitudinal acceleration.
					</dd>
				</dl>
			</div>
		</details>

		<!-- one row of controls, then one row of quick filters, then the count -->
		<form id="table" class="flex flex-wrap gap-2 mb-3 scroll-mt-4" on:submit|preventDefault>
			<input
				type="search"
				bind:value={q}
				aria-label="Search"
				placeholder="Search: machine code, class or number"
				class="field flex-[2_1_18rem]"
				autocomplete="off"
				spellcheck="false"
			/>
			<select bind:value={cls} aria-label="Class" class="field flex-[1_1_11rem]">
				<option value="">All classes</option>
				{#each classes as c}<option value={c}>{c} ({classCount.get(c)})</option>{/each}
			</select>
			<select bind:value={status} aria-label="Proof status" class="field flex-[1_1_11rem]">
				<option value="all">Any proof status</option>
				<option value="rocq">Rocq proof (merged or in PR)</option>
				<option value="pr_open">&nbsp;&nbsp;Proof in PR</option>
				<option value="solved">&nbsp;&nbsp;Proved (merged)</option>
				<option value="sim_halt">Informal: simulated halt</option>
				<option value="open">No proof</option>
			</select>
			<select bind:value={sort} on:change={() => (rev = false)} aria-label="Sort by" class="field flex-[1_1_11rem]">
				<option value="list">Sort: list order</option>
				<option value="class">Sort: class</option>
				<option value="status">Sort: status, no proof first</option>
				<option value="sim">Sort: most steps simulated</option>
				<option value="sim-asc">Sort: fewest steps simulated</option>
			</select>
		</form>
		<div class="flex flex-wrap items-center gap-x-1.5 gap-y-1 mb-4 text-sm">
			{#each named as h}<button class="tag named" class:on={q === h.tm} aria-pressed={q === h.tm} on:click={() => (q === h.tm ? (q = '') : onlyMachine(h))} title="#{h.n} · {h.class ?? ''} · {h.tags.join(', ')}. Click to show only this machine."
					>{h.name}</button
				>{/each}
			<span class="sep" aria-hidden="true" />
			{#each tagList as t}
				<button class="tag" class:on={tag === t} aria-pressed={tag === t} on:click={() => (tag = tag === t ? '' : t)} title="{tagInfo[t].help}. Click to filter."
					>{t === 'BMO' ? 'Beaver Math Olympiad' : t} <span class="muted">{tagCounts.get(t)}</span></button
				>
			{/each}
		</div>
		<div class="flex flex-wrap items-center justify-between gap-2 mb-3">
		<p class="text-sm text-gray-400" aria-live="polite">
			{rows.length} of {holdouts.length} machines{#if rows.length === 0}: none match{#if q.trim() && decidedRows.length && decidedRows.length < decided.length}{' '}on today’s list; {decidedRows.length} decided since {data.base_list?.published} (below){/if}{/if}{#if filtered}
				&nbsp;· <button class="link" on:click={clear}>Clear filters</button>{/if}
		</p>
			<button class="tag named" class:on={onlyWiki} aria-pressed={onlyWiki} on:click={() => (onlyWiki = !onlyWiki)}>{onlyWiki ? '✓ ' : ''}Has wiki page</button>
		</div>
		<!-- table -->
		<table class="bb6 w-full text-base">
			<caption class="sr-only">BB(6) holdouts</caption>
			<colgroup><col class="c-num" /><col class="c-tm" /><col class="c-cls" /><col class="c-st" /><col class="c-sim" /><col class="c-links" /></colgroup>
			<thead>
				<tr>
					{#each [['list', '#'], ['tm', 'Machine'], ['class', 'Class'], ['status', 'Proof status'], ['sim', 'Steps simulated']] as [k, label]}
						<th scope="col" aria-sort={k === 'tm' || sortKey(sort) !== k ? undefined : ascending ? 'ascending' : 'descending'}>
							{#if k === 'tm'}{label}{:else}<button class="sort" title="Sort by {label === '#' ? 'list order' : label}" on:click={() => sortBy(k)}
									>{label}<span class="arrow" class:invisible={sortKey(sort) !== k}>{ascending ? '▴' : '▾'}</span></button
								>{/if}
						</th>
					{/each}
					<th scope="col">Links</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as { h, i }, k (h.n)}
					{@const v = ov.get(i)}
					{@const sim = simulated(h)}
					<tr
						class="main"
						class:open={expanded.has(h.n)}
						class:more={k >= PHONE_ROWS && !allRows}
						on:click={(e) => {
							const t = e.target;
							if (t instanceof Element && !t.closest('a,button') && !getSelection()?.toString()) toggle(h.n);
						}}
					>
						<td data-label="#" class="num">
							<button
								class="exp"
								aria-expanded={expanded.has(h.n)}
								aria-controls="d{h.n}"
								title="Show details"
								on:click={() => toggle(h.n)}><span aria-hidden="true">{expanded.has(h.n) ? '▾' : '▸'}</span> <span class="sr-only">details for </span>{h.n}</button
							>
						</td>
						<td data-label="Machine">
							<code class="tm">{h.tm}</code>
							<button class="copy" on:click={() => copy(h.tm)} aria-label="Copy machine code {h.n}">{copied === h.tm ? 'copied' : copied === 'failed ' + h.tm ? 'select it to copy' : 'copy'}</button>
							<span class="muted block equiv" class:none={!h.aliases.length && !h.name && !h.tags.length}
								>{#if h.name}<span class="badge">{h.name}</span>{/if}{#each h.tags as t}<a class="tag" href={tagInfo[tagGroup(t)].url} rel="external" title={tagInfo[tagGroup(t)].help}>{t}</a>{/each}{#if h.aliases.length}+{h.aliases.length} equivalent machine{h.aliases.length === 1 ? '' : 's'}{:else if !h.name && !h.tags.length}&nbsp;{/if}</span
							>
							{#each h.notes.filter((x) => x.kind === 'community') as x}<span class="muted block whitespace-normal">{x.detail}</span>{/each}
						</td>
						<td data-label="Class">
							{#if h.class}
								{#if CLASS_WIKI[h.class]}<a class="link" href={WIKI + CLASS_WIKI[h.class]} rel="external">{h.class}</a>{:else if h.class === 'Unknown'}<span class="text-gray-400">Unknown</span>{:else}{h.class}{/if}
							{:else}<span class="muted">not classified</span>{/if}
							{#if h.conflicts.some((c) => c.kind === 'class')}<span class="warn" title={h.conflicts.filter((c) => c.kind === 'class').map((c) => c.detail).join('\n')}>⚠ sources disagree</span>{/if}
						</td>
						<td data-label="Proof status">
							{#if v.status === 'pr_open'}
								{#each v.prs.filter((p) => p.relation === 'proves' && p.state === 'open') as p}
									<a class="st st-pr_open" href={prUrl(p.number)} rel="external" title={p.title}>Proof in PR #{p.number}</a>
								{/each}
							{:else if v.status === 'solved' && proofLink(h, v)}
								<a class="st st-solved" href={proofLink(h, v)} rel="external" title="The merged proof">Proved</a>
							{:else if st.get(i) === 'sim_halt' && h.simulated_halt}
								<a class="st st-sim_halt" href={srcUrl(h.simulated_halt.source)} rel="external" title="{STATUS_HELP.sim_halt} {h.simulated_halt.detail}.">Simulated halt</a>
							{:else}
								<span class="st st-{v.status}" title={STATUS_HELP[v.status]}>{STATUS_LABEL[v.status]}</span>
							{/if}
							{#if h.conflicts.some((c) => c.kind !== 'class')}<span class="warn" title={h.conflicts.filter((c) => c.kind !== 'class').map((c) => c.detail).join('\n')}>⚠ sources disagree</span>{/if}
							{#if v.changed}<span class="muted block">changed since snapshot{v.via ? ` (${v.via})` : ''}</span>{/if}
						</td>
						<td data-label="Steps simulated">{#if sim}{sim.text}{:else}<span class="muted">unknown</span>{/if}</td>
						<td data-label="Links" class="links">
							<a class="link" href="/{h.tm}" rel="external">viewer</a>
							{#each h.wiki_pages as p}<a class="link" href={WIKI + encodeURIComponent(p)} rel="external" title="Wiki: {p}" aria-label="Wiki: {p}">wiki</a>{/each}
							{#if h.site_page}<a class="link" href={h.site_page} rel="external">page</a>{/if}
						</td>
					</tr>
					{#if expanded.has(h.n)}
						<tr class="detail" id="d{h.n}">
							<td colspan="6">
								<div class="flex flex-col lg:flex-row gap-6 py-2">
								<figure class="shrink-0">
									<canvas class="diagram" width="400" height="500" use:diagram={h.tm} aria-label="Space-time diagram of machine {h.n}" />
									<figcaption class="muted text-xs mt-1">First 10,000 steps from a blank tape · <a class="link" href="/{h.tm}" rel="external">open in viewer</a></figcaption>
								</figure>
								<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3 flex-1 content-start">
									<section>
										<h3>Classification, by source</h3>
										<ul>
											{#each h.classifications as c}
												<li>
													<strong>{c.class}</strong> — {sourceName[c.source]}{#if 'cell' in c && c.cell}, <a class="link" href={sheetCell(c.cell)} rel="external">cell {c.cell.ref}</a>{/if}
													{#if 'relation' in c && c.relation}<span class="muted block">for {c.machine} ({relText[c.relation]})</span>{/if}
												</li>
											{:else}<li class="muted">No source classifies it.</li>{/each}
										</ul>
										{#if h.conflicts.length}
											<h3 class="mt-2 !text-yellow-300">Where sources disagree</h3>
											<ul>{#each h.conflicts as c}<li>{c.detail}</li>{/each}</ul>
										{/if}
										{#if h.notes.some((c) => c.kind !== 'community')}
											<h3 class="mt-2">Notes</h3>
											<ul class="text-gray-300">{#each h.notes.filter((c) => c.kind !== 'community') as c}<li>{c.detail}</li>{/each}</ul>
										{/if}
									</section>
									<section>
										<h3>Status in other sources</h3>
										<ul>
											{#if h.simulated_halt}
												<li>
													<strong>Simulated halt</strong> ({h.simulated_halt.date}): {h.simulated_halt.detail}{#if simMachine(h.simulated_halt)}, for the equivalent {simMachine(h.simulated_halt)}{/if}
													(<a class="link" href={srcUrl(h.simulated_halt.source)} rel="external">details</a>). No Rocq proof yet.
												</li>
											{/if}
											<li>
												<strong>RobinCodes’s sheet</strong> ({data.sources.sheet.as_of}, built on the {data.sources.sheet.keyed_to_list}-machine list):
												{#if h.sheet?.status}status <strong>{h.sheet.status}</strong>{:else}no status{/if}{#if sheetMachine(h)}, for the equivalent {sheetMachine(h)}{/if}{#if h.sheet?.cell}{' '}(<a class="link" href={sheetCell(h.sheet.cell)} rel="external">row</a>){/if}.
											</li>
											{#if h.slugbird}
												<li>
													<strong>slugbird’s guide</strong> ({data.sources.slugbird.as_of}): tag “{h.slugbird.status}”{#if h.slugbird.pr},
														PR #{h.slugbird.pr}{/if}.
												</li>
											{/if}
										</ul>
										{#if v.prs.length}
											<h3 class="mt-2">busycoq pull requests</h3>
											<ul>
												{#each v.prs as p}
													<li>
														<a class="link" href={prUrl(p.number)} rel="external">#{p.number}</a>
														{p.state}, {p.relation === 'proves' ? 'contains a proof' : 'mentions it'} — <span class="muted">{p.title}</span> {#if author(p)}({author(p)}){/if}
													</li>
												{/each}
											</ul>
										{/if}
										{#if h.busycoq.solved_in.length || h.busycoq.mentioned_in.length}
											<h3 class="mt-2">busycoq files</h3>
											<ul>
												{#each h.busycoq.solved_in as f}
													<li><a class="link" href={fileUrl(f.file)} rel="external">{f.file}</a> <span class="muted">the proof</span></li>
												{/each}
												{#each h.busycoq.mentioned_in as f}
													<li>
														<a class="link" href={fileUrl(f.file)} rel="external">{f.file}</a>
														<span class="muted">{f.kind === 'equivalence' ? 'equivalence lemma' : 'no completed proof in the file'}</span>
													</li>
												{/each}
											</ul>
										{/if}
									</section>
									<section>
										<h3>Links</h3>
										<p class="links mb-3">
											<a class="link" href="https://fiery.pages.dev/turing/{h.tm}" rel="external">fiery</a>
											{#if h.sheet?.cell}<a class="link" href={sheetCell(h.sheet.cell)} rel="external">sheet row</a>{/if}
										</p>
										<h3>Equivalent machines</h3>
										{#if h.aliases.length}
											<ul class="font-mono text-xs">
												{#each h.aliases as a}
													<li>
														<a class="link" href="/{a.tm}" rel="external">{a.tm}</a>
														<span class="muted font-sans">{a.relation === 'equivalent' ? 'in the equivalence group' : a.relation}</span>
													</li>
												{/each}
											</ul>
										{:else}<p class="muted">None.</p>{/if}
										{#if h.discord.length}
											<h3 class="mt-2">Discord mentions</h3>
											<ul class="flex flex-wrap gap-x-4 gap-y-1 !space-y-0">
												{#each [...h.discord].reverse() as l}
													<li><a class="link" href={discordUrl(l)} rel="external">#{l.channel ?? 'channel'}, {l.date}</a></li>
												{/each}
											</ul>
										{/if}
									</section>
								</div>
								</div>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
		{#if rows.length > PHONE_ROWS && !allRows}
			<button class="link block mx-auto mt-2 lg:hidden" on:click={() => (allRows = true)}>Show all {rows.length} machines</button>
		{/if}

		<!-- decided since the base list -->
		{#if data.base_list}
			<details id="decided" class="mt-10 rounded-lg border border-gray-700/70 px-4 py-3 scroll-mt-4" bind:open={showDecided}>
				<summary class="cursor-pointer font-semibold py-1">
					{data.base_list.decided} machines decided since the
					{data.base_list.count}-machine list of {data.base_list.published}{#if q.trim() || cls}{' '}
						<span class="font-normal text-gray-400">· {decidedRows.length} match the search</span>{/if}
				</summary>
				<p class="text-gray-300 mt-2 mb-4 max-w-[80ch]">
					Machines on <a class="link" href={data.base_list.discord_url} rel="external">mxdys’s list of {data.base_list.published}</a>
					(<a class="link" href={data.base_list.file} rel="external">plain text</a>), which RobinCodes’s sheet is built on, that are
					no longer holdouts. <strong>Proved</strong>: busycoq has a proof for this machine.
					<strong>Equivalent</strong>: busycoq proves it equivalent to another machine that is decided. Halts / non-halting is the
					sheet’s note, where it has one.
				</p>
				{#if showDecided}
				<table class="bb6 decided w-full text-base">
					<caption class="sr-only">Decided since the {data.base_list.count}-machine list</caption>
					<colgroup><col class="c-num" /><col class="c-tm" /><col class="c-cls" /><col class="c-sim" /><col class="c-links" /></colgroup>
					<thead>
						<tr><th scope="col" title="Position in the {data.base_list.count}-machine list">#</th><th scope="col">Machine</th><th scope="col">Class</th><th scope="col">Decided by</th><th scope="col">Links</th></tr>
					</thead>
					<tbody>
						{#each decidedRows as d (d.n)}
							<tr>
								<td data-label="#" class="num text-gray-400 tabular-nums">{d.n}</td>
								<td data-label="Machine"><code class="tm">{d.tm}</code></td>
								<td data-label="Class">{#if d.class}{d.class}{:else}<span class="muted">not classified</span>{/if}</td>
								<td data-label="Decided by">
									{#if d.file}<a class="st st-solved" href={fileUrl(d.file)} rel="external" title={d.file}>{d.by === 'proof' ? 'Proved' : 'Equivalent'}</a>{/if}
									{#if d.verdict}<span class="muted ml-1">{d.verdict}</span>{/if}
								</td>
								<td data-label="Links" class="links">
									<a class="link" href="/{d.tm}" rel="external">viewer</a>
									{#if d.sheet_cell}<a class="link" href={sheetCell(d.sheet_cell)} rel="external">sheet row</a>{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
				{/if}
			</details>
		{/if}

		<!-- sources -->
		<section id="sources" class="mt-12 mb-16 max-w-[75ch] text-gray-200 leading-relaxed">
			<h2 class="text-2xl font-bold mb-3">Sources and credits</h2>
			<ul class="list-disc ml-6 space-y-2">
				<li>
					<strong>List and equivalence groups:</strong>
					<a class="link" href="https://github.com/ccz181078" rel="external">mxdys</a> (ccz181078): the
					<a class="link" href={data.list.discord_url} rel="external">list of {fmtDate(data.list.published)}</a> and its
					<a class="link" href={data.list.equivalence_file} rel="external">equivalence file</a>. Download the list as
					<a class="link" href="/BB6_holdouts_{data.list.count}.txt" rel="external">txt</a> or, with everything on this page,
					<a class="link" href="/bb6/holdouts.json" rel="external">JSON</a>. This site’s copy and the
					<a class="link" href="https://wiki.bbchallenge.org/wiki/Holdouts_lists" rel="external">wiki’s lists</a> are kept up
					to date by volunteers, including int-y1.
				</li>
				<li>
					<strong>Classes, status and simulation depth:</strong> RobinCodes’s
					<a class="link" href={data.sources.sheet.url} rel="external">annotated spreadsheet</a>
					({data.sources.sheet.as_of}, built on the {data.sources.sheet.keyed_to_list}-machine list and matched to today’s
					rows through the equivalence groups).
				</li>
				<li>
					<strong>Further classes, status tags and simulation figures:</strong> slugbird’s
					<a class="link" href={data.sources.slugbird.url} rel="external">BB(6) Holdout Guide</a>
					({data.sources.slugbird.as_of}).
				</li>
				<li>
					<strong>Proofs and pull requests:</strong>
					<a class="link" href="https://github.com/{data.busycoq.repo}" rel="external">busycoq</a>, branch <code>BB6</code>,
					read automatically; each row links the file or pull request it relies on.
				</li>
				<li>
					<strong>Discord links:</strong> messages in the
					<a class="link" href={data.sources.discord?.url} rel="external">bbchallenge Discord</a> that mention the machine or
					an equivalent one, since {data.sources.discord?.covers_from}.
				</li>
				<li>
					<strong>Names and tags:</strong> the wiki’s
					<a class="link" href={data.sources.wiki_bb6.url} rel="external">BB(6) Cryptids section</a> and
					<a class="link" href={data.sources.wiki_bmo.url} rel="external">Beaver Math Olympiad</a> page; the energy vampires
					from Thomas Reus’s <a class="link" href={data.sources.vampires.url} rel="external">family repository</a> and the
					<a class="link" href={data.sources.vampires.discussion} rel="external">Reus Vampires</a> thread on Discord.
				</li>
				<li><strong>Wiki pages:</strong> the <a class="link" href="https://wiki.bbchallenge.org" rel="external">bbchallenge wiki</a> contributors.</li>
			</ul>
			<p class="mt-2 text-gray-300">
				Working on a machine? Say so in <a class="link" href="https://discord.gg/wuZhtTvYU3" rel="external">#bb6 on Discord</a>.
			</p>
		</section>
	</div>
</div>

<style lang="postcss">
	.link {
		@apply text-white underline underline-offset-2 decoration-gray-500 cursor-pointer;
	}
	.link:hover {
		@apply decoration-white;
	}
	.field {
		@apply bg-gray-800/60 border border-gray-600 rounded-md px-3 h-10 text-sm text-gray-100 min-w-0;
	}
	.sep {
		@apply inline-block w-px h-4 mx-2 bg-gray-600;
	}
	/* the native arrow sits against the edge; draw our own with room on the right */
	select.field {
		appearance: none;
		padding-right: 2.5rem;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5l5 5 5-5' fill='none' stroke='%239ca3af' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.9rem center;
		text-overflow: ellipsis;
	}
	.field:focus-visible,
	button:focus-visible,
	a:focus-visible,
	input:focus-visible,
	select:focus-visible,
	summary:focus-visible {
		@apply outline outline-2 outline-offset-2 outline-blue-400;
	}
	.muted {
		@apply text-gray-400 text-xs;
	}
	.warn {
		@apply text-yellow-300 text-xs ml-1 whitespace-nowrap;
	}
	.badge {
		@apply mr-2 rounded-full bg-purple-900 text-purple-100 px-2 py-0.5 text-xs;
	}
	.tag {
		@apply inline-block mr-1.5 mb-1 rounded-full border border-purple-400/60 text-purple-100 px-2 py-0.5 text-xs whitespace-nowrap;
	}
	/* named machines are not tags: neutral, so the two rows read apart */
	.tag.named {
		@apply border-gray-500 text-gray-100;
	}
	.tag.named:hover,
	.tag.named.on {
		@apply border-gray-200 bg-gray-700/60;
	}
	.tag.on {
		@apply border-purple-200 bg-purple-900/60;
	}
	.bar {
		display: flex;
		gap: 2px;
		height: 12px;
		border-radius: 4px;
		overflow: hidden;
		max-width: 36rem;
	}
	.bar span {
		min-width: 4px;
	}
	.seg-pr_open {
		background: #3987e5;
	}
	.seg-sim_halt {
		background: #d6a23a;
	}
	.seg-open {
		background: #4b5563;
	}
	/* not part of the bar (it is off the count), so an outline rather than a fill */
	.seg-solved {
		border: 2px solid #3fa66b;
	}
	.legend {
		text-align: left;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		border-radius: 4px;
		padding: 0.1rem 0.3rem;
		margin-left: -0.3rem;
		color: #d1d5db;
	}
	.legend:hover {
		background: rgba(255, 255, 255, 0.06);
	}
	.legend.on {
		background: rgba(255, 255, 255, 0.1);
		color: #f9fafb;
	}
	.groups {
		display: grid;
		grid-template-columns: auto 1fr;
		column-gap: 1rem;
		row-gap: 0.25rem;
		align-items: baseline;
	}
	.groups dt {
		color: #9ca3af;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.groups dd {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		row-gap: 0.1rem;
	}
	.sw {
		width: 10px;
		height: 10px;
		border-radius: 2px;
		flex: none;
	}
	.tag:hover {
		@apply border-purple-200;
	}
	.st {
		@apply inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold border whitespace-nowrap;
	}
	a.st:hover,
	tr.main {
		cursor: pointer;
	}
	.st-open {
		@apply border-gray-500 text-gray-100;
	}
	.st-sim_halt {
		@apply border-amber-400 text-amber-200 bg-amber-950;
	}
	.st-pr_open {
		@apply border-blue-400 text-blue-200 bg-blue-950;
	}
	.st-solved {
		@apply border-green-400 text-green-200 bg-green-950;
	}
	code.tm {
		@apply break-all;
		font-size: min(0.85rem, 3.4vw); /* a whole machine code fits one line of a phone card */
	}
	.copy {
		@apply ml-2 text-xs text-gray-400 border border-gray-600 rounded-full px-2 py-0.5;
	}
	.copy:hover {
		@apply text-gray-100 border-gray-400;
	}
	.exp {
		@apply text-gray-100 tabular-nums py-1 pr-2 whitespace-nowrap;
	}
	.exp:hover {
		@apply text-white;
	}

	table.bb6 {
		border-collapse: collapse;
	}
	table.bb6 th {
		@apply text-left font-semibold text-white border-b border-gray-600 px-3 py-3 sticky top-0 bg-gray-900;
	}
	.sort {
		@apply font-semibold whitespace-nowrap;
	}
	.sort:hover {
		@apply text-blue-300;
	}
	.arrow {
		@apply ml-1 text-xs;
	}
	.diagram {
		@apply bg-black;
		width: 320px;
		max-width: 100%;
		height: auto;
		image-rendering: pixelated;
	}
	.detail h3 {
		@apply font-semibold text-gray-200 mb-2;
	}
	.detail ul {
		@apply space-y-2;
	}
	.links a + a {
		@apply ml-3;
	}

</style>
