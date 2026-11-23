// Trend projection (prototype): continue the latest total at the average yearly change
// of the last 3 or 5 years, linearly, up to the last climate-target year or until it hits 0.
// Works on the displayed totals, so it follows per-capita and Mt/t like the bars.

export type TrendWindow = 'off' | '3' | '5';

export interface Trend {
	startYear: number; // first year of the averaging window (actual year with data)
	endYear: number; // latest year with data
	targetYear: number;
	slope: number; // change per year, display units (negative = falling)
	zeroYear: number | null; // fractional year the line reaches 0, null if it doesn't fall
	points: { year: number; value: number }[];
	valueAt: (year: number) => number;
}

/**
 * @param groups year groups with `total` (display units)
 * @param latestYear last year with actual data
 * @param targetYear last climate-target year (end of the projection)
 */
export function computeTrend(
	groups: { year: number; total: number }[],
	latestYear: number,
	targetYear: number,
	window: TrendWindow
): Trend | null {
	if (window === 'off' || targetYear <= latestYear) return null;
	const n = Number(window);

	const totals = new Map(groups.filter((g) => g.total > 0).map((g) => [g.year, g.total]));
	const end = totals.get(latestYear);
	if (!end) return null;

	// Window start: exactly n years back; with sparse data fall back to the latest year
	// before that, so the average still spans at least n years
	const startYear = [...totals.keys()]
		.filter((y) => y <= latestYear - n)
		.sort((a, b) => b - a)[0];
	if (startYear === undefined) return null;
	const slope = (end - totals.get(startYear)!) / (latestYear - startYear);

	const valueAt = (year: number) => Math.max(0, end + slope * (year - latestYear));
	const zeroYear = slope < 0 ? latestYear + end / -slope : null;

	const points: { year: number; value: number }[] = [];
	for (let y = latestYear; y <= targetYear; y++) {
		if (zeroYear !== null && y >= zeroYear) {
			points.push({ year: zeroYear, value: 0 });
			break;
		}
		points.push({ year: y, value: valueAt(y) });
	}

	return { startYear, endYear: latestYear, targetYear, slope, zeroYear, points, valueAt };
}
