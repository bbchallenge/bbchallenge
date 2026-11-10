#!/usr/bin/env node
// Snapshot what busycoq (ccz181078/busycoq, branch BB6) says about the current holdouts.
//
//   node scripts/bb6-holdouts/fetch-busycoq.mjs [--clone <dir>]
//
// 1. Scans every verify/**/*.v file at the head of BB6 for machine codes (any mirror/renaming) that
//    belong to a holdout's equivalence group.
// 2. Lists every pull request against BB6 and, for each, which holdout machines the verify/*.v files it
//    changes prove (judged on the whole file at the PR head), and which appear in the lines it adds (and in its
//    title/description).
//
// Writes data/bb6/sources/busycoq.json. Needs `git`, and a GitHub token (GITHUB_TOKEN, or `gh auth
// login`) for the ~60 API calls. Pass --clone <dir> to reuse an existing checkout of the BB6 branch.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { canonicalKey, keysInText } from '../../src/lib/bb6/tm_key.js';
import { provedByFile } from '../../src/lib/bb6/busycoq_rules.js';
import { SOURCES, ROOT, loadHoldouts, gh, parseList, read, readJSON, writeSnapshot } from './common.mjs';

const REPO = 'ccz181078/busycoq';
const BRANCH = 'BB6';
const cloneArg = process.argv.indexOf('--clone');
const meta = readJSON(new URL('list.json', SOURCES));
const { holdoutOfKey } = loadHoldouts(new URL(meta.list_file, ROOT), new URL(meta.eqv_file, ROOT));
// also look for the machines of the older base list (list.json base_list) that have since been decided
const baseKeys = new Set(
	meta.base_list ? parseList(read(new URL(meta.base_list.file, ROOT))).map((tm) => canonicalKey(tm)) : []
);

let dir = cloneArg >= 0 ? process.argv[cloneArg + 1] : null;
if (!dir) {
	dir = fs.mkdtempSync(path.join(os.tmpdir(), 'busycoq-'));
	execFileSync(
		'git',
		['clone', '--depth', '1', '-b', BRANCH, '--quiet', `https://github.com/${REPO}`, dir],
		{ stdio: 'inherit' }
	);
}
const git = (...a) =>
	execFileSync('git', ['-C', dir, ...a])
		.toString()
		.trim();
const head = {
	sha: git('rev-parse', 'HEAD'),
	date: git('log', '-1', '--format=%cI'),
	message: git('log', '-1', '--format=%s')
};

/** canonical key -> files (relative to verify/) that contain it */
const hits = {};
let nFiles = 0;
const verify = path.join(dir, 'verify');
const entries = [];
(function walk(d) {
	for (const e of fs.readdirSync(d, { withFileTypes: true })) {
		const p = path.join(d, e.name);
		if (e.isDirectory()) walk(p);
		else if (e.name.endsWith('.v')) entries.push([path.relative(verify, p), fs.readFileSync(p, 'utf8')]);
	}
})(verify);
nFiles = entries.length;
const provedIn = provedByFile(entries); // machines named only in comments are mentions
for (const [file, text] of entries) {
	const proved = provedIn.get(file);
	for (const [k, code] of keysInText(text)) {
		if (holdoutOfKey.has(k) || baseKeys.has(k)) (hits[k] ??= []).push({ file, as: code, final: proved.has(k) });
	}
	for (const k of proved) // proved by its folder (the machine is named in a sibling file)
		if ((holdoutOfKey.has(k) || baseKeys.has(k)) && !keysInText(text).has(k))
			(hits[k] ??= []).push({ file, as: null, final: true });
}

/** Keys of holdout machines in `text`, mapped to the holdout index. */
const holdoutKeys = (text) => [...keysInText(text).keys()].filter((k) => holdoutOfKey.has(k));

const prs = [];
const pulls = [];
for (let page = 1; ; page++) {
	const batch = await gh(`/repos/${REPO}/pulls?state=all&base=${BRANCH}&per_page=100&page=${page}`);
	pulls.push(...batch);
	if (batch.length < 100) break;
}
for (const p of pulls) {
	const added = new Map(); // key -> files of the PR that prove it
	const mentionedInFiles = new Map(); // key -> files in which it only appears
	const files = [];
	for (let page = 1; ; page++) {
		const batch = await gh(`/repos/${REPO}/pulls/${p.number}/files?per_page=100&page=${page}`);
		files.push(...batch);
		if (batch.length < 100) break;
	}
	const judged = [];
	for (const f of files) {
		if (!f.filename.startsWith('verify/') || !f.filename.endsWith('.v') || f.status === 'removed')
			continue;
		const addedLines = (f.patch ?? '')
			.split('\n')
			.filter((l) => l.startsWith('+'))
			.join('\n');
		// Judge the whole file at the PR head, not the added lines: a proof is often finished by editing a file
		// (Admitted -> Qed, a theorem added under an unchanged TM_from_str line).
		const whole = p.head.repo
			? await fetch(
					`https://raw.githubusercontent.com/${p.head.repo.full_name}/${p.head.sha}/${f.filename}`
			  ).then((r) => (r.ok ? r.text() : null))
			: null;
		judged.push({ f, addedLines, text: whole ?? addedLines });
	}
	const provedIn = provedByFile(judged.map((j) => [j.f.filename, j.text]));
	for (const { f, addedLines, text } of judged) {
		const name = f.filename.replace(/^verify\//, '');
		const proved = provedIn.get(f.filename);
		for (const k of proved)
			if (holdoutOfKey.has(k)) (added.get(k) ?? added.set(k, []).get(k)).push(name);
		// mentions: what the PR's own lines name (all of the file when GitHub shows no diff)
		for (const k of holdoutKeys(f.patch ? addedLines : text))
			if (!proved.has(k)) (mentionedInFiles.get(k) ?? mentionedInFiles.set(k, []).get(k)).push(name);
	}
	prs.push({
		number: p.number,
		title: p.title,
		author: p.user.login,
		state: p.merged_at ? 'merged' : p.state, // open | closed | merged
		draft: p.draft,
		created_at: p.created_at,
		updated_at: p.updated_at,
		head_sha: p.head.sha,
		covers: Object.fromEntries([...added].map(([k, f]) => [k, [...new Set(f)]])),
		mentions: Object.fromEntries([...mentionedInFiles].map(([k, f]) => [k, [...new Set(f)]])),
		mentioned_in_text: holdoutKeys(`${p.title}\n${p.body ?? ''}`)
	});
	process.stderr.write(`PR #${p.number}: ${added.size} holdout machines\n`);
}

const out = {
	repo: REPO,
	branch: BRANCH,
	fetched_at: new Date().toISOString(),
	head,
	verify_files: nFiles,
	hits,
	prs
};
const changed = writeSnapshot(new URL('busycoq.json', SOURCES), out);
if (!changed) console.log('busycoq.json: sources unchanged, file kept');
console.log(
	`head ${head.sha.slice(0, 7)}; ${
		Object.keys(hits).length
	} holdout-group machines found in ${nFiles} files; ${prs.length} PRs`
);
