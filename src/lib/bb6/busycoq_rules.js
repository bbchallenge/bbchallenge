// How the BB(6) holdouts page decides what busycoq says about a machine. Shared by the build script
// (scripts/bb6-holdouts/fetch-busycoq.mjs) and by the live check in the browser (busycoq_live.js).

// A completed proof ends in a top-level statement about the machine run from the blank tape c0:
//   Theorem nonhalt: ~halts tm c0.      Theorem halt: halts tm c0.      (also halts_in / halts_at_trans forms)
// Files that merely mention a machine (Eqv*.v equivalence lemmas, rule-reduction files for cryptids, partial
// analyses) lack such a statement. This is a heuristic, and it is what decides "solved", so the build script
// records the verdict for every hit.
export const FINAL_THEOREM_RE =
	/\b(?:Theorem|Lemma|Corollary|Fact)\s+[\w']+[^:.]*:\s*(?:~\s*)?\(?\s*halts(?:_in|_at_trans)?\b[^.]*\bc0\b/;

/** Does this text (a whole file, or the lines a diff adds) contain a completed proof statement? */
export const hasFinalTheorem = (text) => FINAL_THEOREM_RE.test(text) && !/\bAdmitted\b/.test(text);

/** Equivalence lemmas ("halts tm <-> halts tm'") live in Eqv*.v files: they merge machines, they do not prove any. */
export const isEqvFile = (file) => /(^|\/)Eqv/.test(file);

export const BUSYCOQ_REPO = 'ccz181078/busycoq';
export const BUSYCOQ_BRANCH = 'BB6';
