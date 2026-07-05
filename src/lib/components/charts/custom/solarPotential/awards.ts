import type { HistEntry, RegionCase } from './types';

export interface Award {
	icon: string;
	name: string;
	desc: string;
	date?: string;
	remaining?: string;
	color: 'blue' | 'green' | 'gold' | 'purple';
	unlocked: boolean;
	category: string;
}

interface AwardDef {
	icon: string;
	name: string;
	desc: string;
	color: Award['color'];
	category: string;
	crossed: (e: HistEntry) => boolean;
	remaining: (latest: HistEntry) => string;
}

// --- Potential (net_potential_share) awards ---
// Series: 2.5 / 5 / 7.5 / 10 / 12.5 / 15 / 20 / 25 / 30 / 40 / 50 %
// Calibrate upper thresholds with real data before release (#15).
const POTENTIAL_THRESHOLDS = [2.5, 5, 7.5, 10, 12.5, 15, 20, 25, 30, 40, 50];

const POTENTIAL_DEFS: AwardDef[] = POTENTIAL_THRESHOLDS.map((pct) => ({
	icon: '☀',
	name: `${String(pct).replace('.', ',')}-Prozent-Klub`,
	desc: `${String(pct).replace('.', ',')} % des Solarpotentials wird genutzt`,
	color: 'blue',
	category: 'potential',
	crossed: (e) => e.net_potential_share >= pct,
	remaining: (l) => `Noch ${Math.max(0, pct - l.net_potential_share).toFixed(1).replace('.', ',')} %P`
}));

// --- Dächer (roofs_solar_share) awards ---
// Fractions: 1/25 (4 %) … 1/2 (50 %)
const DAECHER_FRACTIONS = [25, 20, 15, 10, 5, 4, 3, 2];

const DAECHER_DEFS: AwardDef[] = DAECHER_FRACTIONS.map((frac) => {
	const threshold = 100 / frac;
	return {
		icon: '🏠',
		name: `Jedes ${frac}. Dach`,
		desc: `1 von ${frac} Dächern hat eine PV-Anlage`,
		color: 'green',
		category: 'daecher',
		crossed: (e) => e.roofs_solar_share >= threshold,
		remaining: (l) =>
			`Noch ${Math.max(0, threshold - l.roofs_solar_share).toFixed(1).replace('.', ',')} %P`
	};
});

// --- Count (units_count) awards ---
function range(from: number, to: number, step: number): number[] {
	const result = [];
	for (let i = from; i <= to; i += step) result.push(i);
	return result;
}

const COUNT_THRESHOLDS: Record<RegionCase, number[]> = {
	grossstadt:  [500, 1_000, 2_500, ...range(5_000, 100_000, 5_000)],
	mittelstadt: [500, ...range(1_000, 30_000, 500)],
	kleinstadt:  [50, 100, 250, 500, 1_000, 2_500, 5_000],
	kreis:       [500, 1_000, 2_500, 5_000, ...range(10_000, 50_000, 5_000), ...range(60_000, 100_000, 10_000)],
	bundesland:  range(100_000, 2_000_000, 100_000)
};

function buildCountDefs(regionCase: RegionCase): AwardDef[] {
	return COUNT_THRESHOLDS[regionCase].map((n) => ({
		icon: '⚡',
		name: `${n.toLocaleString('de-DE')} Anlagen`,
		desc: `${n.toLocaleString('de-DE')} PV-Anlagen auf Dächern`,
		color: 'gold' as const,
		category: 'count',
		crossed: (e: HistEntry) => e.units_count >= n,
		remaining: (l: HistEntry) => `Noch ${Math.max(0, n - l.units_count).toLocaleString('de-DE')} Anlagen`
	}));
}

// --- Power awards (region-case specific) ---
const POWER_LABELS: Record<RegionCase, string> = {
	kleinstadt:  'Gemeinde',
	mittelstadt: 'Gemeinde',
	grossstadt:  'Stadt',
	kreis:       'Kreis',
	bundesland:  'Bundesland'
};

// MWp thresholds per region case — mirroring the granularity of COUNT_THRESHOLDS.
const POWER_THRESHOLDS: Record<RegionCase, number[]> = {
	kleinstadt:  [0.5, 1, 2, 3, 5, 10],
	mittelstadt: [1, ...range(2, 30, 2), 40, 50],
	grossstadt:  [5, ...range(10, 100, 10), ...range(150, 500, 50)],
	kreis:       [5, ...range(10, 100, 10), ...range(150, 500, 50)],
	bundesland:  [...range(100, 1000, 100), ...range(1500, 5000, 500)]
};

