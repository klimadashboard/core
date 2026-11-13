// $lib/components/charts/custom/heatwavesKysely/kysely.ts
//
// Heatwaves after Kyselý, as defined by GeoSphere Austria
// (https://www.geosphere.at/en/topics/disaster-protection/heat):
//   - starts with at least 3 consecutive days with Tmax >= 30 °C
//   - lasts as long as the mean Tmax over the whole period stays ABOVE 30 °C
//     and Tmax on no day falls below 25 °C
// Every day of such a heatwave is a "Kysely day".
//
// Temperatures are handled in tenths of a degree (integers) to avoid
// floating point errors when averaging (e.g. (30.1 + 29.9) / 2 !== 30).

export interface DailyTmax {
	date: string; // YYYY-MM-DD
	tlmax: number | null;
}

export interface Heatwave {
	start: string; // YYYY-MM-DD
	end: string; // YYYY-MM-DD, inclusive
	length: number; // days
	maxTmax: number; // °C
	meanTmax: number; // °C
}

export interface HeatwaveYear {
	year: number;
	daysInYear: number;
	/** Tmax per day of year (index 0 = 1 January), null if missing */
	tmax: (number | null)[];
	/** Index into `waves` for every Kysely day, -1 otherwise */
	waveIndex: number[];
	waves: Heatwave[];
	kyselyDays: number;
	/** Number of days with a Tmax value */
	daysWithData: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const toUtc = (date: string) => Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const toTenths = (t: number | null) => (t === null || t === undefined ? null : Math.round(t * 10));

export const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
export const daysInYear = (y: number) => (isLeapYear(y) ? 366 : 365);

/** Day of year, 0-based (1 January = 0) */
export function dayOfYear(date: string): number {
	const ms = toUtc(date);
	const start = Date.UTC(new Date(ms).getUTCFullYear(), 0, 1);
	return Math.round((ms - start) / DAY_MS);
}

/**
 * Sorts the rows and fills every missing calendar day with tlmax = null,
 * so that "consecutive" in the array really means consecutive days.
 */
export function fillDailySeries(rows: DailyTmax[]): DailyTmax[] {
	const byDate = new Map<string, number | null>();
	for (const r of rows) {
		if (!r?.date) continue;
		const key = r.date.slice(0, 10);
		const value = typeof r.tlmax === 'number' && !isNaN(r.tlmax) ? r.tlmax : null;
		// keep a real value if the same date appears twice
		if (!byDate.has(key) || byDate.get(key) === null) byDate.set(key, value);
	}
	if (byDate.size === 0) return [];

	const dates = [...byDate.keys()].sort();
	const first = toUtc(dates[0]);
	const last = toUtc(dates[dates.length - 1]);

	const series: DailyTmax[] = [];
	for (let ms = first; ms <= last; ms += DAY_MS) {
		const date = toIso(ms);
		series.push({ date, tlmax: byDate.get(date) ?? null });
	}
	return series;
}

/**
 * Finds all heatwaves in a gap-free daily series (see fillDailySeries).
 * Returns index ranges [start, end] (inclusive).
 */
export function findHeatwaveRanges(series: DailyTmax[]): Array<[number, number]> {
	const t = series.map((d) => toTenths(d.tlmax));
	const isHot = (i: number) => t[i] !== null && (t[i] as number) >= 300;

	const ranges: Array<[number, number]> = [];
	let i = 0;
	while (i <= t.length - 3) {
		if (isHot(i) && isHot(i + 1) && isHot(i + 2)) {
			let end = -1;
			let sum = 0;
			for (let j = i; j < t.length; j++) {
				const v = t[j];
				// no day below 25 °C (a missing value ends the heatwave as well)
				if (v === null || v < 250) break;
				sum += v;
				// mean Tmax over the whole period must stay above 30 °C
				if (sum <= 300 * (j - i + 1)) break;
				end = j;
			}
			if (end >= i + 2) {
				ranges.push([i, end]);
				i = end + 1;
				continue;
			}
		}
		i++;
	}
	return ranges;
}

/** Runs the whole analysis and groups the result by calendar year */
export function analyseHeatwaves(rows: DailyTmax[]): HeatwaveYear[] {
	const series = fillDailySeries(rows);
	if (!series.length) return [];

	const ranges = findHeatwaveRanges(series);

	const firstYear = Number(series[0].date.slice(0, 4));
	const lastYear = Number(series[series.length - 1].date.slice(0, 4));
	const years = new Map<number, HeatwaveYear>();
	for (let y = firstYear; y <= lastYear; y++) {
		const n = daysInYear(y);
		years.set(y, {
			year: y,
			daysInYear: n,
			tmax: new Array(n).fill(null),
			waveIndex: new Array(n).fill(-1),
			waves: [],
			kyselyDays: 0,
			daysWithData: 0
		});
	}

	for (const d of series) {
		const y = years.get(Number(d.date.slice(0, 4)));
		if (!y || d.tlmax === null) continue;
		y.tmax[dayOfYear(d.date)] = d.tlmax;
		y.daysWithData++;
	}

	for (const [a, b] of ranges) {
		const values = series.slice(a, b + 1).map((d) => d.tlmax as number);
		const wave: Heatwave = {
			start: series[a].date,
			end: series[b].date,
			length: b - a + 1,
			maxTmax: Math.max(...values),
			meanTmax: Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
		};
		// a heatwave is assigned to every year it touches (in practice always one)
		for (let k = a; k <= b; k++) {
			const y = years.get(Number(series[k].date.slice(0, 4)));
			if (!y) continue;
			let idx = y.waves.indexOf(wave);
			if (idx === -1) idx = y.waves.push(wave) - 1;
			y.waveIndex[dayOfYear(series[k].date)] = idx;
			y.kyselyDays++;
		}
	}

	return [...years.values()];
}
