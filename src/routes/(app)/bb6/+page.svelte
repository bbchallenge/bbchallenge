<script lang="ts">
	import '$lib/bb6/table.css';
	import { onMount, onDestroy } from 'svelte';
	import SeoTitle from '$lib/seo_title.svelte';
	import data from '../../../../static/bb6/holdouts.json';
	import { canonicalKey, TM_RE } from '$lib/bb6/tm_key.js';
	import { fetchLive, overlay } from '$lib/bb6/busycoq_live.js';
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

	// ---- live overlay -------------------------------------------------------------------------
	let live: any = null;
	let liveState: 'checking' | 'ok' | 'failed' = 'checking';
	let cooling = false; // "check again" may be used once a minute
	let coolTimer: ReturnType<typeof setTimeout> | undefined;
	async function check(force = false) {
		liveState = 'checking';
		live = await fetchLive(data, { force });
		liveState = live.ok ? 'ok' : 'failed';
	}
	$: ov = overlay(data, live);

	// ---- search, filter, sort ---------------------------------------------------------------
	let q = '';
	let cls = '';
	let status = 'all';
	let sort = 'list';
	let onlyConflicts = false;
	let onlyWiki = false;
	let shown = 100;
	let expanded = new Set<number>();
	let urlReady = false;

	const classes = [...new Set(holdouts.map((h) => h.class).filter(Boolean) as string[])].sort();
	const keyIndex = new Map<string, number>();
	holdouts.forEach((h, i) => {
		keyIndex.set(canonicalKey(h.tm)!, i);
		for (const a of h.aliases) keyIndex.set(canonicalKey(a.tm)!, i);
	});
	const haystack = holdouts.map((h) =>
		[h.n, h.tm, ...h.aliases.map((a) => a.tm), h.name ?? '', h.class ?? '', ...h.classifications.map((c) => c.class)].join(' ').toLowerCase()
	);

	function simulated(h: Holdout): { text: string; log: number } | null {
		const s = h.slugbird?.simulated ? log10Of(h.slugbird.simulated) : null;
		const k = h.sheet?.simulated_log10_min ?? null;
		if (s !== null && (k === null || s >= k)) return { text: `${h.slugbird!.simulated}`, log: s };
		if (k !== null) return { text: `≥ 1e${k}`, log: k };
		return null;
	}

	type Filters = { q: string; cls: string; status: string; onlyConflicts: boolean; onlyWiki: boolean };
	// Svelte only tracks variables named inside the `$:` statement, so the filters are passed in explicitly.
	function matches(h: Holdout, i: number, f: Filters, st: string): boolean {
		if (f.status !== 'all' && st !== f.status) return false;
		if (f.cls && !h.classifications.some((c) => c.class === f.cls)) return false;
		if (f.onlyConflicts && !h.conflicts.length) return false;
		if (f.onlyWiki && !h.wiki_pages.length) return false;
		const typed = f.q.trim();
		const needle = typed.toLowerCase().replace(/^#/, '');
		if (!needle) return true;
		if (new RegExp(`^${TM_RE.source}$`).test(typed)) return keyIndex.get(canonicalKey(typed)!) === i; // any mirror/renaming/alias
		if (/^\d+$/.test(needle)) return String(h.n) === needle;
		return haystack[i].includes(needle);
	}

	$: rows = holdouts
		.map((h, i) => ({ h, i }))
		.filter(({ h, i }) => matches(h, i, { q, cls, status, onlyConflicts, onlyWiki }, ov.get(i)!.status))
		.sort((a, b) => {
			switch (sort) {
				case 'class':
					return (a.h.class ?? '~').localeCompare(b.h.class ?? '~') || a.h.n - b.h.n;
				case 'status':
					return STATUS_ORDER[ov.get(a.i)!.status] - STATUS_ORDER[ov.get(b.i)!.status] || a.h.n - b.h.n;
				case 'sim':
					return (simulated(b.h)?.log ?? -1) - (simulated(a.h)?.log ?? -1) || a.h.n - b.h.n;
				case 'sim-asc':
					return (simulated(a.h)?.log ?? 1e9) - (simulated(b.h)?.log ?? 1e9) || a.h.n - b.h.n;
				default:
					return a.h.n - b.h.n;
			}
		});
	$: counts = (() => {
		const c = { open: 0, pr_open: 0, solved: 0 };
		for (const v of ov.values()) c[v.status]++;
		return c;
	})();
	// reset paging when the filter changes
	$: (q, cls, status, sort, onlyConflicts, onlyWiki), (shown = 100);

	// keep the filters in the URL so a view can be shared
	$: if (urlReady && typeof window !== 'undefined') {
		const p = new URLSearchParams();
		if (q) p.set('q', q);
		if (cls) p.set('class', cls);
		if (status !== 'all') p.set('status', status);
		if (sort !== 'list') p.set('sort', sort);
		if (onlyConflicts) p.set('conflicts', '1');
		if (onlyWiki) p.set('wiki', '1');
		const s = p.toString();
		window.history.replaceState(window.history.state, '', s ? `?${s}` : window.location.pathname);
	}

	function clear() {
		q = '';
		cls = '';
		status = 'all';
		sort = 'list';
		onlyConflicts = onlyWiki = false;
	}
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
		onlyConflicts = p.get('conflicts') === '1';
		onlyWiki = p.get('wiki') === '1';
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
	<div class="max-w-[1600px] mx-auto px-0 sm:px-4 lg:px-6 font-sans text-gray-100 leading-relaxed">
		<h1 class="text-3xl font-bold mt-8 mb-4">BB(6) holdouts</h1>
		<p class="text-gray-200 text-base sm:text-lg mb-6 max-w-[70ch]">
			The 6-state, 2-symbol Turing machines whose halting status is still undecided, and so stand between us and the value
			of <a class="link" href="https://wiki.bbchallenge.org/wiki/BB(6)" rel="external">BB(6)</a>. For each one: its
			behavioural class, whether
			<a class="link" href="https://github.com/{data.busycoq.repo}/tree/{data.busycoq.branch}" rel="external">busycoq</a>
			has a proof, how far it has been simulated, and links to its space-time diagram, spreadsheet row and Discord discussion.
		</p>

		<!-- numbers -->
		<p class="mb-3 text-base sm:text-lg" aria-live="polite">
			<strong>{holdouts.length}</strong> machines on
			<a class="link" href={data.list.discord_url} rel="external">mxdys’s list of {fmtDate(data.list.published)}</a>
			(<a class="link" href="/BB6_holdouts_{data.list.count}.txt" rel="external">plain text</a>,
			<a class="link" href="/bb6/holdouts.json" rel="external">JSON</a>)
		</p>
		<p class="flex flex-wrap gap-2 mb-6">
			<span class="st st-open">{counts.open} with no proof</span>
			<span class="st st-pr_open">{counts.pr_open} with a proof in an open PR</span>
			<span class="st st-solved">{counts.solved} proved since the list</span>
		</p>

		<!-- live status -->
		<div class="rounded-lg border border-gray-700/70 bg-gray-800/40 px-4 py-3 text-sm leading-relaxed mb-6" role="status" aria-live="polite">
			{#if liveState === 'checking'}
				Checking busycoq on GitHub for commits since the snapshot…
			{:else if liveState === 'ok' && live}
				<span class="text-green-300 font-semibold">Live.</span>
				busycoq <code>BB6</code> checked {new Date(live.checked_at).toLocaleTimeString()}{live.cached ? ' (from the last 10 minutes)' : ''}:
				{#if live.commits_ahead}
					{live.commits_ahead} new commit{live.commits_ahead === 1 ? '' : 's'} since the snapshot
					(<a class="link" href={live.compare_url} rel="external">changes</a>);
					{[...ov.values()].filter((v) => v.changed).length} holdout status{[...ov.values()].filter((v) => v.changed).length === 1 ? '' : 'es'} changed.
				{:else}
					the branch has not moved since the snapshot ({data.busycoq.head.sha.slice(0, 7)}).
				{/if}
				{#each live.notes as n}<span class="block text-yellow-300">{n}</span>{/each}
			{:else}
				<span class="text-yellow-300 font-semibold">Live check unavailable</span> ({live?.error}). Showing the snapshot of
				{fmtDate(data.busycoq.snapshot_fetched_at)} (busycoq <code>{data.busycoq.head.sha.slice(0, 7)}</code>), which may be out of date.
			{/if}
			<button
				class="ml-2 link disabled:opacity-50 disabled:no-underline"
				disabled={liveState === 'checking' || cooling}
				on:click={() => {
					cooling = true;
					clearTimeout(coolTimer);
					coolTimer = setTimeout(() => (cooling = false), 60_000);
					check(true);
				}}>check again</button
			>
			<span class="block text-gray-400 text-xs mt-2">
				Snapshot: busycoq <code>{data.busycoq.head.sha.slice(0, 7)}</code> ({fmtDate(data.busycoq.head.date)}), {data.busycoq.prs_url.includes('pulls') ? 'pull requests' : ''} as of
				{fmtDate(data.busycoq.snapshot_fetched_at)}. Updates are fetched in the browser from the GitHub API (unauthenticated, a few requests per visit).
			</span>
		</div>

		<!-- intro -->
		<details class="mb-8 rounded-lg border border-gray-700/70 px-4 py-3">
			<summary class="cursor-pointer font-semibold py-1">Background and notation</summary>
			<div class="mt-3 space-y-3 text-gray-200 max-w-[75ch]">
				<p>
					BB(6) is settled once every 6-state, 2-symbol machine in
					<a class="link" href="https://wiki.bbchallenge.org/wiki/Tree_Normal_Form" rel="external">Tree Normal Form</a>
					is shown to halt or run forever from a blank tape. The
					<a class="link" href="https://wiki.bbchallenge.org/wiki/Holdouts_lists" rel="external">holdouts</a> are the
					machines still undecided. mxdys maintains the official list and posts updates in
					<a class="link" href="https://discord.gg/wuZhtTvYU3" rel="external">#bb6 on Discord</a>. Each row is an
					equivalence class (mirror images, state permutations and mxdys’s equivalence groups); a proof for any member
					settles it.
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
					<dt class="font-semibold">Cryptid</dt>
					<dd>
						A machine whose halting is equivalent to an open Collatz-type problem
						(<a class="link" href="https://wiki.bbchallenge.org/wiki/Cryptids" rel="external">Cryptids</a>, e.g.
						<a class="link" href="/antihydra">Antihydra</a>).
					</dd>
					<dt class="font-semibold">busycoq</dt>
					<dd>
						mxdys’s repository of Rocq proofs; a holdout leaves the list once its proof is merged.
						<strong>Proof in PR</strong>: a proof is in an unmerged pull request. <strong>Proved</strong>: merged since the
						list was published.
					</dd>
					<dt class="font-semibold">Simulated</dt>
					<dd>Steps simulated without halting, i.e. a lower bound on the running time if it halts.</dd>
					<dt class="font-semibold">Tools</dt>
					<dd>
						<strong>viewer</strong> (this site) and
						<a class="link" href="https://fiery.pages.dev/turing" rel="external">fiery</a> draw space-time diagrams;
						<a class="link" href="https://ccz181078.github.io/TM/LongAcc/index.html" rel="external">LongAcc</a> takes a pasted
						machine code.
					</dd>
				</dl>
			</div>
		</details>

		<!-- controls -->
		<form class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] items-end mb-4" on:submit|preventDefault>
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
				busycoq status
				<select bind:value={status} class="field">
					<option value="all">All</option>
					<option value="open">No proof</option>
					<option value="pr_open">Proof in PR</option>
					<option value="solved">Proved</option>
				</select>
			</label>
			<label class="flex flex-col gap-1 text-sm text-gray-400">
				Sort by
				<select bind:value={sort} class="field">
					<option value="list">List order</option>
					<option value="class">Class</option>
					<option value="status">Status (no proof first)</option>
					<option value="sim">Simulated, furthest first</option>
					<option value="sim-asc">Simulated, least first</option>
				</select>
			</label>
			<div class="flex items-center gap-x-5 gap-y-2 text-sm flex-wrap py-2">
				<label class="flex items-center gap-2"><input type="checkbox" bind:checked={onlyConflicts} /> sources disagree</label>
				<label class="flex items-center gap-2"><input type="checkbox" bind:checked={onlyWiki} /> has wiki page</label>
				<button type="button" class="link" on:click={clear}>clear</button>
			</div>
		</form>
		<p class="text-sm text-gray-400 mb-3" aria-live="polite">
			{rows.length} of {holdouts.length} machines{rows.length > shown ? `, showing the first ${shown}` : ''}.
			{#if rows.length === 0}No machine matches. <button class="link" on:click={clear}>Clear the filters</button>.{/if}
		</p>

		<!-- table -->
		<table class="bb6 w-full text-base">
			<caption class="sr-only">BB(6) holdouts</caption>
			<colgroup><col class="c-num" /><col class="c-tm" /><col /><col class="c-st" /><col class="c-sim" /><col class="c-links" /></colgroup>
			<thead>
				<tr>
					<th scope="col">#</th>
					<th scope="col">Machine</th>
					<th scope="col">Class</th>
					<th scope="col">busycoq</th>
					<th scope="col">Simulated</th>
					<th scope="col">Links</th>
				</tr>
			</thead>
			<tbody>
				{#each rows.slice(0, shown) as { h, i } (h.n)}
					{@const v = ov.get(i)}
					{@const sim = simulated(h)}
					<tr class:open={expanded.has(h.n)}>
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
							<span class="muted block equiv" class:none={!h.aliases.length && !h.name}
								>{#if h.name}<span class="badge">{h.name}</span>{/if}{#if h.aliases.length}+{h.aliases.length} equivalent machine{h.aliases.length === 1 ? '' : 's'}{:else if !h.name}&nbsp;{/if}</span
							>
						</td>
						<td data-label="Class">
							{#if h.class}
								{#if CLASS_WIKI[h.class]}<a class="link" href={WIKI + CLASS_WIKI[h.class]} rel="external">{h.class}</a>{:else}{h.class}{/if}
							{:else}<span class="muted">none</span>{/if}
							{#if h.conflicts.length}<span class="warn" title={h.conflicts.map((c) => c.detail).join('\n')}>⚠ sources disagree</span>{/if}
						</td>
						<td data-label="busycoq">
							{#if v.status === 'pr_open'}
								{#each v.prs.filter((p) => p.relation === 'proves' && p.state === 'open') as p}
									<a class="st st-pr_open" href={prUrl(p.number)} rel="external" title={p.title}>Proof in PR #{p.number}</a>
								{/each}
							{:else if v.status === 'solved' && proofLink(h, v)}
								<a class="st st-solved" href={proofLink(h, v)} rel="external" title="The merged proof">Proved</a>
							{:else}
								<span class="st st-{v.status}" title={STATUS_HELP[v.status]}>{STATUS_LABEL[v.status]}</span>
							{/if}
							{#if v.changed}<span class="muted block">changed since snapshot{v.via ? ` (${v.via})` : ''}</span>{/if}
						</td>
						<td data-label="Simulated">{#if sim}{sim.text}{:else}<span class="muted">unknown</span>{/if}</td>
						<td data-label="Links" class="links">
							<a class="link" href="/{h.tm}" rel="external">viewer</a>
							<a class="link" href="https://fiery.pages.dev/turing/{h.tm}" rel="external">fiery</a>
							{#each h.wiki_pages as p}<a class="link" href={WIKI + encodeURIComponent(p)} rel="external">wiki</a>{/each}
							{#if h.site_page}<a class="link" href={h.site_page} rel="external">page</a>{/if}
							{#if h.sheet?.cell}<a class="link" href={sheetCell(h.sheet.cell)} rel="external">sheet</a>{/if}
							{#if h.discord.length}<a
									class="link"
									href={discordUrl(h.discord[h.discord.length - 1])}
									rel="external"
									title="Latest of {h.discord.length} Discord message{h.discord.length === 1 ? '' : 's'} mentioning it or an equivalent machine ({h.discord[h.discord.length - 1].date})"
									>discord<span class="sr-only"> ({h.discord.length} messages)</span><span aria-hidden="true">·{h.discord.length}</span></a
								>{/if}
						</td>
					</tr>
					{#if expanded.has(h.n)}
						<tr class="detail" id="d{h.n}">
							<td colspan="6">
								<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3 py-2">
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
										{#if h.notes.length}
											<h3 class="mt-2">Notes</h3>
											<ul class="text-gray-300">{#each h.notes as c}<li>{c.detail}</li>{/each}</ul>
										{/if}
									</section>
									<section>
										<h3>Status in other sources</h3>
										<ul>
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
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
		{#if rows.length > shown}
			<p class="my-6 text-center">
				<button class="btn" on:click={() => (shown += 200)}>Show {Math.min(200, rows.length - shown)} more</button>
				<button class="btn" on:click={() => (shown = rows.length)}>Show all {rows.length}</button>
			</p>
		{/if}

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
	.st {
		@apply inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold border whitespace-nowrap;
	}
	a.st:hover {
		filter: brightness(1.3);
	}
	.st-open {
		@apply border-gray-500 text-gray-100;
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
	table.bb6 td {
		@apply px-3 py-4 align-top border-b border-gray-800;
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
