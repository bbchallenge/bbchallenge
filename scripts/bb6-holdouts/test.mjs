// node --test scripts/bb6-holdouts/test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { canonicalKey, keysInText } from '../../src/lib/bb6/tm_key.js';
import { hasFinalTheorem } from '../../src/lib/bb6/busycoq_rules.js';
import { fetchLive, overlay } from '../../src/lib/bb6/busycoq_live.js';

const data = JSON.parse(
	fs.readFileSync(new URL('../../static/bb6/holdouts.json', import.meta.url), 'utf8')
);

test('canonical key: mirror and state renaming are the same machine', () => {
	const a = '1RB1RA_0LC1LE_1LD1LC_1LA0LB_1LF1RE_---0RA'; // Antihydra
	const mirrored = '1LB1LA_0RC1RE_1RD1RC_1RA0RB_1RF1LE_---0LA';
	assert.equal(canonicalKey(a), canonicalKey(mirrored));
	// rename E<->F
	assert.equal(canonicalKey(a), canonicalKey('1RB1RA_0LC1LF_1LD1LC_1LA0LB_---0RA_1LE1RF'));
	assert.notEqual(canonicalKey(a), canonicalKey('1RB1RA_0LC1LE_1LD1LC_1LA0LB_1LF1RE_---0RB'));
	assert.equal(canonicalKey('1RB1RA_0LC1LE_1LD1LC_1LA0LB_1LF1RE_1RZ0RA'), canonicalKey(a));
	assert.equal(canonicalKey('not a machine'), null);
});

test('keysInText finds machines inside Rocq source', () => {
	const t =
		'Definition tm := Eval compute in (TM_from_str "1RB0LB_1LC0RE_1LA1LD_0LC---_0RB0RF_1RE1RB").\n(* 1RB1LC_0RC0RB_1LD0LA_1LE---_1LF1RA_1LA1LA *)';
	assert.equal(keysInText(t).size, 2);
});

test('final theorem detection', () => {
	assert.ok(hasFinalTheorem('Theorem nonhalt: ~halts tm c0.'));
	assert.ok(hasFinalTheorem('Theorem halt: halts tm c0.'));
	assert.ok(!hasFinalTheorem('Lemma R2 a n: halts tm (S0 0 1 n).'));
	assert.ok(!hasFinalTheorem('Theorem nonhalt: ~halts tm c0.\nAdmitted.'));
});

test('snapshot: every holdout appears once, aliases are unique', () => {
	assert.equal(data.holdouts.length, data.list.count);
	const seen = new Set();
	for (const h of data.holdouts)
		for (const t of [h.tm, ...h.aliases.map((a) => a.tm)]) assert.ok(!seen.has(t), t), seen.add(t);
});

const fakeFetch = (routes) => async (url) => {
	const path = url.replace('https://api.github.com', '');
	for (const [prefix, body] of Object.entries(routes))
		if (path.startsWith(prefix))
			return typeof body === 'function'
				? body()
				: { ok: true, status: 200, headers: new Headers(), json: async () => body };
	return { ok: false, status: 404, headers: new Headers(), json: async () => ({}) };
};

test('live: unchanged branch keeps the snapshot', async () => {
	const prs = data.busycoq.pr_snapshot.map((p) => ({
		number: p.number,
		title: '',
		state: p.state === 'merged' ? 'closed' : p.state,
		merged_at: p.state === 'merged' ? 'x' : null,
		user: { login: 'u' },
		head: { sha: p.head_sha }
	}));
	const live = await fetchLive(data, {
		storage: null,
		fetch: fakeFetch({
			'/repos/ccz181078/busycoq/pulls?': prs,
			'/repos/ccz181078/busycoq/git/ref': { object: { sha: data.busycoq.head.sha } }
		})
	});
	assert.ok(live.ok, live.error);
	assert.equal(live.requests, 2);
	const o = overlay(data, live);
	assert.ok([...o.values()].every((v) => !v.changed));
});

test('live: a merged PR turns its holdouts solved, a closed one back to open', async () => {
	const target = data.holdouts.find((h) => h.busycoq.status === 'pr_open');
	const pr = target.busycoq.prs.find((p) => p.relation === 'proves' && p.state === 'open');
	const prs = data.busycoq.pr_snapshot.map((p) => ({
		number: p.number,
		title: '',
		state: p.number === pr.number ? 'closed' : p.state === 'merged' ? 'closed' : p.state,
		merged_at: p.number === pr.number ? '2026-11-05' : p.state === 'merged' ? 'x' : null,
		user: { login: 'u' },
		head: { sha: p.head_sha }
	}));
	const live = await fetchLive(data, {
		storage: null,
		fetch: fakeFetch({
			'/repos/ccz181078/busycoq/pulls?': prs,
			'/repos/ccz181078/busycoq/git/ref': { object: { sha: data.busycoq.head.sha } }
		})
	});
	assert.equal(overlay(data, live).get(target.n - 1).status, 'solved');
});

