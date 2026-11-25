export type MobilityRow = {
	period: string | null;
	region: string | null;
	value: number | null;
};

export type Country = {
	id: string;
	name_de: string | null;
};

export type YearRow = { year: number } & Record<string, number | null>;

/**
 * Pivots the long-format rows from the `mobility` table into one row per year
 * with one column per region (country code). Missing values stay `null`.
 */
export function pivotByYear(rows: MobilityRow[], regions: string[]): YearRow[] {
	const byYear = new Map<number, YearRow>();
	for (const r of rows) {
		if (!r.region || !regions.includes(r.region)) continue;
		const year = Number(r.period);
		if (!Number.isFinite(year)) continue;
		if (!byYear.has(year)) {
			const empty = { year } as YearRow;
			for (const id of regions) empty[id] = null;
			byYear.set(year, empty);
		}
		byYear.get(year)![r.region] = r.value ?? null;
	}
	return [...byYear.values()].sort((a, b) => a.year - b.year);
}

/** Latest year with a value for the given region */
export function latestPoint(rows: YearRow[], region: string): { year: number; value: number } | null {
	for (let i = rows.length - 1; i >= 0; i--) {
		const v = rows[i][region];
		if (v != null && Number.isFinite(v)) return { year: rows[i].year, value: v };
	}
	return null;
}
