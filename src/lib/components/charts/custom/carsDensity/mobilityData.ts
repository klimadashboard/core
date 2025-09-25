import getDirectusInstance from '$lib/utils/directus';
import { readItems, readItem } from '@directus/sdk';
import { getRegions } from '$lib/utils/regions';
import { findMatchingRegion } from '$lib/utils/findMatchingRegion';
import { PUBLIC_VERSION } from '$env/static/public';

export interface RawMobilityRecord {
	period: string;
	region: string;
	category: 'Privat' | 'Firmen' | 'Insgesamt';
	value: number;
	source?: string;
}

export interface RegionShape {
	code: string;
	name: string;
	layer: string;
	country: string;
	population: number;
	center?: [number, number];
}

export interface RegionWithData extends RegionShape {
	carsPer1000Inhabitants: { period: string; value: number | null }[];
	carsPrivateShare: { period: string; value: number | null }[];
	carsCompanyShare: { period: string; value: number | null }[];
	cars: { period: string; value: number | null }[];
}

interface LoadedMobilityData {
	regions: RegionWithData[];
	periods: string[];
	source: string;
	country: RegionShape;
	preselected?: string;
}

// mobilityData.ts (only the changed/added parts shown)

export async function loadMobilityData(fetchFn: typeof fetch): Promise<LoadedMobilityData> {
	const directus = getDirectusInstance(fetchFn);
	const countryCode = PUBLIC_VERSION.toUpperCase();

	const data = await directus.request(
		readItems<RawMobilityRecord>('mobility_cars', {
			filter: {
				country: { _eq: countryCode },
				category: { _in: ['Privat', 'Firmen', 'Insgesamt'] }
			},
			fields: ['period', 'region', 'category', 'value', 'source'],
			limit: -1
		})
	);

	const sources = Array.from(new Set(data.map((d) => d.source).filter(Boolean)));
	const source = sources.join(', ');
	const periods = Array.from(new Set(data.map((d) => d.period))).sort(
		(a, b) => Number(a) - Number(b)
	);

	// ⬇️ load shapes
	const allShapes = await getRegions();
	const country = allShapes.find((r) => r.country == countryCode && r.layer == 'country');
	if (!country) throw new Error(`No country metadata found for code "${countryCode}"`);

	const muniShapes = allShapes.filter(
		(r) => r.country === countryCode && r.layer === 'municipality'
	);
	const districtShapes = allShapes.filter(
		(r) => r.country === countryCode && r.layer === 'district'
	);

	// helper: get all mobility records for a shape by code/code_short
	const byShape = (shape: any) =>
		data.filter(
			(d) => d.region === shape.code || (shape.code_short && d.region === shape.code_short)
		);

	// ⬇️ enrich municipalities (unchanged logic)
	const municipalities: RegionWithData[] = muniShapes.map((shape) => {
		const regionData = byShape(shape);
		const uniqPeriods = Array.from(new Set(regionData.map((d) => d.period))).sort(
			(a, b) => Number(a) - Number(b)
		);

		const cars = uniqPeriods.map((p) => {
			const total = regionData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value;
			return { period: p, value: total ?? null };
		});

		const carsPer1000Inhabitants = uniqPeriods.map((p) => {
			const total = cars.find((c) => c.period === p)?.value ?? null;
			return {
				period: p,
				value:
					total != null && shape.population ? Math.round((total / shape.population) * 1000) : null
			};
		});

		const carsPrivateShare = uniqPeriods.map((p) => {
			const privat = regionData.find((d) => d.category === 'Privat' && d.period === p)?.value;
			const total = regionData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value;
			return { period: p, value: privat != null && total ? (privat / total) * 100 : null };
		});

		const carsCompanyShare = uniqPeriods.map((p) => {
			const firmen = regionData.find((d) => d.category === 'Firmen' && d.period === p)?.value;
			const total = regionData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value;
			return { period: p, value: firmen != null && total ? (firmen / total) * 100 : null };
		});

		return { ...shape, carsPer1000Inhabitants, carsPrivateShare, carsCompanyShare, cars };
	});

	// ⬇️ helper to find child municipalities of a district
	const getChildren = (districtId: string) =>
		muniShapes.filter(
			(m) =>
				Array.isArray(m.parents) &&
				m.parents.some((p: any) => p.layer === 'district' && p.id === districtId)
		);

	// ⬇️ aggregate districts from their municipalities
	const districts: RegionWithData[] = districtShapes.map((shape) => {
		const children = getChildren(shape.id);
		// map child municipality -> enriched data lookup
		const childRows = children
			.map((c) => municipalities.find((m) => m.code === c.code))
			.filter((x): x is RegionWithData => !!x);

		const allPeriods = periods; // ensure same timeline
		const popSum = children.reduce((s, c) => s + (c.population ?? 0), 0);

		const cars = allPeriods.map((p) => {
			const sum = childRows.reduce((acc, r) => {
				const v = r.cars.find((d) => d.period === p)?.value ?? 0;
				return acc + v;
			}, 0);
			return { period: p, value: sum };
		});

		const carsPer1000Inhabitants = allPeriods.map((p) => {
			const total = cars.find((d) => d.period === p)?.value ?? 0;
			return {
				period: p,
				value: popSum > 0 ? Math.round((total / popSum) * 1000) : null
			};
		});

		const carsPrivateShare = allPeriods.map((p) => {
			let privatAbs = 0;
			let totalAbs = 0;
			for (const r of childRows) {
				const share = r.carsPrivateShare.find((d) => d.period === p)?.value;
				const abs = r.cars.find((d) => d.period === p)?.value;
				if (share != null && abs != null) {
					privatAbs += (share / 100) * abs;
					totalAbs += abs;
				}
			}
			return { period: p, value: totalAbs > 0 ? (privatAbs / totalAbs) * 100 : null };
		});

		const carsCompanyShare = allPeriods.map((p) => {
			let firmenAbs = 0;
			let totalAbs = 0;
			for (const r of childRows) {
				const share = r.carsCompanyShare.find((d) => d.period === p)?.value;
				const abs = r.cars.find((d) => d.period === p)?.value;
				if (share != null && abs != null) {
					firmenAbs += (share / 100) * abs;
					totalAbs += abs;
				}
			}
			return { period: p, value: totalAbs > 0 ? (firmenAbs / totalAbs) * 100 : null };
		});

		return {
			...shape,
			population: popSum,
			cars,
			carsPer1000Inhabitants,
			carsPrivateShare,
			carsCompanyShare
		};
	});

	// ⬇️ combine: municipalities + districts
	const regions: RegionWithData[] = [...municipalities, ...districts];

	const preselected = findMatchingRegion(undefined, regions); // now supports district URLs too
	return { regions, periods, source, country, preselected };
}

