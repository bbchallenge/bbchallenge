// Machine-code helpers for the BB(6) holdouts page.
//
// This file is plain JavaScript with no imports so that the same code runs in the
// browser (live busycoq tracking) and under `node scripts/bb6-holdouts/build.mjs`.
//
// A BB(6) machine code is six groups of two transitions joined by "_":
//   1RB0LC_1LA1RD_..._...   (state A first; each transition is write, direction, next state)
// A halting transition is written "---" (some tools write "1RZ" or "0LH"; we accept both).

/** Matches one 6-state machine code. Unanchored, to find codes inside source files. */
export const TM_RE =
	/(?:[01][LR][A-F]|---|[01][LR][ZH])(?:[01][LR][A-F]|---|[01][LR][ZH])(?:_(?:[01][LR][A-F]|---|[01][LR][ZH]){2}){5}/g;

const STATES = 'ABCDEF';

/**
 * Parse a 6-state 2-symbol machine code.
 * @param {string} code
 * @returns {({w:number,d:'L'|'R',n:number}|null)[][] | null} 6 states x 2 symbols; null entry = halt
 */
export function parseTM(code) {
	const parts = code.split('_');
	if (parts.length !== 6) return null;
	/** @type {({w:number,d:'L'|'R',n:number}|null)[][]} */
	const table = [];
	for (const p of parts) {
		if (p.length !== 6) return null;
		const row = [];
		for (const t of [p.slice(0, 3), p.slice(3, 6)]) {
			if (t === '---') {
				row.push(null);
				continue;
			}
			const n = t[2] === 'Z' || t[2] === 'H' ? -1 : STATES.indexOf(t[2]);
			if (
				(t[0] !== '0' && t[0] !== '1') ||
				(t[1] !== 'L' && t[1] !== 'R') ||
				(n < 0 && t[2] !== 'Z' && t[2] !== 'H')
			)
				return null;
			row.push(n < 0 ? null : { w: Number(t[0]), d: /** @type {'L'|'R'} */ (t[1]), n });
		}
		table.push(row);
	}
	return table;
}

/** Spell a halting transition "---" everywhere (halt-notation normalisation). */
export function normalizeHalts(code) {
	return code.replace(/[01][LR][ZH]/g, '---');
}

/**
 * Canonical form of a machine up to the two symmetries that never change behaviour:
 *   - left/right mirroring
 *   - renaming states B..F (A is the start state and stays A)
 * Renaming is done in order of first use when running the transition table
 * (state A, symbol 0, then symbol 1, then the next state found, ...); the
 * lexicographically smaller of the plain and mirrored results is returned.
 * Returns null if `code` is not a 6-state machine code.
 * @param {string} code
 * @returns {string | null}
 */
export function canonicalKey(code) {
	const table = parseTM(normalizeHalts(code));
	if (!table) return null;
	let best = null;
	for (const mirror of [false, true]) {
		/** @type {number[]} */
		const order = [0];
		const seen = new Set([0]);
		for (let i = 0; i < order.length; i++) {
			for (const t of table[order[i]]) {
				if (t && !seen.has(t.n)) {
					seen.add(t.n);
					order.push(t.n);
				}
			}
		}
		for (let s = 0; s < 6; s++) if (!seen.has(s)) order.push(s); // unreachable states keep their order
		const rename = new Map(order.map((s, i) => [s, i]));
		const out = order.map((s) =>
			table[s]
				.map((t) => {
					if (!t) return '---';
					const d = mirror ? (t.d === 'L' ? 'R' : 'L') : t.d;
					return `${t.w}${d}${STATES[/** @type {number} */ (rename.get(t.n))]}`;
				})
				.join('')
		);
		const key = out.join('_');
		if (best === null || key < best) best = key;
	}
	return best;
}

/**
 * Find every machine code in a piece of text and return their canonical keys.
 * @param {string} text
 * @returns {Map<string,string>} canonical key -> first code that produced it
 */
export function keysInText(text) {
	/** @type {Map<string,string>} */
	const m = new Map();
	for (const code of text.match(TM_RE) ?? []) {
		const k = canonicalKey(code);
		if (k && !m.has(k)) m.set(k, code);
	}
	return m;
}