function buildPowerDefs(regionCase: RegionCase): AwardDef[] {
	const label = POWER_LABELS[regionCase];
	return POWER_THRESHOLDS[regionCase].map((mwp) => {
		const kw = mwp * 1000;
		const mwpStr = mwp >= 1000 ? `${mwp / 1000} GWp` : `${mwp} MWp`;
		return {
			icon: '🔋',
			name: `${String(mwp).replace('.', ',')} MWp – ${label}`,
			desc: `${mwpStr} installierte Dach-Leistung`,
			color: 'green' as const,
			category: 'power',
			crossed: (e: HistEntry) => e.net_power_kw >= kw,
			remaining: (l: HistEntry) =>
				`Noch ${(Math.max(0, kw - l.net_power_kw) / 1000).toFixed(1).replace('.', ',')} MWp`
		};
	});
}

// Indices into POTENTIAL_DEFS and DAECHER_DEFS for shorthand below.
const P = POTENTIAL_DEFS;  // P[0]=2.5%, P[1]=5%, …, P[10]=50%
const D = DAECHER_DEFS;    // D[0]=1/25, D[1]=1/20, …, D[7]=1/2

function buildAllDefs(powerDefs: AwardDef[], countDefs: AwardDef[]): AwardDef[] {
	const C = countDefs;
	// Core mixed sequence (first two power/count slots); remaining tiers appended by category.
	return [
		P[0],           // 2,5-Prozent-Klub
		D[0],           // Jedes 25. Dach  (4 %)
		D[1],           // Jedes 20. Dach  (5 %)
		P[1],           // 5-Prozent-Klub
		D[2],           // Jedes 15. Dach  (~6,7 %)
		C[0],           // erste Count-Stufe
		P[2],           // 7,5-Prozent-Klub
		D[3],           // Jedes 10. Dach  (10 %)
		P[3],           // 10-Prozent-Klub
		C[1],           // zweite Count-Stufe
		powerDefs[0],   // erste Power-Stufe
		P[4],           // 12,5-Prozent-Klub
		D[4],           // Jedes 5. Dach   (20 %)
		P[5],           // 15-Prozent-Klub
		D[5],           // Jedes 4. Dach   (25 %)
		P[6],           // 20-Prozent-Klub
		D[6],           // Jedes 3. Dach   (~33 %)
		P[7],           // 25-Prozent-Klub
		powerDefs[1],   // zweite Power-Stufe
		P[8],           // 30-Prozent-Klub
		D[7],           // Jedes 2. Dach   (50 %)
		P[9],           // 40-Prozent-Klub
		P[10],          // 50-Prozent-Klub
		...C.slice(2),         // restliche Count-Stufen
		...powerDefs.slice(2)  // restliche Power-Stufen
	];
}

const MONTH_NAMES_DE = [
	'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
	'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
];

export function computeAwards(history: HistEntry[], regionCase: RegionCase = 'mittelstadt'): Award[] {
	if (!history.length) return [];
	const latest = history[history.length - 1];
	const powerDefs = buildPowerDefs(regionCase);
	const countDefs = buildCountDefs(regionCase);

	const all: Award[] = buildAllDefs(powerDefs, countDefs).map((def) => {
		const firstEntry = history.find((e) => def.crossed(e));
		if (firstEntry) {
			const [y, m] = firstEntry.date.split('-');
			return {
				icon: def.icon, name: def.name, desc: def.desc,
				date: `${MONTH_NAMES_DE[parseInt(m, 10) - 1]} ${y}`,
				color: def.color, category: def.category, unlocked: true
			};
		}
		return {
			icon: def.icon, name: def.name, desc: def.desc,
			remaining: def.remaining(latest),
			color: def.color, category: def.category, unlocked: false
		};
	});

	// Per category: keep only the highest unlocked award + the next locked one.
	const CATEGORY_ORDER = ['potential', 'daecher', 'count', 'power'];
	const result: Award[] = [];
	for (const cat of CATEGORY_ORDER) {
		const group = all.filter((a) => a.category === cat);
		const lastUnlockedIdx = group.map((a) => a.unlocked).lastIndexOf(true);
		if (lastUnlockedIdx >= 0) result.push(group[lastUnlockedIdx]);
		const nextLocked = group.find((a, i) => !a.unlocked && i > lastUnlockedIdx);
		if (nextLocked) result.push(nextLocked);
		// If nothing is unlocked yet, show only the first locked award.
		if (lastUnlockedIdx < 0 && group.length > 0) result.push(group[0]);
	}
	return result;
}
