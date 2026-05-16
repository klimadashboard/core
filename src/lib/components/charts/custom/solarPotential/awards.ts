import type { HistEntry, RegionCase } from './config';

export interface Award {
	icon: string;
	name: string;
	desc: string;
	date?: string;
	remaining?: string;
	color: 'blue' | 'green' | 'gold' | 'purple';
	unlocked: boolean;
}

interface AwardDef {
	icon: string;
	name: string;
	desc: string;
	color: Award['color'];
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
		crossed: (e) => e.roofs_solar_share >= threshold,
		remaining: (l) =>
			`Noch ${Math.max(0, threshold - l.roofs_solar_share).toFixed(1).replace('.', ',')} %P`
	};
});

// --- Count (units_count) awards ---
const COUNT_DEFS: AwardDef[] = [
	{
		icon: '⚡',
		name: '500 Dächer',
		desc: '500 PV-Anlagen auf Dächern',
		color: 'gold',
		crossed: (e) => e.units_count >= 500,
		remaining: (l) => `Noch ${Math.max(0, 500 - l.units_count).toLocaleString('de-DE')} Anlagen`
	},
	{
		icon: '⚡',
		name: '1.000 Dächer',
		desc: '1.000 PV-Anlagen auf Dächern',
		color: 'gold',
		crossed: (e) => e.units_count >= 1000,
		remaining: (l) => `Noch ${Math.max(0, 1000 - l.units_count).toLocaleString('de-DE')} Anlagen`
	}
];

// --- Power awards (region-case specific) ---
function makePowerAward(mwp: number, label: string): AwardDef {
	const kw = mwp * 1000;
	const mwpStr = mwp >= 1000 ? `${mwp / 1000} GWp` : `${mwp} MWp`;
	return {
		icon: '🔋',
		name: `${mwp}-Megawatt-${label}`,
		desc: `${mwpStr} installierte Dach-Leistung`,
		color: 'green',
		crossed: (e) => e.net_power_kw >= kw,
		remaining: (l) =>
			`Noch ${(Math.max(0, kw - l.net_power_kw) / 1000).toFixed(1).replace('.', ',')} MWp`
	};
}

const POWER_AWARD_DEFS: Record<RegionCase, [AwardDef, AwardDef]> = {
	kleinstadt:  [makePowerAward(1,    'Gemeinde'),   makePowerAward(2,    'Gemeinde')],
	mittelstadt: [makePowerAward(1,    'Gemeinde'),   makePowerAward(2,    'Gemeinde')],
	grossstadt:  [makePowerAward(10,   'Stadt'),      makePowerAward(100,  'Stadt')],
	kreis:       [makePowerAward(10,   'Kreis'),      makePowerAward(100,  'Kreis')],
	bundesland:  [makePowerAward(100,  'Bundesland'), makePowerAward(1000, 'Bundesland')]
};

// Indices into POTENTIAL_DEFS and DAECHER_DEFS for shorthand below.
const P = POTENTIAL_DEFS;  // P[0]=2.5%, P[1]=5%, …, P[10]=50%
const D = DAECHER_DEFS;    // D[0]=1/25, D[1]=1/20, …, D[7]=1/2

function buildAllDefs(power1: AwardDef, power2: AwardDef): AwardDef[] {
	// Ordered roughly by increasing difficulty, mixing categories for variety.
	return [
		P[0],       // 2,5-Prozent-Klub
		D[0],       // Jedes 25. Dach  (4 %)
		D[1],       // Jedes 20. Dach  (5 %)
		P[1],       // 5-Prozent-Klub
		D[2],       // Jedes 15. Dach  (~6,7 %)
		COUNT_DEFS[0], // 500 Dächer
		P[2],       // 7,5-Prozent-Klub
		D[3],       // Jedes 10. Dach  (10 %)
		P[3],       // 10-Prozent-Klub
		COUNT_DEFS[1], // 1.000 Dächer
		power1,
		P[4],       // 12,5-Prozent-Klub
		D[4],       // Jedes 5. Dach   (20 %)
		P[5],       // 15-Prozent-Klub
		D[5],       // Jedes 4. Dach   (25 %)
		P[6],       // 20-Prozent-Klub
		D[6],       // Jedes 3. Dach   (~33 %)
		P[7],       // 25-Prozent-Klub
		power2,
		P[8],       // 30-Prozent-Klub
		D[7],       // Jedes 2. Dach   (50 %)
		P[9],       // 40-Prozent-Klub
		P[10]       // 50-Prozent-Klub
	];
}

const MONTH_NAMES_DE = [
	'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
	'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
];

export function computeAwards(history: HistEntry[], regionCase: RegionCase = 'mittelstadt'): Award[] {
	if (!history.length) return [];
	const latest = history[history.length - 1];
	const [power1, power2] = POWER_AWARD_DEFS[regionCase];
	return buildAllDefs(power1, power2).map((def) => {
		const firstEntry = history.find((e) => def.crossed(e));
		if (firstEntry) {
			const [y, m] = firstEntry.date.split('-');
			return {
				icon: def.icon,
				name: def.name,
				desc: def.desc,
				date: `${MONTH_NAMES_DE[parseInt(m, 10) - 1]} ${y}`,
				color: def.color,
				unlocked: true
			};
		}
		return {
			icon: def.icon,
			name: def.name,
			desc: def.desc,
			remaining: def.remaining(latest),
			color: def.color,
			unlocked: false
		};
	});
}