export function getRegionData(
	regions: RegionWithData[],
	selCode: string | null,
	country: RegionShape
): RegionWithData {
	// When a specific region is requested, return it as-is
	if (selCode) {
		return regions.find((r) => r.code === selCode || (r as any).code_short === selCode)!;
	}

	// ---- NATIONAL AGGREGATION (avoid double counting) ----
	// Prefer municipalities; if none exist (edge case), fall back to districts; otherwise use whatever we have.
	const base = regions.filter((r) => r.layer === 'municipality').length
		? regions.filter((r) => r.layer === 'municipality')
		: regions.filter((r) => r.layer === 'district').length
			? regions.filter((r) => r.layer === 'district')
			: regions;

	// Use periods from the base layer only
	const allPeriods = Array.from(new Set(base.flatMap((r) => r.cars.map((d) => d.period)))).sort(
		(a, b) => Number(a) - Number(b)
	);

	return {
		code: 'ALL',
		name: country?.name ?? '',
		population: country.population,
		layer: 'national',
		country: '',
		center: [10.45, 51.1657],

		carsPer1000Inhabitants: allPeriods.map((p) => {
			const totalCars = base.reduce((sum, r) => {
				const val = r.cars.find((d) => d.period === p)?.value;
				return sum + (val ?? 0);
			}, 0);
			return {
				period: p,
				value: country.population > 0 ? Math.round((totalCars / country.population) * 1000) : null
			};
		}),

		carsPrivateShare: allPeriods.map((p) => {
			let totalPrivat = 0;
			let total = 0;
			for (const r of base) {
				const share = r.carsPrivateShare.find((d) => d.period === p)?.value; // %
				const abs = r.cars.find((d) => d.period === p)?.value; // #
				if (share != null && abs != null) {
					totalPrivat += (share / 100) * abs;
					total += abs;
				}
			}
			return { period: p, value: total > 0 ? (totalPrivat / total) * 100 : null };
		}),

		carsCompanyShare: allPeriods.map((p) => {
			let totalFirmen = 0;
			let total = 0;
			for (const r of base) {
				const share = r.carsCompanyShare.find((d) => d.period === p)?.value; // %
				const abs = r.cars.find((d) => d.period === p)?.value; // #
				if (share != null && abs != null) {
					totalFirmen += (share / 100) * abs;
					total += abs;
				}
			}
			return { period: p, value: total > 0 ? (totalFirmen / total) * 100 : null };
		}),

		cars: allPeriods.map((p) => {
			const sum = base.reduce((acc, r) => {
				const val = r.cars.find((d) => d.period === p)?.value;
				return acc + (val ?? 0);
			}, 0);
			return { period: p, value: sum };
		})
	};
}

