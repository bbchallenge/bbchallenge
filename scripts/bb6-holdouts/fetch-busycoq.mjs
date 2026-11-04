#!/usr/bin/env node
// Snapshot what busycoq (ccz181078/busycoq, branch BB6) says about the current holdouts.
//
//   node scripts/bb6-holdouts/fetch-busycoq.mjs [--clone <dir>]
//
// 1. Scans every verify/**/*.v file at the head of BB6 for machine codes (any mirror/renaming) that
//    belong to a holdout's equivalence group.
// 2. Lists every pull request against BB6 and, for each, which holdout machines appear in the lines it
//    adds under verify/ (and in its title/description).
//
// Writes data/bb6/sources/busycoq.json. Needs `git`, and a GitHub token (GITHUB_TOKEN, or `gh auth
// login`) for the ~60 API calls. Pass --clone <dir> to reuse an existing checkout of the BB6 branch.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { keysInText } from '../../src/lib/bb6/tm_key.js';
import { hasFinalTheorem } from '../../src/lib/bb6/busycoq_rules.js';
import { SOURCES, ROOT, loadHoldouts, gh, readJSON } from './common.mjs';

const REPO = 'ccz181078/busycoq';
const BRANCH = 'BB6';
const cloneArg = process.argv.indexOf('--clone');
const meta = readJSON(new URL('list.json', SOURCES));
const { holdoutOfKey } = loadHoldouts(new URL(meta.list_file, ROOT), new URL(meta.eqv_file, ROOT));

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
(function walk(d) {
	for (const e of fs.readdirSync(d, { withFileTypes: true })) {
		const p = path.join(d, e.name);
		if (e.isDirectory()) walk(p);
		else if (e.name.endsWith('.v')) {
			nFiles++;
			const text = fs.readFileSync(p, 'utf8');
			const final = hasFinalTheorem(text);
			for (const [k, code] of keysInText(text)) {
				if (holdoutOfKey.has(k))
					(hits[k] ??= []).push({ file: path.relative(verify, p), as: code, final });
			}
		}
	}
})(verify);

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
	const added = new Map(); // key -> files in which the PR adds it together with a final theorem
	const mentionedInFiles = new Map(); // key -> files in which it only appears
	const files = [];
	for (let page = 1; ; page++) {
		const batch = await gh(`/repos/${REPO}/pulls/${p.number}/files?per_page=100&page=${page}`);
		files.push(...batch);
		if (batch.length < 100) break;
	}
	for (const f of files) {
		if (!f.filename.startsWith('verify/') || !f.filename.endsWith('.v')) continue;
		let text;
		if (f.patch)
			text = f.patch
				.split('\n')
				.filter((l) => l.startsWith('+'))
				.join('\n');
		else if (f.status !== 'removed' && p.head.repo) {
			// GitHub omits the patch of very large diffs: fall back to the whole file at the PR head.
			text = await fetch(
				`https://raw.githubusercontent.com/${p.head.repo.full_name}/${p.head.sha}/${f.filename}`
			).then((r) => (r.ok ? r.text() : ''));
		} else continue;
		const final = hasFinalTheorem(text);
		for (const k of holdoutKeys(text)) {
			const bucket = final ? added : mentionedInFiles;
			(bucket.get(k) ?? bucket.set(k, []).get(k)).push(f.filename.replace(/^verify\//, ''));
		}
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
fs.writeFileSync(new URL('busycoq.json', SOURCES), JSON.stringify(out, null, '\t') + '\n');
console.log(
	`head ${head.sha.slice(0, 7)}; ${
		Object.keys(hits).length
	} holdout-group machines found in ${nFiles} files; ${prs.length} PRs`
);
