#!/usr/bin/env node
// Which holdouts have a page on wiki.bbchallenge.org?  Writes data/bb6/sources/wiki.json.
//
//   node scripts/bb6-holdouts/fetch-wiki.mjs
//
// Machine pages on the wiki are titled with the machine code (MediaWiki shows "_" as a space), so this
// lists every page whose title starts with a transition ("1R", "1L", "0R", "0L") and keeps the 6-state
// machines that belong to a holdout's equivalence group.
import fs from 'node:fs';
import { canonicalKey, TM_RE } from '../../src/lib/bb6/tm_key.js';
import { SOURCES, ROOT, loadHoldouts, readJSON, writeSnapshot } from './common.mjs';

const API = 'https://wiki.bbchallenge.org/w/api.php';
const meta = readJSON(new URL('list.json', SOURCES));
const { holdoutOfKey } = loadHoldouts(new URL(meta.list_file, ROOT), new URL(meta.eqv_file, ROOT));

const pages = {};
for (const prefix of ['1R', '1L', '0R', '0L']) {
	let cont = {};
	do {
		const qs = new URLSearchParams({
			action: 'query',
			list: 'allpages',
			apprefix: prefix,
			aplimit: '500',
			format: 'json',
			...cont
		});
		const j = await (
			await fetch(`${API}?${qs}`, { headers: { 'user-agent': 'bbchallenge-holdouts-script' } })
		).json();
		for (const p of j.query.allpages) {
			const code = p.title.replace(/ /g, '_');
			if (!new RegExp(`^${TM_RE.source}$`).test(code)) continue;
			const k = canonicalKey(code);
			if (holdoutOfKey.has(k)) (pages[k] ??= []).push(p.title.replace(/ /g, '_'));
		}
		cont = j.continue ?? null;
	} while (cont);
}
const out = {
	fetched_at: new Date().toISOString(),
	base: 'https://wiki.bbchallenge.org/wiki/',
	pages
};
const changed = writeSnapshot(new URL('wiki.json', SOURCES), out);
if (!changed) console.log('wiki.json: sources unchanged, file kept');
console.log(`${Object.keys(pages).length} machines in holdout groups have a wiki page`);
