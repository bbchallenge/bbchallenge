// Where do the sources disagree about a holdout?
//
// A *conflict* is a real disagreement:
//   - the sources give different classes, or
//   - a source contradicts busycoq: it says the machine is solved and busycoq has no proof and no open
//     PR, or busycoq has it solved and a source still calls it unsolved (or a cryptid).
// A source that is only behind (or ahead) of busycoq on the path  ready -> PR -> solved  is NOT a
// disagreement; it goes to `notes`, which the page shows without a warning. So do a claim that only one
// source makes, and slugbird's "Reported by others", which is an unverified report, not a verdict.

/**
 * @param {object} x
 * @param {'open'|'pr_open'|'solved'} x.status  busycoq status of the holdout
 * @param {{number:number, relation:string, state:string}[]} x.prs
 * @param {{number:number}[]} x.open  the open PRs that contain a proof of it
 * @param {string[]} x.distinct  the distinct known classes the sources give it
 * @param {{status?:string|null}|null} x.sheet
 * @param {{status:string, pr?:number|null}|null} x.slugbird
 * @param {{as_of:string, status_labels:Record<string,string>}} x.slug
 * @returns {{conflicts:{kind:string,detail:string}[], notes:{kind:string,detail:string}[]}}
 */
export function compareSources({ status, prs, open, distinct, sheet: sh, slugbird: sg, slug }) {
	const conflicts = [];
	const notes = [];
	const label = (t) => slug.status_labels[t] ?? t;
	const slugBy = `slugbird's guide (${slug.as_of})`;
	const openPRs = open.map((p) => `#${p.number}`).join(', ');
	const slugSaysSolved = sg?.status === 'reported'; // "Reported by others": someone claims a proof
	const slugOnPath = ['ready', 'pr'].includes(sg?.status ?? ''); // a proof exists or is coming

	if (distinct.length > 1)
		conflicts.push({ kind: 'class', detail: `sources disagree: ${distinct.join(' / ')}` });

	if (['HALT', 'NONHALT'].includes(sh?.status ?? '')) {
		if (status === 'open')
			conflicts.push({
				kind: 'solved-not-in-busycoq',
				detail: `the sheet marks it ${sh.status}, but busycoq has no proof and no open PR`
			});
		else if (status === 'pr_open')
			notes.push({
				kind: 'behind',
				detail: `the sheet marks it ${sh.status}; busycoq has an open PR (${openPRs}), not yet merged`
			});
	}
	if (slugSaysSolved) {
		if (status === 'open')
			notes.push({
				kind: 'unverified',
				detail: `${slugBy} lists it as "${label(sg.status)}"${
					sg.pr ? ` and points to PR #${sg.pr}` : ''
				}; busycoq has no proof and no open PR${
					sg.pr && prs.some((p) => p.number === sg.pr) ? ` (PR #${sg.pr} only mentions it)` : ''
				}`
			});
		else if (status === 'pr_open')
			notes.push({
				kind: 'behind',
				detail: `${slugBy} lists it as "${label(
					sg.status
				)}"; busycoq now has an open PR (${openPRs})`
			});
	}
	if (slugOnPath) {
		if (status === 'solved')
			notes.push({
				kind: 'stale',
				detail: `${slugBy} says "${label(sg.status)}"; busycoq has since merged a proof`
			});
		else if (status === 'pr_open' && sg.status === 'ready')
			notes.push({
				kind: 'behind',
				detail: `${slugBy} says "${label(sg.status)}"; busycoq now has an open PR (${openPRs})`
			});
		else if (status === 'open' && sg.status === 'pr')
			notes.push({
				kind: 'ahead',
				detail: `${slugBy} says "${label(sg.status)}"${
					sg.pr ? ` (PR #${sg.pr})` : ''
				}, but no open busycoq PR contains a proof of it (it may have been closed)`
			});
	}
	if (sg && !slugSaysSolved && !slugOnPath && status === 'pr_open' && sg.status !== 'cryptid')
		notes.push({
			kind: 'behind',
			detail: `${slugBy} says "${label(sg.status)}"; busycoq now has an open PR (${openPRs})`
		});
	if (status === 'solved') {
		if (sh?.status === 'CRYPTID' || sg?.status === 'cryptid')
			conflicts.push({
				kind: 'unsolved-in-source',
				detail: 'busycoq has a proof, but a source still lists it as a cryptid'
			});
		else if (sg && !slugOnPath && !slugSaysSolved)
			conflicts.push({
				kind: 'unsolved-in-source',
				detail: `busycoq has a proof, but ${slugBy} still says "${label(sg.status)}"`
			});
	}
	if (sh?.status === 'CRYPTID' && sg && sg.status !== 'cryptid' && status !== 'solved')
		conflicts.push({
			kind: 'cryptid',
			detail: `the sheet marks it CRYPTID; ${slugBy} says "${label(sg.status)}"`
		});
	if (sg?.status === 'cryptid' && sh?.status !== 'CRYPTID')
		notes.push({
			kind: 'one-source',
			detail: `${slugBy} calls it a cryptid; the sheet (built on an older list) does not mark it`
		});
	return { conflicts, notes };
}
