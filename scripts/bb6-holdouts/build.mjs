#!/usr/bin/env node
// Merge every source snapshot into static/bb6/holdouts.json (the file the /bb6 page and scripts read).
// Offline and deterministic: the same inputs always give the same bytes.
//
//   node scripts/bb6-holdouts/build.mjs          write static/bb6/holdouts.json
//   node scripts/bb6-holdouts/build.mjs --check  exit 1 if the file on disk is out of date
//
// Inputs (data/bb6/sources/): list.json + the list in static/ + the equivalence groups,
// sheet.json, slugbird.json, busycoq.json, wiki.json, names.json. See docs/bb6-holdouts.md.
import fs from 'node:fs';
import { canonicalKey } from '../../src/lib/bb6/tm_key.js';
import { isEqvFile } from '../../src/lib/bb6/busycoq_rules.js';
import { SOURCES, ROOT, loadHoldouts, readJSON, relation } from './common.mjs';

export const SCHEMA_VERSION = 1;
const SITE = 'https://bbchallenge.org';
const rd = (name) => readJSON(new URL(name, SOURCES));

const meta = rd('list.json');
const { list, groups, holdoutOfKey } = loadHoldouts(
	new URL(meta.list_file, ROOT),
	new URL(meta.eqv_file, ROOT)
);
const sheet = rd('sheet.json');
const slug = rd('slugbird.json');
const busycoq = rd('busycoq.json');
const wiki = rd('wiki.json');
const names = rd('names.json');

/** @type {Map<number, any>} */
const rows = new Map(list.map((tm, i) => [i, { tm }]));
const rowOfCode = (code) => holdoutOfKey.get(canonicalKey(code));

// ---- per-holdout accumulators ------------------------------------------------------------
const acc = list.map(() => ({
	classifications: [],
	sheet: null,
	slugbird: null,
	solved_in: [],
	mentioned_in: [],
	prs: new Map()
}));

// sheet (keyed to the 1534 list: map each of its machines onto today's holdout through the equivalence groups)
const sheetCodes = new Set([...Object.keys(sheet.classifications), ...Object.keys(sheet.results)]);
for (const code of [...sheetCodes].sort()) {
	const i = rowOfCode(code);
	if (i === undefined) continue; // not (any more) one of the 608
	const rel = relation(code, list[i]);
	const c = sheet.classifications[code];
	const r = sheet.results[code];
	const cls = c ?? (r?.class ? { class: r.class, cell: r.cell, tab: 'results' } : null);
	if (cls) {
		acc[i].classifications.push({
			source: 'sheet',
			class: cls.class,
			...(rel === 'exact' ? {} : { machine: code, relation: rel }),
			cell: { tab: c ? 'classifications' : 'results', ref: cls.cell }
		});
	}
	if (rel !== 'equivalent') {
		// A status or a simulation depth describes one machine, so only take it from the same machine (or its mirror).
		const s = {
			status: r?.status || null,
			simulated_log10_min: sheet.simulated[code]?.log10_min ?? null,
			...(rel === 'exact' ? {} : { machine: code }),
			cell: r ? { tab: 'results', ref: r.cell } : null
		};
		if (!acc[i].sheet || (r && !acc[i].sheet.cell)) acc[i].sheet = s;
	}
}

// slugbird
for (const [code, s] of Object.entries(slug.machines)) {
	const i = rowOfCode(code);
	if (i === undefined) continue;
	const rel = relation(code, list[i]);
	acc[i].classifications.push({
		source: 'slugbird',
		class: s.class,
		...(rel === 'exact' ? {} : { machine: code, relation: rel })
	});
	acc[i].slugbird = { status: s.status, pr: s.pr, simulated: s.simulated };
}

