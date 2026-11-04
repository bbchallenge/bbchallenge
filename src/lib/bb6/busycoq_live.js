// Live busycoq tracking for the BB(6) holdouts page.
//
// The page ships with a snapshot (static/bb6/holdouts.json). In the browser we ask the GitHub API what changed
// since, and overlay that on the snapshot. GitHub allows 60 unauthenticated requests per hour per IP, so:
//   - at most 3 + MAX_PR_FETCHES requests per load (usually 3);
//   - the answer is cached in localStorage for CACHE_MINUTES;
//   - any failure (offline, rate limit, a bad reply) leaves the snapshot in place and is reported, never thrown.
//
// What is checked:
//   1. the pull-request list: state (open / merged / closed) of every PR against BB6;
//   2. the head of BB6: if it moved, the compare view tells which files changed, and a completed proof of a
//      holdout in a changed file counts as solved (mxdys pushes most proofs straight to the branch, not as PRs);
//   3. PRs the snapshot has not seen (or whose head moved): their changed files, to see which holdouts they prove.
import { canonicalKey, keysInText } from './tm_key.js';
import { hasFinalTheorem, isEqvFile, BUSYCOQ_REPO, BUSYCOQ_BRANCH } from './busycoq_rules.js';

export const CACHE_MINUTES = 10;
export const MAX_PR_FETCHES = 6;
const CACHE_KEY = 'bb6-busycoq-live-v1';
const API = 'https://api.github.com';

/** Map every machine code of every equivalence group to its holdout index (0-based). */
export function indexHoldouts(holdouts) {
	/** @type {Map<string, number>} */
	const m = new Map();
	holdouts.forEach((h, i) => {
		m.set(canonicalKey(h.tm), i);
		for (const a of h.aliases) m.set(canonicalKey(a.tm), i);
	});
	return m;
}