test('live: a new commit that proves a holdout', async () => {
	const target = data.holdouts.find((h) => h.busycoq.status === 'open');
	const patch = `+Definition tm := Eval compute in (TM_from_str "${target.tm}").\n+Theorem nonhalt: ~halts tm c0.\n`;
	const prs = data.busycoq.pr_snapshot.map((p) => ({
		number: p.number,
		title: '',
		state: p.state === 'merged' ? 'closed' : p.state,
		merged_at: p.state === 'merged' ? 'x' : null,
		user: { login: 'u' },
		head: { sha: p.head_sha }
	}));
	const live = await fetchLive(data, {
		storage: null,
		fetch: fakeFetch({
			'/repos/ccz181078/busycoq/pulls?': prs,
			'/repos/ccz181078/busycoq/git/ref': { object: { sha: 'abc' } },
			'/repos/ccz181078/busycoq/compare': {
				ahead_by: 1,
				files: [{ filename: 'verify/New.v', patch }]
			}
		})
	});
	assert.equal(live.commits_ahead, 1);
	assert.equal(overlay(data, live).get(target.n - 1).status, 'solved');
});

test('live: rate limit and network errors fall back to the snapshot', async () => {
	const limited = await fetchLive(data, {
		storage: null,
		fetch: async () => ({
			ok: false,
			status: 403,
			headers: new Headers({ 'x-ratelimit-reset': '1' }),
			json: async () => ({})
		})
	});
	assert.equal(limited.ok, false);
	assert.match(limited.error, /rate limit/);
	const offline = await fetchLive(data, {
		storage: null,
		fetch: async () => {
			throw new TypeError('Failed to fetch');
		}
	});
	assert.equal(offline.ok, false);
	const o = overlay(data, offline);
	assert.equal(o.get(0).status, data.holdouts[0].busycoq.status);
});

// ---- where sources disagree ---------------------------------------------------------------------
import { compareSources } from './conflicts.mjs';
const slug = {
	as_of: 'November 3, 2026',
	status_labels: {
		ready: 'Proof ready, PR soon',
		pr: 'Proof in an open PR',
		reported: 'Reported by others',
		cryptid: 'Cryptid',
		rules: 'Rules known, no proof'
	}
};
const cmp = (o) =>
	compareSources({
		status: 'open',
		prs: [],
		open: [],
		distinct: [],
		sheet: null,
		slugbird: null,
		slug,
		...o
	});

test('a source that is behind busycoq on ready -> PR -> solved is a note, not a conflict', () => {
	const r = cmp({ status: 'pr_open', open: [{ number: 55 }], slugbird: { status: 'ready' } });
	assert.equal(r.conflicts.length, 0);
	assert.equal(r.notes[0].kind, 'behind');
	const s = cmp({ status: 'solved', slugbird: { status: 'pr', pr: 3 } });
	assert.equal(s.conflicts.length, 0);
	assert.equal(s.notes[0].kind, 'stale');
});

test('conflicts: different classes; a source says solved but busycoq has nothing; busycoq solved but a source says cryptid', () => {
	assert.equal(cmp({ distinct: ['Bell', 'Counter'] }).conflicts[0].kind, 'class');
	assert.equal(cmp({ sheet: { status: 'NONHALT' } }).conflicts[0].kind, 'solved-not-in-busycoq');
	assert.equal(
		cmp({ status: 'solved', slugbird: { status: 'cryptid' } }).conflicts[0].kind,
		'unsolved-in-source'
	);
	assert.equal(
		cmp({ status: 'solved', slugbird: { status: 'rules' } }).conflicts[0].kind,
		'unsolved-in-source'
	);
});

test('"Reported by others" and a lone cryptid tag are notes', () => {
	const a = cmp({ slugbird: { status: 'reported', pr: 40 }, prs: [{ number: 40 }] });
	assert.equal(a.conflicts.length, 0);
	assert.equal(a.notes[0].kind, 'unverified');
	const b = cmp({ slugbird: { status: 'cryptid' }, sheet: { status: null } });
	assert.deepEqual([b.conflicts.length, b.notes[0].kind], [0, 'one-source']);
});

test('snapshot: every conflict kind is a known one and discord links are well formed', () => {
	const kinds = new Set(['class', 'solved-not-in-busycoq', 'unsolved-in-source', 'cryptid']);
	for (const h of data.holdouts) {
		for (const c of h.conflicts) assert.ok(kinds.has(c.kind), c.kind);
		for (const l of h.discord) assert.match(l.message, /^\d+$/);
		assert.ok(Array.isArray(h.notes));
	}
});

test('snapshot: Eqv*.v files never count as proof (solved_in, or a PR that "proves")', () => {
	for (const h of data.holdouts) {
		for (const f of h.busycoq.solved_in) assert.ok(!/^Eqv/.test(f.file), `${h.n} ${f.file}`);
		for (const p of h.busycoq.prs)
			if (p.relation === 'proves') for (const f of p.files) assert.ok(!/^Eqv/.test(f), `${h.n} PR ${p.number}`);
	}
});