// busycoq: files
const head = busycoq.head.sha;
for (const [key, hits] of Object.entries(busycoq.hits)) {
	const i = holdoutOfKey.get(key);
	if (i === undefined) continue;
	for (const h of hits) {
		const bucket = h.final && !isEqvFile(h.file) ? acc[i].solved_in : acc[i].mentioned_in;
		const kind = isEqvFile(h.file) ? 'equivalence' : 'no-final-theorem';
		let e = bucket.find((x) => x.file === h.file);
		if (!e)
			bucket.push((e = bucket === acc[i].solved_in ? { file: h.file } : { file: h.file, kind }));
		if (h.as !== list[i]) (e.machines ??= []).push(h.as);
	}
}
// busycoq: pull requests
for (const pr of busycoq.prs) {
	const base = { number: pr.number, title: pr.title, author: pr.author, state: pr.state };
	for (const [key, files] of Object.entries(pr.covers)) {
		const i = holdoutOfKey.get(key);
		if (i !== undefined) acc[i].prs.set(pr.number, { ...base, relation: 'proves', files });
	}
	for (const key of [...Object.keys(pr.mentions), ...pr.mentioned_in_text]) {
		const i = holdoutOfKey.get(key);
		if (i !== undefined && !acc[i].prs.has(pr.number))
			acc[i].prs.set(pr.number, { ...base, relation: 'mentions', files: pr.mentions[key] ?? [] });
	}
}

// ---- rows ---------------------------------------------------------------------------------
const holdouts = list.map((tm, i) => {
	const a = acc[i];
	const prs = [...a.prs.values()].sort((x, y) => y.number - x.number);
	const open = prs.filter((p) => p.relation === 'proves' && p.state === 'open');
	const mergedPR = prs.filter((p) => p.relation === 'proves' && p.state === 'merged');
	const status =
		a.solved_in.length || mergedPR.length ? 'solved' : open.length ? 'pr_open' : 'open';

	const classes = a.classifications;
	const distinct = [...new Set(classes.map((c) => c.class).filter((c) => c && c !== 'Unknown'))];
	const sheetClass = classes.find((c) => c.source === 'sheet');
	const primary = (sheetClass ?? classes[0])?.class ?? null;
	const wikiPages = new Set();
	for (const m of groups[i]) for (const t of wiki.pages[canonicalKey(m)] ?? []) wikiPages.add(t);
	const named = names[tm];
	const conflicts = [];
	if (distinct.length > 1)
		conflicts.push({ kind: 'class', detail: `sources disagree: ${distinct.join(' / ')}` });
	const sh = a.sheet;
	if (sh && ['HALT', 'NONHALT'].includes(sh.status) && status === 'open')
		conflicts.push({
			kind: 'sheet-status',
			detail: `the sheet marks it ${sh.status}, but it is on the official list and busycoq has no proof`
		});
	if (a.slugbird?.pr && !prs.some((p) => p.number === a.slugbird.pr && p.relation === 'proves'))
		conflicts.push({
			kind: 'slugbird-pr',
			detail: `slugbird's guide points to PR #${a.slugbird.pr}, but that PR's files do not contain a completed proof of it`
		});
	if (a.slugbird?.status === 'pr' && !open.length && status !== 'solved')
		conflicts.push({
			kind: 'slugbird-status',
			detail: "slugbird's guide lists an open PR, but no open PR contains a proof of it"
		});
	if (status === 'pr_open' && a.slugbird && a.slugbird.status !== 'pr')
		conflicts.push({
			kind: 'slugbird-status',
			detail: `busycoq has an open PR for it (#${open
				.map((p) => p.number)
				.join(', #')}); slugbird's guide (${slug.as_of}) says: ${
				slug.status_labels[a.slugbird.status] ?? a.slugbird.status
			}`
		});
	if (sh?.status === 'CRYPTID' && a.slugbird && a.slugbird.status !== 'cryptid')
		conflicts.push({
			kind: 'cryptid',
			detail: `the sheet marks it CRYPTID; slugbird's guide says: ${
				slug.status_labels[a.slugbird.status] ?? a.slugbird.status
			}`
		});
	if (a.slugbird?.status === 'cryptid' && sh && sh.status !== 'CRYPTID')
		conflicts.push({
			kind: 'cryptid',
			detail: "slugbird's guide says cryptid; the sheet does not"
		});
	return {
		n: i + 1,
		tm,
		name: named?.name ?? null,
		aliases: groups[i].filter((m) => m !== tm).map((m) => ({ tm: m, relation: relation(m, tm) })),
		class: primary,
		classifications: classes,
		sheet: a.sheet,
		slugbird: a.slugbird,
		busycoq: { status, solved_in: a.solved_in, prs, mentioned_in: a.mentioned_in },
		wiki_pages: [...wikiPages].sort(),
		...(named?.page ? { site_page: named.page } : {}),
		conflicts
	};
});

