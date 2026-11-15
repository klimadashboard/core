// Home country (AT on klimadashboard.at, DE on klimadashboard.de)
export const HOME_COLOR = '#41AB5D';

// Fossil remainder in the 100 % view
export const FOSSIL_COLOR = '#9ca3af';

// Comparison countries: colour-blind safe (Okabe-Ito, without green) and
// each combined with its own dash pattern, so series never differ by colour alone.
export const COMPARE_STYLES: Array<{ color: string; dash: string | null }> = [
	{ color: '#0072B2', dash: null },
	{ color: '#E69F00', dash: '6 4' },
	{ color: '#CC79A7', dash: '2 4' },
	{ color: '#D55E00', dash: '10 4 2 4' },
	{ color: '#56B4E9', dash: '4 2' },
	{ color: '#4B5563', dash: '1 3' }
];

export const MAX_COMPARE = COMPARE_STYLES.length;

// kept for backwards compatibility (imported by renewableRegions/Inspector.svelte)
export const REGION_COLORS = { highlighted: HOME_COLOR };
