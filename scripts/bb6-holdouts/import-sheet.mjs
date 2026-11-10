#!/usr/bin/env node
// Import the structured fields we use from RobinCodes's BB(6) spreadsheet.
//
//   node scripts/bb6-holdouts/import-sheet.mjs <csv-dir> <export-date YYYY-MM-DD> [--strikethrough <file.csv>]
//
// <csv-dir> holds the sheet's tabs exported as CSV (File > Download > CSV, or
// /export?format=csv&gid=<gid>), named like  <anything>classifications.csv,
// <anything>results.csv and <anything>direct-simulation.csv.
//
// Only machine codes and structured fields are kept: the class, the Results status, and the
// Direct Simulation depth. Free-text notes and Discord links are NOT copied; each record
// keeps the sheet cell it came from so the page can link back to it.
//
// The Direct Simulation tab lists the machines that are *not yet* simulated to 1e12 ... 1e15 and
// strikes a cell through once that is done. The CSV export drops strike-through, so struck cells
// can be supplied with --strikethrough (columns: tab,gid,row,col,kind,text; rows with tab ==
// "Direct Simulation"). Without it every listed cell counts as not yet done.
import fs from 'node:fs';
import path from 'node:path';
import { parseCSV, colLetter } from './csv.mjs';
import { TM_RE } from '../../src/lib/bb6/tm_key.js';

const SHEET_ID = '1mMp8bAcTFT91j7azn72liX8NSTwc2E_ozKnOGTfRCfw';
// Robin's tab names for the same class, fixed to the spelling used everywhere else.
const CLASS_FIX = {
	'Chaotic Fractral Type 1': 'Chaotic Fractal Type 1',
	'Chaotic Fractral Others': 'Chaotic Fractal Others'
};
const GIDS = {
	classifications: '105825363',
	results: '1330361301',
	'direct-simulation': '806905077'
};

const args = process.argv.slice(2);
const stIdx = args.indexOf('--strikethrough');
const strikeFile = stIdx >= 0 ? args.splice(stIdx, 2)[1] : null;
const [dir, exported] = args;
if (!dir || !exported) {
	console.error('usage: import-sheet.mjs <csv-dir> <export-date> [--strikethrough file.csv]');
	process.exit(2);
}
const find = (slug) => {
	const f = fs.readdirSync(dir).find((n) => n.endsWith(`${slug}.csv`));
	if (!f) throw new Error(`no *${slug}.csv in ${dir}`);
	return parseCSV(fs.readFileSync(path.join(dir, f), 'utf8'));
};
const isTM = (s) => new RegExp(`^${TM_RE.source}$`).test(s.trim());
const fix = (c) => CLASS_FIX[c.trim()] ?? c.trim();

const classifications = {};
{
	const rows = find('classifications');
	const hdr = rows[0];
	rows.slice(1).forEach((row, i) =>
		row.forEach((c, j) => {
			if (isTM(c) && hdr[j].trim())
				classifications[c.trim()] = { class: fix(hdr[j]), cell: colLetter(j) + (i + 2) };
		})
	);
}
const results = {};
{
	const rows = find('results');
	rows.slice(1).forEach((row, i) => {
		const tm = (row[0] ?? '').trim();
		if (!isTM(tm)) return;
		results[tm] = { status: (row[1] ?? '').trim(), class: fix(row[2] ?? ''), cell: `A${i + 2}` };
	});
}
const struck = new Set();
if (strikeFile) {
	for (const r of parseCSV(fs.readFileSync(strikeFile, 'utf8')).slice(1))
		if (r[0] === 'Direct Simulation') struck.add(`${r[3]}${r[2]}`);
}
// pending[k]: machines listed, and not struck through, in the "not simulated up to 1e<k>" column
const pending = {};
{
	const rows = find('direct-simulation');
	rows[0].forEach((h, j) => {
		const m = /1e(\d+)/.exec(h);
		if (!m) return;
		pending[m[1]] = new Set();
		rows.slice(1).forEach((row, i) => {
			const c = (row[j] ?? '').trim();
			if (isTM(c) && !struck.has(`${colLetter(j)}${i + 2}`)) pending[m[1]].add(c);
		});
	});
}
// "simulated_to": the largest k for which the machine is NOT on the pending-1e<k+1> list, but only for
// machines the tab lists at all. 13 = done to 1e13 but still pending 1e14; 15 = on no pending list.
const simulated = {};
for (const tm of Object.keys(results)) {
	if (pending[14]?.has(tm)) simulated[tm] = { log10_min: 13 };
	else if (pending[15]?.has(tm)) simulated[tm] = { log10_min: 14 };
	else simulated[tm] = { log10_min: 15 };
}

const out = {
	source: 'RobinCodes’s annotated BB(6) holdouts spreadsheet',
	url: `https://docs.google.com/spreadsheets/d/${SHEET_ID}`,
	exported,
	keyed_to_list: 1534,
	tabs: GIDS,
	strikethrough_applied: Boolean(strikeFile),
	classifications,
	results,
	simulated
};
const dest = new URL('../../data/bb6/sources/sheet.json', import.meta.url);
fs.writeFileSync(dest, JSON.stringify(out, null, '\t') + '\n');
console.log(
	`classifications ${Object.keys(classifications).length}, results ${
		Object.keys(results).length
	}, simulated ${Object.keys(simulated).length}`
);
