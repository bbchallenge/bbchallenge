import { oldBbchallengeFormatToNew } from './tm'

export const BB5_champion = oldBbchallengeFormatToNew('1RB1LC1RC1RB1RD0LE1LA1LD---0LA'); // 47,176,870 steps
export const BB6_Kropitz_champion = oldBbchallengeFormatToNew('1RB1LE1RC1RF1LD0RB1RE0LC1LA0RD---1RC');
export const BB7_Wythagoras_champion = oldBbchallengeFormatToNew('1LE---1RC1RF1LD0RB1RE0LC1LG0RD---1RC1RB1LE');

export const BB5_23M_steps_halter = oldBbchallengeFormatToNew('1RB0LD1LC1RD1LA1LC---1RE1RA0RB'); // 23,554,764 steps
export const BB5_2M_steps_halter = oldBbchallengeFormatToNew('1RB1LC0LA0LD1LA---1LB1RE0RD0RB'); // 2,133,492 steps

export const Marxen_and_Buntrock_chaotic_id = 76708232;
export const Marxen_and_Buntrock_complex_counter_id = 10936909;

// cf: https://skelet.ludost.net/bb/nreg.html
export const Skelet_machines = [
	{
		original_code: 'C1L E1L  H1L D1L  D1R D0L  A1L E1R  B0L C0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC1LE---1LD1RD0LD1LA1RE0LB0RC'),
		bbchallenge_id: 68329601
	},
	{
		original_code: 'C1L E0R  H1L C0R  D1R A0L  A1R D1R  A1L B0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0RE---0RC1RD0LA1RA1RD1LA0RB'),
		bbchallenge_id: 55767995
	},
	{
		original_code: 'C1L A0R  H1L E1L  D1R B0L  A1R C1R  C0L D1L',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0RA---1LE1RD0LB1RA1RC0LC1LD'),
		bbchallenge_id: 5950405
	},
	{
		original_code: 'C1L D0R  H1L E0L  D1R C1L  E1L A1R  B1L D0L',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0RD---0LE1RD1LC1LE1RA1LB0LD'),
		bbchallenge_id: 6897876
	},
	{
		original_code: 'C1L A1L  H1L D0L  D1R E0L  A1L C0R  C1R B0L',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC1LA---0LD1RD0LE1LA0RC1RC0LB'),
		bbchallenge_id: 60581745
	},
	{
		original_code: 'C1L B0R  H1L D0R  D1L A0R  E1R C0L  C1R E1R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0RB---0RD1LD0RA1RE0LC1RC1RE'),
		bbchallenge_id: 58211439
	},
	{
		original_code: 'C1L B0R  H1L E1R  D1L A1L  A1R D0L  A0R C1R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0RB---1RE1LD1LA1RA0LD0RA1RC'),
		bbchallenge_id: 7196989
	},
	{
		original_code: 'C1L B0R  H1L C0R  D1L C0L  E0R C1L  A0R E1R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0RB---0RC1LD0LC0RE1LC0RA1RE'),
		bbchallenge_id: 7728246
	},
	{
		original_code: 'C1L D1R  H1L C0L  A1R C1L  E1R A0R  B1L E0L',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC1RD---0LC1RA1LC1RE0RA1LB0LE'),
		bbchallenge_id: 12554268
	},
	{
		original_code: 'C1L A0L  H1L C0L  D0R A1L  B1L E1R  D1R E0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0LA---0LC0RD1LA1LB1RE1RD0RE'),
		bbchallenge_id: 3810716
	},
	{
		original_code: 'C1L A0L  H1L A0R  D0R A1L  E0R D1R  A1L B0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0LA---0RA0RD1LA0RE1RD1LA0RB'),
		bbchallenge_id: 3810169
	},
	{
		original_code: 'C1L E0L  H1L E1L  D0R A1L  A0L C1R  C1R B0L',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0LE---1LE0RD1LA0LA1RC1RC0LB'),
		bbchallenge_id: 4982511
	},
	{
		original_code: 'C1L B0R  H1L A1R  D0L E1R  E0R C1L  C1R A0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0RB---1RA0LD1RE0RE1LC1RC0RA'),
		bbchallenge_id: 7566785
	},
	{
		original_code: 'B1L H1L  C1R E0R  D1L B0R  D0L A1L  C0R A0L',
		bbchallenge_code: oldBbchallengeFormatToNew('1LB---1RC0RE1LD0RB0LD1LA0RC0LA'),
		bbchallenge_id: 31357173
	},
	{
		original_code: 'B1L H1L  C1L B1R  D1R E1L  B1R D0R  A1L C0L',
		bbchallenge_code: oldBbchallengeFormatToNew('1LB---1LC1RB1RD1LE1RB0RD1LA0LC'),
		bbchallenge_id: 2204428
	},
	{
		original_code: 'B1L H1L  C0R D1L  D1R C1R  E1L E0L  A0L B0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LB---0RC1LD1RD1RC1LE0LE0LA0RB'),
		bbchallenge_id: 20569060
	},
	{
		original_code: 'B1L H1L  C0R E1L  D0R C1R  A1L B1R  B0L A0L',
		bbchallenge_code: oldBbchallengeFormatToNew('1LB---0RC1LE0RD1RC1LA1RB0LB0LA'),
		bbchallenge_id: 1365166
	},
	{
		original_code: 'B1L H1L  C0L D0R  D1L E0R  E1L A0L  C1R D0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LB---0LC0RD1LD0RE1LE0LA1RC0RD'),
		bbchallenge_id: 15439451
	},
	{
		original_code: 'B1L H1L  C0L B0L  C1R D0R  A1L E0R  A0R E0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LB---0LC0LB1RC0RD1LA0RE0RA0RE'),
		bbchallenge_id: 14536286
	},
	{
		original_code: 'B1L H1L  C0L D1L  D0R C1L  E1R A0L  A1L E0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LB---0LC1LD0RD1LC1RE0LA1LA0RE'),
		bbchallenge_id: 347505
	},
	{
		original_code: 'C1L E1L  A1L H1L  D1R E0R  B1R E1R  C1R A0L',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC1LE1LA---1RD0RE1RB1RE1RC0LA'),
		bbchallenge_id: 9980689
	},
	{
		original_code: 'C1L E0L  A1R H1L  D1R A0L  D0R B1R  C0L B0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0LE1RA---1RD0LA0RD1RB0LC0RB'),
		bbchallenge_id: 45615747
	},
	{
		original_code: 'C1L C0R  D0L H1L  D1R E0L  C1L E0R  A1R B1L',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0RC0LD---1RD0LE1LC0RE1RA1LB'),
		bbchallenge_id: 6237150
	},
	{
		original_code: 'C1L A1L  E1R H1L  D1R D0R  B0R E0L  A0L C1R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC1LA1RE---1RD0RD0RB0LE0LA1RC'),
		bbchallenge_id: 60658955
	},
	{
		original_code: 'C1L A0R  A1L H1L  D1R E1L  A1R D0R  E0L B0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0RA1LA---1RD1LE1RA0RD0LE0RB'),
		bbchallenge_id: 47260245
	},
	{
		original_code: 'C1L E1R  D1R H1L  D1L C0L  A1R D1L  B1R A0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC1RE1RD---1LD0LC1RA1LD1RB0RA'),
		bbchallenge_id: 13134219
	},
	{
		original_code: 'C1L E0R  E0L H1L  D1L B0L  A1R A0L  A0R E1R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0RE0LE---1LD0LB1RA0LA0RA1RE'),
		bbchallenge_id: 7163434
	},
	{
		original_code: 'C1L E0L  D1R H1L  B1L E1L  A1R E1R  A1L D0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0LE1RD---1LB1LE1RA1RE1LA0RD'),
		bbchallenge_id: 5657318
	},
	{
		original_code: 'C1L D0R  A0L H1L  A1R D0L  E1R B1L  C1L C0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0RD0LA---1RA0LD1RE1LB1LC0RC'),
		bbchallenge_id: 6626162
	},
	{
		original_code: 'C1L E0L  C1R H1L  D0R A1L  A1R E0R  B1R E0L',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0LE1RC---0RD1LA1RA0RE1RB0LE'),
		bbchallenge_id: 4986661
	},
	{
		original_code: 'C1L B0R  E0R H1L  D0L C1L  E1L C0L  A1R C0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0RB0RE---0LD1LC1LE0LC1RA0RC'),
		bbchallenge_id: 56967673
	},
	{
		original_code: 'C1L E0R  C0L H1L  D0L B0L  D1R A0R  A1R D1L',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0RE0LC---0LD0LB1RD0RA1RA1LD'),
		bbchallenge_id: 6957734
	},
	{
		original_code: 'C1L D1R  E1R H1L  D0L C0L  B1R A0R  A1R E1L',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC1RD1RE---0LD0LC1RB0RA1RA1LE'),
		bbchallenge_id: 11896833
	},
	{
		original_code: 'C1L D1R  E1R H1L  D0L C0L  B1R A0R  A1R A1L',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC1RD1RE---0LD0LC1RB0RA1RA1LA'),
		bbchallenge_id: 11896832
	},
	{
		original_code: 'C1L D1R  E1R H1L  D0L C0L  B1R A0R  A1R A0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC1RD1RE---0LD0LC1RB0RA1RA0RA'),
		bbchallenge_id: 11896831
	},
	{
		original_code: 'C1L E1R  D1R H1L  D0L C0L  B1R A1L  D1L A0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC1RE1RD---0LD0LC1RB1LA1LD0RA'),
		bbchallenge_id: 13609549
	},
	{
		original_code: 'C1L B0R  C1R H1L  D0L D0R  A1R E0L  D1L E1L',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0RB1RC---0LD0RD1RA0LE1LD1LE'),
		bbchallenge_id: 7512832
	},
	{
		original_code: 'C1L C0L  D1L H1L  B0L D0R  E0R A1L  A1R E1R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LC0LC1LD---0LB0RD0RE1LA1RA1RE'),
		bbchallenge_id: 35771936
	},
	{
		original_code: 'B1L D1L  C1R H1L  E1R D1R  E1L C0R  A1L D0L',
		bbchallenge_code: oldBbchallengeFormatToNew('1LB1LD1RC---1RE1RD1LE0RC1LA0LD'),
		bbchallenge_id: 9914965
	},
	{
		original_code: 'B1L A0L  C1R H1L  C0R D0R  E1L B0L  E0L A1L',
		bbchallenge_code: oldBbchallengeFormatToNew('1LB0LA1RC---0RC0RD1LE0LB0LE1LA'),
		bbchallenge_id: 3841616
	},
	{
		original_code: 'B1L A0R  C1L H1L  D0L E1R  E1L A0L  C1R A0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LB0RA1LC---0LD1RE1LE0LA1RC0RA'),
		bbchallenge_id: 5915217
	},
	{
		original_code: 'B1L E0R  C1L H1L  D0L C0L  D1R A0R  B0R E0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LB0RE1LC---0LD0LC1RD0RA0RB0RE'),
		bbchallenge_id: 57874080
	},
	{
		original_code: 'B1L A0R  C0L H1L  C1R D1L  E1L A1R  B0L D0R',
		bbchallenge_code: oldBbchallengeFormatToNew('1LB0RA0LC---1RC1LD1LE1RA0LB0RD'),
		bbchallenge_id: 5878998
	}
];