const countBy = (f) => holdouts.reduce((m, h) => ((m[f(h)] = (m[f(h)] ?? 0) + 1), m), {});
const out = {
	schema_version: SCHEMA_VERSION,
	generated_at: [busycoq.fetched_at, wiki.fetched_at].sort().at(-1),
	list: {
		count: list.length,
		published: meta.published,
		published_by: meta.published_by,
		discord_url: meta.published_at,
		file: `${SITE}/${meta.list_file.replace(/^static\//, '')}`,
		equivalence_file: meta.eqv_discord_url ?? meta.eqv_published_at,
		equivalent_machines: groups.reduce((n, g) => n + g.length, 0)
	},
	busycoq: {
		repo: busycoq.repo,
		branch: busycoq.branch,
		head: busycoq.head,
		snapshot_fetched_at: busycoq.fetched_at,
		verify_files: busycoq.verify_files,
		prs_url: `https://github.com/${busycoq.repo}/pulls`,
		pr_snapshot: busycoq.prs.map((p) => ({
			number: p.number,
			state: p.state,
			head_sha: p.head_sha,
			updated_at: p.updated_at
		}))
	},
	sources: {
		list: {
			name: 'BB(6) holdouts list and equivalence groups',
			by: 'mxdys',
			url: meta.published_at,
			as_of: meta.published
		},
		sheet: {
			name: sheet.source,
			url: sheet.url,
			as_of: sheet.exported,
			keyed_to_list: sheet.keyed_to_list
		},
		slugbird: { name: slug.source, as_of: slug.as_of, url: slug.url, made_with: slug.made_with },
		busycoq: {
			name: 'busycoq (verified Rocq proofs)',
			url: `https://github.com/${busycoq.repo}/tree/${busycoq.branch}`,
			as_of: busycoq.fetched_at
		},
		wiki: { name: 'bbchallenge wiki', url: 'https://wiki.bbchallenge.org', as_of: wiki.fetched_at }
	},
	url_templates: {
		viewer: `${SITE}/{tm}`,
		fiery: 'https://fiery.pages.dev/turing/{tm}',
		longacc:
			'https://ccz181078.github.io/TM/LongAcc/ (paste the code; the page takes no URL parameter)',
		wiki_page: wiki.base + '{wiki_page}',
		busycoq_pr: `https://github.com/${busycoq.repo}/pull/{number}`,
		busycoq_file: `https://github.com/${busycoq.repo}/blob/${busycoq.head.sha}/verify/{file}`,
		sheet_cell: `${sheet.url}/edit#gid={tab_gid}&range={ref}`
	},
	sheet_tabs: sheet.tabs,
	counts: {
		by_status: countBy((h) => h.busycoq.status),
		with_conflicts: holdouts.filter((h) => h.conflicts.length).length
	},
	holdouts
};

const text = JSON.stringify(out, null, '\t') + '\n';
const dest = new URL('static/bb6/holdouts.json', ROOT);
if (process.argv.includes('--check')) {
	if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== text) {
		console.error(
			'static/bb6/holdouts.json is out of date: run node scripts/bb6-holdouts/build.mjs'
		);
		process.exit(1);
	}
} else {
	fs.mkdirSync(new URL('./', dest), { recursive: true });
	fs.writeFileSync(dest, text);
	console.log(
		`wrote ${holdouts.length} holdouts; ${JSON.stringify(out.counts)}; ${(
			text.length / 1024
		).toFixed(0)} KiB`
	);
}
