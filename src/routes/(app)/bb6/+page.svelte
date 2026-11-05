<script lang="ts">
	import '$lib/bb6/table.css';
	import { onMount, onDestroy } from 'svelte';
	import SeoTitle from '$lib/seo_title.svelte';
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
	const wikiOf = (h: Holdout) => h.wiki_pages.find((p) => !TM_RE.test(p)) ?? h.wiki_pages[0];
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
		if (f.status !== 'all' && st !== f.status) return false;
		if (f.cls && !h.classifications.some((c) => c.class === f.cls)) return false;
		if (f.onlyWiki && !h.wiki_pages.length) return false;
		if (f.tag && !(f.tag === 'named' ? h.name : h.tags.some((t) => tagGroup(t) === f.tag))) return false;
		const typed = f.q.trim();
		const needle = typed.toLowerCase().replace(/^#/, '');
		if (!needle) return true;
		if (new RegExp(`^${TM_RE.source}$`).test(typed)) return keyIndex.get(canonicalKey(typed)!) === i; // any mirror/renaming/alias
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
		window.history.replaceState(window.history.state, '', s ? `?${s}` : window.location.pathname);
	}

	function clear() {
		q = '';
		cls = '';
		status = 'all';
		sort = 'list';
		rev = false;
		onlyWiki = false;
		tag = '';
	}
	function only(t: string) {
		clear();
		tag = t;
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
	// aria-sort says the real direction; the arrow is ▾ for a column's default order, ▴ once reversed
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
			/* clipboard blocked: the code is selectable text anyway */
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
		urlReady = true;
		check();
	});

	// where a "Proved" chip points: the proof file, else the merged pull request
	const proofLink = (h: Holdout, v: { prs: { number: number; state: string; relation: string }[] }) => {
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
		<h1 class="text-3xl font-bold mt-8 mb-4">BB(6) holdouts</h1>
		<p class="text-gray-200 text-base sm:text-lg mb-6 max-w-[70ch]">
			The 6-state, 2-symbol Turing machines whose halting status is still undecided, and so stand between us and the value
			of <a class="link" href="https://wiki.bbchallenge.org/wiki/BB(6)" rel="external">BB(6)</a>. For each one: its
			behavioural class, whether it has a Rocq proof in mxdys’s
			<a class="link" href="https://github.com/{data.busycoq.repo}/tree/{data.busycoq.branch}" rel="external">busycoq repository</a>,
			how far it has been simulated, its space-time diagram, and links to its spreadsheet row and Discord discussion.
		</p>

		<!-- numbers -->
		<p class="mb-3 text-base sm:text-lg" aria-live="polite">
			<strong>{holdouts.length}</strong> machines on
			<a class="link" href={data.list.discord_url} rel="external">mxdys’s list of {fmtDate(data.list.published)}</a>
			(<a class="link" href="/BB6_holdouts_{data.list.count}.txt" rel="external">plain text</a>,
			<a class="link" href="/bb6/holdouts.json" rel="external">JSON</a>)
		</p>
		<p class="flex flex-wrap gap-2 mb-2">
			{#each [['open', `${counts.open} with no proof`], ['sim_halt', `${counts.sim_halt} simulated to a halt`], ['pr_open', `${counts.pr_open} with a proof in an open PR`], ['solved', `${counts.solved} proved since the list`]] as [k, label]}
				<button class="st st-{k} chip" class:on={status === k} aria-pressed={status === k} title={status === k ? 'Show all' : 'Show only these'} on:click={() => (status = status === k ? 'all' : k)}>{label}</button>
			{/each}
		</p>

		<!-- live status -->
		<p class="text-sm text-gray-400 mb-6" role="status" aria-live="polite">
			{#if liveState === 'checking'}
				Checking busycoq for commits since the snapshot ({data.busycoq.head.sha.slice(0, 7)})…
			{:else if liveState === 'ok' && live}
				busycoq checked {new Date(live.checked_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ·
				{#if live.commits_ahead}
					<span class="text-gray-200">{live.commits_ahead} new commit{live.commits_ahead === 1 ? '' : 's'}</span>
					since {data.busycoq.head.sha.slice(0, 7)} (<a class="link" href={live.compare_url} rel="external">changes</a>),
					{changedCount} status{changedCount === 1 ? '' : 'es'} changed
				{:else}
					no new commits since {data.busycoq.head.sha.slice(0, 7)} ({fmtDate(data.busycoq.head.date)})
				{/if}
				{#each live.notes as n}<span class="block text-yellow-300">{n}</span>{/each}
			{:else}
				<span class="text-yellow-300">Live check unavailable</span> ({live?.error}); showing busycoq as of
				{fmtDate(data.busycoq.snapshot_fetched_at)} ({data.busycoq.head.sha.slice(0, 7)})
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

		<!-- intro -->
		<details class="mb-8 rounded-lg border border-gray-700/70 px-4 py-3">
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
						machine whose halting is equivalent to an open Collatz-like problem (e.g. <a class="link" href="/antihydra">Antihydra</a>);
						<a class="link" href="https://wiki.bbchallenge.org/wiki/Probvious" rel="external">probviously</a> halting or
						non-halting means probabilistic arguments say so, without a proof.
					</dd>
					<dt class="font-semibold">Proof status</dt>
					<dd>
						Whether busycoq, mxdys’s repository of Rocq proofs, decides the machine; a holdout leaves the list once its proof is merged.
						<strong>Proof in PR</strong>: a proof is in an unmerged pull request. <strong>Proved</strong>: merged since the
						list was published. <strong>Simulated halt</strong>: an accelerated simulation found a halt, with no Rocq proof
						yet.
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

		<!-- notable machines -->
		<section class="mb-8" aria-labelledby="notable">
			<h2 id="notable" class="text-xl font-bold mb-3">Notable holdouts</h2>
			<ul class="space-y-2 max-w-[90ch]">
				<li>
					<strong>Named:</strong>
					{#each named as h, k}{k ? ', ' : ''}<a class="link" href={h.site_page ?? WIKI + encodeURIComponent(wikiOf(h))} rel="external">{h.name}</a>
						<span class="muted">(#{h.n})</span>{/each}
				</li>
				{#each tagList as t}
					<li>
						<button class="tag" on:click={() => only(t)} title="Show only these">{t === 'BMO' ? 'Beaver Math Olympiad' : t}</button>
						<span class="text-gray-300">{tagCounts.get(t)} · {tagInfo[t].help}</span>
						(<a class="link" href={tagInfo[t].url} rel="external">{tagInfo[t].url.includes('github.com') ? 'family repository' : 'wiki'}</a>)
					</li>
				{/each}
			</ul>
		</section>

		<!-- controls -->
		<form id="table" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] items-end mb-4 scroll-mt-4" on:submit|preventDefault>
			<label class="flex flex-col gap-1 text-sm text-gray-400">
				Search
				<input
					type="search"
					bind:value={q}
					placeholder="#, machine code, class…"
					class="field"
					autocomplete="off"
					spellcheck="false"
				/>
			</label>
			<label class="flex flex-col gap-1 text-sm text-gray-400">
				Class
				<select bind:value={cls} class="field">
					<option value="">All classes</option>
					{#each classes as c}<option value={c}>{c}</option>{/each}
				</select>
			</label>
			<label class="flex flex-col gap-1 text-sm text-gray-400">
				Tag
				<select bind:value={tag} class="field">
					<option value="">Any</option>
					<option value="named">Named</option>
					{#each tagList as t}<option value={t}>{t === 'BMO' ? 'Beaver Math Olympiad' : t}</option>{/each}
				</select>
			</label>
			<label class="flex flex-col gap-1 text-sm text-gray-400">
				Proof status
				<select bind:value={status} class="field">
					<option value="all">All</option>
					<option value="open">No proof</option>
					<option value="sim_halt">Simulated halt</option>
					<option value="pr_open">Proof in PR</option>
					<option value="solved">Proved</option>
				</select>
			</label>
			<label class="flex flex-col gap-1 text-sm text-gray-400">
				Sort by
				<select bind:value={sort} on:change={() => (rev = false)} class="field">
					<option value="list">List order</option>
					<option value="class">Class</option>
					<option value="status">Status (no proof first)</option>
					<option value="sim">Steps simulated, most first</option>
					<option value="sim-asc">Steps simulated, fewest first</option>
				</select>
			</label>
			<div class="flex items-center gap-x-5 gap-y-2 text-sm flex-wrap py-2">
				<label class="flex items-center gap-2"><input type="checkbox" bind:checked={onlyWiki} /> has wiki page</label>
				<button type="button" class="link" on:click={clear}>clear</button>
			</div>
		</form>
		<p class="text-sm text-gray-400 mb-3" aria-live="polite">
			{rows.length} of {holdouts.length} machines.
			{#if rows.length === 0}No machine matches. <button class="link" on:click={clear}>Clear the filters</button>.{/if}
		</p>

		<!-- table -->
		<table class="bb6 w-full text-base">
			<caption class="sr-only">BB(6) holdouts</caption>
			<colgroup><col class="c-num" /><col class="c-tm" /><col class="c-cls" /><col class="c-st" /><col class="c-sim" /><col class="c-links" /></colgroup>
			<thead>
				<tr>
					{#each [['list', '#'], ['tm', 'Machine'], ['class', 'Class'], ['status', 'Proof status'], ['sim', 'Steps simulated']] as [k, label]}
						<th scope="col" aria-sort={k === 'tm' || sortKey(sort) !== k ? undefined : ascending ? 'ascending' : 'descending'}>
							{#if k === 'tm'}{label}{:else}<button class="sort" title="Sort by {label === '#' ? 'list order' : label}" on:click={() => sortBy(k)}
									>{label}<span class="arrow" class:invisible={sortKey(sort) !== k}>{rev || sort === 'sim-asc' ? '▴' : '▾'}</span></button
								>{/if}
						</th>
					{/each}
					<th scope="col">Links</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as { h, i } (h.n)}
					{@const v = ov.get(i)}
					{@const sim = simulated(h)}
					<tr
						class="main"
						class:open={expanded.has(h.n)}
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
							<code class="tm select-all">{h.tm}</code>
							<button class="copy" on:click={() => copy(h.tm)} aria-label="Copy machine code {h.n}">{copied === h.tm ? 'copied' : 'copy'}</button>
							<span class="muted block equiv" class:none={!h.aliases.length && !h.name && !h.tags.length}
								>{#if h.name}<span class="badge">{h.name}</span>{/if}{#each h.tags as t}<a class="tag" href={tagInfo[tagGroup(t)].url} rel="external" title={tagInfo[tagGroup(t)].help}>{t}</a>{/each}{#if h.aliases.length}+{h.aliases.length} equivalent machine{h.aliases.length === 1 ? '' : 's'}{:else if !h.name && !h.tags.length}&nbsp;{/if}</span
							>
							{#each h.notes.filter((x) => x.kind === 'community') as x}<span class="muted block">{x.detail}</span>{/each}
						</td>
						<td data-label="Class">
							{#if h.class}
								{#if CLASS_WIKI[h.class]}<a class="link" href={WIKI + CLASS_WIKI[h.class]} rel="external">{h.class}</a>{:else if h.class === 'Unknown'}<span class="text-gray-400">Unknown</span>{:else}{h.class}{/if}
							{:else}<span class="muted">none</span>{/if}
							{#if h.conflicts.length}<span class="warn" title={h.conflicts.map((c) => c.detail).join('\n')}>⚠ sources disagree</span>{/if}
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
							{#if v.changed}<span class="muted block">changed since snapshot{v.via ? ` (${v.via})` : ''}</span>{/if}
						</td>
						<td data-label="Steps simulated">{#if sim}{sim.text}{:else}<span class="muted">unknown</span>{/if}</td>
						<td data-label="Links" class="links">
							<a class="link" href="/{h.tm}" rel="external">viewer</a>
							{#each h.wiki_pages as p}<a class="link" href={WIKI + encodeURIComponent(p)} rel="external">wiki</a>{/each}
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
													<strong>Simulated halt</strong> ({h.simulated_halt.date}): {h.simulated_halt.detail}{#if h.simulated_halt.machine}, for the equivalent {h.simulated_halt.machine}{/if}
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
										{#if h.busycoq.mentioned_in.length}
											<h3 class="mt-2">Mentioned in busycoq, not proved there</h3>
											<ul>
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

		<!-- sources -->
		<section id="sources" class="mt-12 mb-16 max-w-[75ch] text-gray-200 leading-relaxed">
			<h2 class="text-2xl font-bold mb-3">Sources and credits</h2>
			<ul class="list-disc ml-6 space-y-2">
				<li>
					<strong>List and equivalence groups:</strong>
					<a class="link" href="https://github.com/ccz181078" rel="external">mxdys</a> (ccz181078): the
					<a class="link" href={data.list.discord_url} rel="external">list of {fmtDate(data.list.published)}</a> and its
					<a class="link" href={data.list.equivalence_file} rel="external">equivalence file</a>. This site’s copy and the
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
		@apply bg-gray-800/60 border border-gray-600 rounded-md px-3 py-2 text-base text-gray-100 w-full;
	}
	.field:focus-visible,
	button:focus-visible,
	a:focus-visible,
	input:focus-visible,
	select:focus-visible,
	summary:focus-visible {
		@apply outline outline-2 outline-offset-2 outline-blue-400;
	}
	.btn {
		@apply border border-gray-600 rounded-md px-4 py-2 mx-1;
	}
	.btn:hover {
		@apply bg-gray-800;
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
	.tag:hover {
		@apply border-purple-200;
	}
	.st {
		@apply inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold border whitespace-nowrap;
	}
	a.st:hover,
	.chip:hover {
		filter: brightness(1.3);
	}
	.chip.on {
		@apply ring-2 ring-gray-200;
	}
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
		@apply text-[0.85rem] break-all;
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
	table.bb6 td {
		@apply px-3 py-3 align-top border-b border-gray-800;
	}
	table.bb6 tr.open > td {
		@apply bg-gray-800/40;
	}
	table.bb6 tr.detail > td {
		@apply bg-gray-800/40 border-b border-gray-700 px-4 py-4;
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
