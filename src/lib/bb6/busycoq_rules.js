// How the BB(6) holdouts page decides what busycoq says about a machine. Shared by the build script
// (scripts/bb6-holdouts/fetch-busycoq.mjs) and by the live check in the browser (busycoq_live.js).

// A completed proof ends in a top-level statement about the machine run from the blank tape c0:
//   Theorem nonhalt: ~halts tm c0.      Theorem halt: halts tm c0.      (also halts_in / halts_at_trans forms)
// Files that merely mention a machine (Eqv*.v equivalence lemmas, rule-reduction files for cryptids, partial
// analyses) lack such a statement. This is a heuristic, and it is what decides "solved", so the build script
// records the verdict for every hit.
import { keysInText } from './tm_key.js';

export const FINAL_THEOREM_RE =
	/\b(?:Theorem|Lemma|Corollary|Fact)\s+[\w']+[^:.]*:\s*(?:~\s*)?\(?\s*halts(?:_in|_at_trans)?\b[^.]*\bc0\b/;

/** Rocq source without its comments. Comments (* ... *) nest; an unclosed one runs to the end of the text. */
export function stripComments(text) {
	let out = '',
		depth = 0;
	for (let i = 0; i < text.length; i++) {
		if (text[i] === '(' && text[i + 1] === '*') depth++, i++;
		else if (depth && text[i] === '*' && text[i + 1] === ')') depth--, i++;
		else if (!depth) out += text[i];
	}
	return out;
}

/** Does this text (a whole file, or the lines a diff adds) contain a completed proof statement? Comments are
 * ignored; a proof left unfinished (Admitted, Abort) does not count. */
export function hasFinalTheorem(text) {
	const code = stripComments(text);
	return FINAL_THEOREM_RE.test(code) && !/\b(?:Admitted|Abort)\b/.test(code);
}

/** Canonical keys of the machines a verify/ file proves: those named outside comments in a file with a completed
 * proof. Eqv*.v files prove none. */
export function provedKeys(file, text) {
	if (isEqvFile(file) || !hasFinalTheorem(text)) return new Set();
	return new Set(keysInText(stripComments(text)).keys());
}

/** Equivalence lemmas ("halts tm <-> halts tm'") live in Eqv*.v files: they merge machines, they do not prove any. */
export const isEqvFile = (file) => /(^|\/)Eqv/.test(file);

export const BUSYCOQ_REPO = 'ccz181078/busycoq';
export const BUSYCOQ_BRANCH = 'BB6';
