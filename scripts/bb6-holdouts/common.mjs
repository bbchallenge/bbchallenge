// Shared helpers for the BB(6) holdouts scripts (Node >= 18, no dependencies).
import fs from 'node:fs';
import { canonicalKey, TM_RE } from '../../src/lib/bb6/tm_key.js';

export const ROOT = new URL('../../', import.meta.url);
export const SOURCES = new URL('data/bb6/sources/', ROOT);
export const read = (url) => fs.readFileSync(url, 'utf8');
export const readJSON = (url) => JSON.parse(read(url));

/** One machine code per line; blank lines and "#" comments ignored. */
export function parseList(text) {
	return text
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter((l) => l && !l.startsWith('#'));
}

/** Blank-line separated groups of machine codes. */
export function parseGroups(text) {
	return text
		.split(/\r?\n\s*\r?\n/)
		.map(parseList)
		.filter((g) => g.length);
}

/**
 * Load the official list and mxdys's equivalence groups, and index every machine by canonical key.
 * @returns {{list:string[], groups:string[][], holdoutOfKey:Map<string,number>, matchKind:(code:string)=>('exact'|'mirror'|'equivalent'|null)}}
 */
export function loadHoldouts(listUrl, eqvUrl) {
	const list = parseList(read(listUrl));
	const groups = parseGroups(read(eqvUrl));
	const index = new Map(list.map((tm, i) => [tm, i]));
	/** canonical key -> index in `list` */
	const holdoutOfKey = new Map();
	const groupOf = []; // list index -> group members
	for (const g of groups) {
		const reps = g.filter((m) => index.has(m));
		if (reps.length !== 1)
			throw new Error(
				`equivalence group must contain exactly one holdout, has ${reps.length}: ${g[0]}`
			);
		const i = index.get(reps[0]);
		groupOf[i] = g;
		for (const m of g) {
			const k = canonicalKey(m);
			if (holdoutOfKey.has(k) && holdoutOfKey.get(k) !== i)
				throw new Error(`machine in two groups: ${m}`);
			holdoutOfKey.set(k, i);
		}
	}
	if (groupOf.filter(Boolean).length !== list.length)
		throw new Error('some holdouts have no equivalence group');
	return { list, groups: groupOf, holdoutOfKey };
}

/** How a source machine code relates to a holdout: its own code, a mirror/renaming of it, or a different (equivalent) machine. */
export function relation(code, holdoutTm) {
	if (code === holdoutTm) return 'exact';
	return canonicalKey(code) === canonicalKey(holdoutTm) ? 'mirror' : 'equivalent';
}

export function githubToken() {
	if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
	try {
		return require_child()
			.execSync('gh auth token', { stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim();
	} catch {
		return '';
	}
}
import { execSync } from 'node:child_process';
const require_child = () => ({ execSync });

export async function gh(path, { raw = false } = {}) {
	const token = githubToken();
	const res = await fetch(path.startsWith('http') ? path : `https://api.github.com${path}`, {
		headers: {
			accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
			'user-agent': 'bbchallenge-holdouts-script',
			...(token ? { authorization: `Bearer ${token}` } : {})
		}
	});
	if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
	return raw ? res.text() : res.json();
}

export { TM_RE };
