#!/usr/bin/env node
// Import the structured fields we use from slugbird's "BB(6) Holdout Guide" (a Claude artifact,
// saved as one HTML file). Only the class, the status tag, the open-PR number and the
// simulation reach are kept. Its prose notes ("t") are NOT copied.
//
//   node scripts/bb6-holdouts/import-slugbird.mjs <guide.html> <url-or-note>
import fs from 'node:fs';

const [file, url] = process.argv.slice(2);
if (!file) {
	console.error('usage: import-slugbird.mjs <guide.html> [source-url]');
	process.exit(2);
}
const html = fs.readFileSync(file, 'utf8');
const start = html.indexOf('const DATA = ') + 'const DATA = '.length;
// DATA is a JSON array literal; find its end by bracket matching outside of strings.
let depth = 0,
	inStr = false,
	end = -1;
for (let i = start; i < html.length; i++) {
	const c = html[i];
	if (inStr) {
		if (c === '\\') i++;
		else if (c === '"') inStr = false;
	} else if (c === '"') inStr = true;
	else if (c === '[') depth++;
	else if (c === ']' && --depth === 0) {
		end = i + 1;
		break;
	}
}
const data = JSON.parse(html.slice(start, end));
const asof = /const ASOF = "([^"]+)"/.exec(html)?.[1] ?? null;
const ST = {};
for (const m of html.matchAll(/(\w+):\{l:"([^"]+)",d:"([^"]+)"\}/g)) ST[m[1]] = m[2];

const machines = {};
for (const r of data) {
	machines[r.m] = {
		class: r.c,
		status: r.s,
		pr: r.p ?? null,
		simulated: r.r || null // furthest simulation, e.g. "6.0e79"; "" when unknown
	};
}
const out = {
	source: 'slugbird’s BB(6) Holdout Guide',
	url: url ?? null,
	as_of: asof,
	based_on_list: 608,
	status_labels: ST,
	machines
};
fs.writeFileSync(
	new URL('../../data/bb6/sources/slugbird.json', import.meta.url),
	JSON.stringify(out, null, '\t') + '\n'
);
console.log(`${data.length} machines, as of ${asof}`);
