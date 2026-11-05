#!/usr/bin/env node
// How many BB(6) holdouts each published list had: the table in the wiki's "Holdouts lists" page, section BB(6).
// Writes data/bb6/sources/history.json, which the page's chart reads.
//
//   node scripts/bb6-holdouts/fetch-history.mjs
import { SOURCES, writeSnapshot } from './common.mjs';

const PAGE = 'Holdouts_lists';
const url = `https://wiki.bbchallenge.org/w/api.php?action=parse&page=${PAGE}&prop=wikitext&format=json`;
const res = await fetch(url, { headers: { 'user-agent': 'bbchallenge-holdouts-script' } });
if (!res.ok) throw new Error(`wiki answered ${res.status}`);
const text = (await res.json()).parse.wikitext['*'];

const start = text.indexOf('=== BB(6) ===');
if (start < 0) throw new Error('no "=== BB(6) ===" section in the wiki page');
const table = text.slice(start, text.indexOf('|}', start));
const plain = (s) =>
	s
		.replace(/<ref[^>]*>.*?<\/ref>|<ref[^>]*\/>/g, '')
		.replace(/\[https?:\/\/\S+ ([^\]]+)\]/g, '$1')
		.replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
		.trim();
const MONTHS =
	'January February March April May June July August September October November December'.split(
		' '
	);

const lists = table
	.split(/\n\|-\n/)
	.slice(1)
	.map((row) => {
		const cells = row
			.split('\n')
			.filter((l) => l.startsWith('|'))
			.map((l) => l.slice(1));
		const m = /^(\w+) (\d+)(?:st|nd|rd|th)?,? (\d{4})\b/.exec(plain(cells[0]));
		if (!m || !MONTHS.includes(m[1])) throw new Error(`unreadable date: ${cells[0]}`);
		const date = `${m[3]}-${String(MONTHS.indexOf(m[1]) + 1).padStart(2, '0')}-${m[2].padStart(
			2,
			'0'
		)}`;
		const link = /\[(https:\/\/discord\.com\/\S+)/.exec(cells[0])?.[1] ?? null;
		const note = plain(cells[4] ?? '');
		return {
			date,
			count: Number(plain(cells[2]).replace(/,/g, '')),
			by: plain(cells[1]).replace(/^@/, ''),
			...(link ? { link } : {}),
			...(note ? { note } : {})
		};
	})
	.filter((l) => Number.isFinite(l.count)) // rows that are not a list (e.g. the annotated sheet) have no count
	.sort((a, b) => a.date.localeCompare(b.date) || b.count - a.count);

const out = {
	source: `https://wiki.bbchallenge.org/wiki/${PAGE}#BB(6)`,
	fetched_at: new Date().toISOString(),
	lists
};
writeSnapshot(new URL('history.json', SOURCES), out);
console.log(
	`${lists.length} lists, ${lists[0].date} (${lists[0].count}) to ${lists.at(-1).date} (${
		lists.at(-1).count
	})`
);