/** Holdout indices proved by the lines a diff adds (or by a whole file), by file. */
function provedBy(files, keyToIndex) {
	/** @type {Map<number, string[]>} */
	const out = new Map();
	for (const f of files) {
		if (!f.filename.startsWith('verify/') || !f.filename.endsWith('.v') || isEqvFile(f.filename))
			continue;
		if (!f.patch) continue; // GitHub omits very large diffs; the caller notes it
		const added = f.patch
			.split('\n')
			.filter((l) => l.startsWith('+'))
			.join('\n');
		if (!hasFinalTheorem(added)) continue;
		for (const k of keysInText(added).keys()) {
			const i = keyToIndex.get(k);
			if (i !== undefined) out.set(i, [...(out.get(i) ?? []), f.filename.replace(/^verify\//, '')]);
		}
	}
	return out;
}

/**
 * Ask GitHub what changed since the snapshot.
 * @param {any} data the parsed holdouts.json
 * @param {{fetch?: typeof fetch, storage?: Storage|null, now?: number, force?: boolean}} [opts]
 * @returns {Promise<LiveResult>}
 */
export async function fetchLive(data, opts = {}) {
	const f = opts.fetch ?? fetch;
	const storage =
		opts.storage === undefined
			? typeof localStorage === 'undefined'
				? null
				: localStorage
			: opts.storage;
	const now = opts.now ?? Date.now();
	const snapSha = data.busycoq.head.sha;

	if (storage && !opts.force) {
		try {
			const c = JSON.parse(storage.getItem(CACHE_KEY) ?? 'null');
			if (c && c.snapshot_sha === snapSha && now - c.at < CACHE_MINUTES * 60_000)
				return { ...c.result, cached: true, checked_at: c.at };
		} catch {
			/* ignore a corrupt cache */
		}
	}

	/** @type {LiveResult} */
	const result = {
		ok: false,
		error: null,
		cached: false,
		checked_at: now,
		requests: 0,
		head: null,
		commits_ahead: 0,
		compare_url: null,
		prs: [],
		solved_by_commit: [],
		notes: []
	};
	const get = async (path) => {
		result.requests++;
		const res = await f(`${API}${path}`, { headers: { accept: 'application/vnd.github+json' } });
		if (res.status === 403 || res.status === 429) {
			const reset = res.headers.get('x-ratelimit-reset');
			throw new Error(
				`GitHub rate limit reached${
					reset ? ` (resets ${new Date(Number(reset) * 1000).toLocaleTimeString()})` : ''
				}`
			);
		}
		if (!res.ok) throw new Error(`GitHub answered ${res.status} for ${path.split('?')[0]}`);
		return res.json();
	};

	try {
		const keyToIndex = indexHoldouts(data.holdouts);
		const repo = BUSYCOQ_REPO;

		// 1. pull requests
		const pulls = [];
		for (let page = 1; page <= 3; page++) {
			const batch = await get(
				`/repos/${repo}/pulls?state=all&base=${BUSYCOQ_BRANCH}&per_page=100&page=${page}`
			);
			pulls.push(...batch);
			if (batch.length < 100) break;
		}
		const snapPRs = new Map(data.busycoq.pr_snapshot.map((p) => [p.number, p]));
		// which holdouts each PR proved, according to the snapshot
		const provesInSnapshot = new Map();
		data.holdouts.forEach((h, i) => {
			for (const p of h.busycoq.prs)
				if (p.relation === 'proves')
					provesInSnapshot.set(p.number, [...(provesInSnapshot.get(p.number) ?? []), i]);
		});
		const toFetch = [];
		for (const p of pulls) {
			const state = p.merged_at ? 'merged' : p.state;
			const snap = snapPRs.get(p.number);
			const rec = {
				number: p.number,
				title: p.title,
				author: p.user.login,
				state,
				holdouts: provesInSnapshot.get(p.number) ?? [],
				new: !snap,
				snapshot_state: snap?.state ?? null
			};
			result.prs.push(rec);
			if ((!snap || snap.head_sha !== p.head.sha) && state !== 'closed') toFetch.push(rec);
		}
		toFetch.sort(
			(a, b) => (a.state === 'open' ? 0 : 1) - (b.state === 'open' ? 0 : 1) || b.number - a.number
		);
		for (const rec of toFetch.slice(0, MAX_PR_FETCHES)) {
			const files = await get(`/repos/${repo}/pulls/${rec.number}/files?per_page=100`);
			const proved = provedBy(files, keyToIndex);
			rec.holdouts = [...new Set([...rec.holdouts, ...proved.keys()])];
			rec.refreshed = true;
			if (files.some((x) => x.filename.startsWith('verify/') && !x.patch))
				result.notes.push(
					`PR #${rec.number} has a diff too large for the API; its machines may be missing.`
				);
		}
		if (toFetch.length > MAX_PR_FETCHES)
			result.notes.push(
				`${
					toFetch.length - MAX_PR_FETCHES
				} changed pull requests were not inspected (request budget).`
			);

		// 2. head of the branch
		const ref = await get(`/repos/${repo}/git/ref/heads/${BUSYCOQ_BRANCH}`);
		result.head = ref.object.sha;
		if (result.head !== snapSha) {
			const cmp = await get(`/repos/${repo}/compare/${snapSha}...${result.head}`);
			result.commits_ahead = cmp.ahead_by ?? cmp.total_commits ?? 0;
			result.compare_url =
				cmp.html_url ?? `https://github.com/${repo}/compare/${snapSha}...${result.head}`;
			for (const [i, files] of provedBy(cmp.files ?? [], keyToIndex))
				result.solved_by_commit.push({ holdout: i, files });
			if ((cmp.files ?? []).length >= 300)
				result.notes.push(
					'The branch changed in more than 300 files since the snapshot; not all could be checked.'
				);
			if ((cmp.files ?? []).some((x) => x.filename.startsWith('verify/') && !x.patch))
				result.notes.push(
					'Some changed files are too large for the API to show; machines proved there may be missing.'
				);
		}
		result.ok = true;
	} catch (e) {
		result.error = e instanceof Error ? e.message : String(e);
	}

	if (storage && result.ok) {
		try {
			storage.setItem(CACHE_KEY, JSON.stringify({ at: now, snapshot_sha: snapSha, result }));
		} catch {
			/* storage full or blocked */
		}
	}
	return result;
}

/**
 * Overlay a live result on the snapshot. Returns, for each holdout index, its current busycoq status and PRs.
 * Rules: a holdout is solved if the snapshot says so, if a merged PR proves it, or if a commit since the snapshot
 * adds a completed proof of it; otherwise "pr_open" if an open PR proves it; otherwise "open".
 * @returns {Map<number, {status: 'open'|'pr_open'|'solved', changed: boolean, prs: {number:number,title:string,state:string,relation:string}[], via: string|null}>}
 */
export function overlay(data, live) {
	const out = new Map();
	const livePR = new Map((live?.prs ?? []).map((p) => [p.number, p]));
	const byCommit = new Map((live?.solved_by_commit ?? []).map((s) => [s.holdout, s.files]));
	const provedLive = new Map(); // holdout -> live PR records proving it
	for (const p of live?.prs ?? [])
		for (const i of p.holdouts) provedLive.set(i, [...(provedLive.get(i) ?? []), p]);
	data.holdouts.forEach((h, i) => {
		const snap = h.busycoq;
		if (!live?.ok) {
			out.set(i, { status: snap.status, changed: false, prs: snap.prs, via: null });
			return;
		}
		/** @type {Map<number, any>} */
		const prs = new Map(snap.prs.map((p) => [p.number, { ...p }]));
		for (const p of provedLive.get(i) ?? [])
			prs.set(p.number, {
				...(prs.get(p.number) ?? {}),
				number: p.number,
				title: p.title,
				author: p.author,
				relation: 'proves',
				state: p.state
			});
		for (const p of prs.values()) {
			const l = livePR.get(p.number);
			if (l) p.state = l.state;
		}
		const list = [...prs.values()].sort((a, b) => b.number - a.number);
		const proves = list.filter((p) => p.relation === 'proves');
		let status = 'open',
			via = null;
		if (snap.status === 'solved') status = 'solved';
		else if (proves.some((p) => p.state === 'merged'))
			(status = 'solved'), (via = 'a merged pull request');
		else if (byCommit.has(i))
			(status = 'solved'), (via = `a commit since the snapshot (${byCommit.get(i)[0]})`);
		else if (proves.some((p) => p.state === 'open')) status = 'pr_open';
		out.set(i, { status, changed: status !== snap.status, prs: list, via });
	});
	return out;
}

/**
 * @typedef {{ok:boolean, error:string|null, cached:boolean, checked_at:number, requests:number, head:string|null,
 *   commits_ahead:number, compare_url:string|null, prs:any[], solved_by_commit:{holdout:number,files:string[]}[], notes:string[]}} LiveResult
 */
