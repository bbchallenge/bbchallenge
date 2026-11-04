// Wiki pages that exist for some of the sheet's class names (checked against wiki.bbchallenge.org on 2026-11-04).
// Class names themselves are the community sheet's labels; there is no official taxonomy.
export const CLASS_WIKI = {
	'Bell eats counter': 'Bell_eats_counter',
	'Sync bouncer counter': 'Sync_bouncer_counter',
	'Shift-overflow counter': 'Shift_overflow_counter',
	'Shift-overflow bouncer counter': 'Shift_overflow_bouncer_counter',
	'Bell-like': 'Bell',
	'Skelet 1-like Class 1': 'Skelet_1',
	'Skelet 1-like Class 2': 'Skelet_1'
};

export const WIKI = 'https://wiki.bbchallenge.org/wiki/';

/** Order busycoq statuses for sorting: most actionable first. */
export const STATUS_ORDER = { open: 0, pr_open: 1, solved: 2 };

export const STATUS_LABEL = {
	open: 'Open',
	pr_open: 'Open PR',
	solved: 'Solved'
};

export const STATUS_HELP = {
	open: 'No proof in busycoq and no open pull request that proves it.',
	pr_open: 'A pull request on busycoq contains a proof, and it has not been merged yet.',
	solved: 'busycoq has a completed proof (merged).'
};

/** "6.0e79" -> 79.78 ; null when unknown */
export function log10Of(s) {
	if (!s) return null;
	const m = /^([\d.]+)e(\d+)$/i.exec(s);
	return m ? Math.log10(Number(m[1])) + Number(m[2]) : null;
}