export function getRelatedRegions(
	regions: RegionWithData[],
	selectedRegion: string | null,
	viewKey: 'pop' | 'private' | 'company',
	selectedPeriod: string,
	country: RegionShape // ← explicitly passed
) {
	type Rel = RegionWithData & { value: number; distance?: number; type: string; typeLabel: string };
	const dataKey =
		viewKey === 'pop'
			? 'carsPer1000Inhabitants'
			: viewKey === 'private'
				? 'carsPrivateShare'
				: 'carsCompanyShare';

	const valid = regions
		.map((r) => {
			const entry = r[dataKey].find((d) => d.period === selectedPeriod);
			return entry?.value != null ? { ...r, value: entry.value } : null;
		})
		.filter((r): r is Rel => r != null);
	if (!valid.length) return [];

	const sorted = [...valid].sort((a, b) => a.value - b.value);
	const minRegion = { ...sorted[0], type: 'min', typeLabel: 'Minimum' };
	const maxRegion = { ...sorted[sorted.length - 1], type: 'max', typeLabel: 'Maximum' };

	const related: Rel[] = [minRegion, maxRegion];

	if (selectedRegion) {
		const sel = regions.find((r) => r.code === selectedRegion);
		if (sel?.center) {
			const haversine = (c1: [number, number], c2: [number, number]) => {
				const toRad = (d: number) => (d * Math.PI) / 180;
				const dLat = toRad(c2[1] - c1[1]);
				const dLon = toRad(c2[0] - c1[0]);
				const lat1 = toRad(c1[1]);
				const lat2 = toRad(c2[1]);
				const a =
					Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
				return 2 * 6371 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			};
			const nearby = valid
				.filter((r) => r.code !== selectedRegion && r.center)
				.map((r) => ({ ...r, distance: haversine(sel.center!, r.center!) }))
				.sort((a, b) => a.distance! - b.distance!)
				.slice(0, 3)
				.map((r) => ({ ...r, type: 'nearby', typeLabel: 'in der Nähe' }));
			related.push(...nearby);
		}

		// national average entry
		related.push({
			...getRegionData(regions, null, country), // pass the actual country object
			type: 'national',
			typeLabel: 'Nationaler Durchschnitt'
		} as any);
	}

	// dedupe and sort by value desc
	const seen = new Set<string>();
	return related
		.filter((r) => !seen.has(r.code) && (!selectedRegion || r.code !== selectedRegion))
		.map((r) => {
			seen.add(r.code);
			return r;
		})
		.sort((a, b) => b.value - a.value);
}
