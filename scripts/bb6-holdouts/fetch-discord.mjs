#!/usr/bin/env node
// Optional step: find the Discord messages that mention each holdout (or any machine equivalent to it).
//
//   node scripts/bb6-holdouts/fetch-discord.mjs [<copy-dir>] [--guild <id>]
//
// Reads a LOCAL copy of the bbchallenge server (one <channel-id>.jsonl per channel or thread, plus
// index.json, as written by the maintainer's own Discord archiver). Discord needs credentials, so this
// cannot run in CI or for anyone without such a copy; skipping it keeps the last snapshot in
// data/bb6/sources/discord.json. <copy-dir> defaults to $BB6_DISCORD_COPY, else ~/workspace/mcp/discord/bbchallenge.
//
// What is kept: for each holdout, the message links (channel + message id), the date and the channel name.
// NO message text, author or attachment is stored. The copy only reaches back to its "floor" (recorded
// in the output as `covers_from`), so older discussion is not linked.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { canonicalKey, keysInText } from '../../src/lib/bb6/tm_key.js';
import { SOURCES, ROOT, loadHoldouts, readJSON, writeSnapshot } from './common.mjs';

const args = process.argv.slice(2);
const gi = args.indexOf('--guild');
const GUILD = gi >= 0 ? args.splice(gi, 2)[1] : '960643023006490684'; // bbchallenge
const dir = args[0] ?? process.env.BB6_DISCORD_COPY ?? path.join(os.homedir(), 'workspace/mcp/discord/bbchallenge');
if (!fs.existsSync(path.join(dir, 'index.json'))) {
	console.error(`no Discord copy at ${dir} (index.json missing); keeping data/bb6/sources/discord.json as it is`);
	process.exit(2);
}

const meta = readJSON(new URL('list.json', SOURCES));
const { holdoutOfKey } = loadHoldouts(new URL(meta.list_file, ROOT), new URL(meta.eqv_file, ROOT));
const index = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
const channels = index.channels ?? {};
const SNOWFLAKE_EPOCH = 1420070400000n;
const dateOfId = (id) => new Date(Number((BigInt(id) >> 22n) + SNOWFLAKE_EPOCH)).toISOString().slice(0, 10);

/** @type {Map<number, {channel:string, id:string, date:string}[]>} */
const hits = new Map();
let messages = 0;
let oldest = null;
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl')).sort()) {
	const channel = f.replace(/\.jsonl$/, '');
	for (const line of fs.readFileSync(path.join(dir, f), 'utf8').split('\n')) {
		if (!line.trim()) continue;
		let m;
		try {
			m = JSON.parse(line);
		} catch {
			continue;
		}
		messages++;
		if (!oldest || m.id.length < oldest.length || (m.id.length === oldest.length && m.id < oldest)) oldest = m.id;
		const rows = new Set();
		for (const key of keysInText(m.content ?? '').keys()) {
			const i = holdoutOfKey.get(key);
			if (i !== undefined) rows.add(i);
		}
		for (const i of rows) {
			if (!hits.has(i)) hits.set(i, []);
			hits.get(i).push({ channel, id: m.id, date: dateOfId(m.id) });
		}
	}
}

// Keyed by the holdout's machine code so the data survives a change of list order.
const list = loadHoldouts(new URL(meta.list_file, ROOT), new URL(meta.eqv_file, ROOT)).list;
const byMachine = {};
for (const [i, v] of [...hits].sort((a, b) => a[0] - b[0])) {
	v.sort((a, b) => (a.id.length - b.id.length || (a.id < b.id ? -1 : 1)));
	byMachine[list[i]] = v;
}
const channelNames = {};
for (const v of Object.values(byMachine)) for (const h of v) channelNames[h.channel] = channels[h.channel]?.name ?? null;

const out = {
	guild: GUILD,
	fetched_at: new Date().toISOString(),
	covers_from: oldest ? dateOfId(oldest) : null,
	messages_scanned: messages,
	channels: channelNames,
	machines: byMachine
};
const changed = writeSnapshot(new URL('discord.json', SOURCES), out);
if (!changed) console.log('discord.json: sources unchanged, file kept');
const total = Object.values(byMachine).reduce((n, v) => n + v.length, 0);
console.log(`scanned ${messages} messages since ${out.covers_from}; ${total} links on ${Object.keys(byMachine).length} holdouts`);
