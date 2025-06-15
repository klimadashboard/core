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
	outline_simple: any;
	population: number;
	center?: [number, number];
}

export interface RegionWithData extends RegionShape {
	outline: any;
	carsPer1000Inhabitants: { period: string; value: number | null }[];
	carsPrivateShare: { period: string; value: number | null }[];
	carsCompanyShare: { period: string; value: number | null }[];
}

interface LoadedMobilityData {
	regions: RegionWithData[];
	periods: string[];
	source: string;
	countryName: string;
	preselected?: string;
}

export async function loadMobilityData(fetchFn: typeof fetch): Promise<LoadedMobilityData> {
	const directus = getDirectusInstance(fetchFn);
	const countryCode = PUBLIC_VERSION.toUpperCase();

	// Fetch mobility records
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

	// Consolidate source and periods
	const sources = Array.from(new Set(data.map((d) => d.source).filter(Boolean)));
	const source = sources.join(', ');
	const periods = Array.from(new Set(data.map((d) => d.period))).sort(
		(a, b) => Number(a) - Number(b)
	);

	// Load and filter region shapes
	const layerFilter = countryCode === 'AT' ? 'municipality' : 'district';
	const allShapes = await getRegions();
	const shapes = allShapes.filter((r) => r.country === countryCode && r.layer === layerFilter);

	// Load country metadata
	const countryItem = await directus.request(readItem('countries', countryCode));
	const countryName = countryItem?.name_de ?? countryCode;

	// Enrich shapes with series data
	const regions: RegionWithData[] = shapes.map((shape) => {
		const regionData = data.filter((d) => d.region === shape.code);
		const uniqPeriods = Array.from(new Set(regionData.map((d) => d.period))).sort(
			(a, b) => Number(a) - Number(b)
		);

		const carsPer1000Inhabitants = uniqPeriods.map((p) => {
			const total = regionData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value;
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

		return {
			...shape,
			outline: shape.outline_simple,
			carsPer1000Inhabitants,
			carsPrivateShare,
			carsCompanyShare
		};
	});

	// Preselect region if URL matches
	const preselected = findMatchingRegion(undefined, regions);

	return { regions, periods, source, countryName, preselected };
}

export function getRegionData(
	regions: RegionWithData[],
	selCode: string | null,
	countryName: string
): RegionWithData {
	if (selCode) {
		return regions.find((r) => r.code === selCode)!;
	}
	// National average
	const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
	const allPeriods = Array.from(
		new Set(regions.flatMap((r) => r.carsPer1000Inhabitants.map((d) => d.period)))
	).sort((a, b) => Number(a) - Number(b));

	return {
		code: 'ALL',
		name: countryName,
		layer: 'national',
		country: '',
		outline_simple: null,
		population: 0,
		center: [10.45, 51.1657],
		outline: null,
		carsPer1000Inhabitants: allPeriods.map((p) => ({
			period: p,
			value: Math.round(
				avg(regions.map((r) => r.carsPer1000Inhabitants.find((d) => d.period === p)?.value || 0))
			)
		})),
		carsPrivateShare: allPeriods.map((p) => ({
			period: p,
			value: avg(regions.map((r) => r.carsPrivateShare.find((d) => d.period === p)?.value || 0))
		})),
		carsCompanyShare: allPeriods.map((p) => ({
			period: p,
			value: avg(regions.map((r) => r.carsCompanyShare.find((d) => d.period === p)?.value || 0))
		}))
	};
}

export function getRelatedRegions(
	regions: RegionWithData[],
	selectedRegion: string | null,
	viewKey: 'pop' | 'private' | 'company',
	selectedPeriod: string
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
			...getRegionData(regions, null, ''),
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
