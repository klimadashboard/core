import type { ChartFetchParams, ChartData, TableColumn } from '$lib/components/charts/types';

export type RegionCase = 'grossstadt' | 'mittelstadt' | 'kleinstadt' | 'kreis' | 'bundesland';

export interface HistEntry {
	net_potential_share: number;
	roofs_solar_share: number;
	net_power_kw: number;
	units_count: number;
	date: string;
}

const BASE_URL = 'https://base.klimadashboard.org/items/de_solar_potential_timeseries';

export interface SolarRegion {
	id: string;
	name: string;
	population?: number;
	layer?: string;       // 'municipality' | 'district' | 'state' | 'country'
	layer_label?: string;
	parents?: Array<{ id: string; layer: string }>;
	center?: [string, string]; // [lon, lat]
}

export interface SolarRankEntry {
	region: SolarRegion;
	potential: number;    // net_potential_share (%)
	daecher: number;      // roofs_solar_share (%)
	mwp: number;          // net_power_kw / 1000
	unitCount: number;    // units_count
	trend: number | null; // 6-month delta in pp, null if no prev data
	rc: number | null;    // rank change vs 6 months ago (positive = improved)
}

export type SolarNeighbourEntry = SolarRankEntry & { distKm: number };

export interface SolarStats {
	potential: number;
	daecher: number;
	dachPV: number;
	unitCount: number;
	trend: number;
	neuAnlagenMonat: number;
	neuLeistungMonat: number;
	updateDate: string;
	avgDE: number;        // avg net_potential_share across all regions
	avgDaecherDE: number; // avg roofs_solar_share across all regions
}

export interface SolarAverages {
	avgDE: number;
	avgDaecherDE: number;
	avgState: number | null;
	avgDaecherState: number | null;
	stateName: string;
}

function parseRegion(raw: unknown): SolarRegion {
	if (raw && typeof raw === 'object') {
		const r = raw as Record<string, unknown>;
		const rawCenter = r.center;
		const center: [string, string] | undefined =
			Array.isArray(rawCenter) && rawCenter.length >= 2
				? [String(rawCenter[0]), String(rawCenter[1])]
				: undefined;
		return {
			id: String(r.id ?? ''),
			name: String(r.name ?? ''),
			population: typeof r.population === 'number' ? r.population : undefined,
			layer: typeof r.layer === 'string' ? r.layer : undefined,
			layer_label: typeof r.layer_label === 'string' ? r.layer_label : undefined,
			parents: Array.isArray(r.parents) ? r.parents : [],
			center
		};
	}
	return { id: String(raw ?? ''), name: '', parents: [] };
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


const LATEST_FIELDS =
	`&fields[]=region.id&fields[]=region.name&fields[]=region.population` +
	`&fields[]=region.layer&fields[]=region.layer_label&fields[]=region.parents&fields[]=region.center` +
	`&fields[]=net_potential_share&fields[]=roofs_solar_share&fields[]=net_power_kw&fields[]=units_count`;

// Prev-period: only rank position and trend delta are needed — skip all display fields.
const PREV_FIELDS = `&fields[]=region.id&fields[]=net_potential_share`;

// Phase 1 — region's own history (1 request, fast, fatal on failure).
export async function fetchRegionData(
	regionId: string,
	customFetch: typeof globalThis.fetch = globalThis.fetch,
	signal?: AbortSignal
): Promise<{
	stats: SolarStats;
	history: HistEntry[];
	latestDate: string;
	prevDate: string;
} | null> {
	const opts: RequestInit = signal ? { signal } : {};
	const histUrl =
		`${BASE_URL}?filter[region][_eq]=${regionId}&sort=date&limit=-1` +
		`&fields[]=net_potential_share&fields[]=roofs_solar_share&fields[]=net_power_kw&fields[]=units_count&fields[]=date`;
	const histRes = await customFetch(histUrl, opts);
	if (!histRes.ok) return null;
	const history: HistEntry[] = (await histRes.json()).data ?? [];
	if (!history.length) return null;

	const latest = history[history.length - 1];
	const sixMonthsAgoIdx = Math.max(0, history.length - 7);
	const prev = history[sixMonthsAgoIdx];
	const monthCount = Math.max(history.length - 1 - sixMonthsAgoIdx, 1);

	const stats: SolarStats = {
		potential: latest.net_potential_share,
		daecher: latest.roofs_solar_share,
		dachPV: +(latest.net_power_kw / 1000).toFixed(3),
		unitCount: latest.units_count,
		trend: +(latest.net_potential_share - prev.net_potential_share).toFixed(4),
		neuAnlagenMonat: Math.round((latest.units_count - prev.units_count) / monthCount),
		neuLeistungMonat: Math.round((latest.net_power_kw - prev.net_power_kw) / monthCount),
		updateDate: latest.date,
		avgDE: 0,
		avgDaecherDE: 0
	};

	return { stats, history, latestDate: latest.date, prevDate: prev.date };
}

// Phase 2 — all-regions ranking (2 parallel requests, slow, never throws).
export async function fetchRankings(
	latestDate: string,
	prevDate: string,
	customFetch: typeof globalThis.fetch = globalThis.fetch,
	signal?: AbortSignal
): Promise<{ allRegions: SolarRankEntry[]; avgDE: number; avgDaecherDE: number }> {
	const empty = { allRegions: [], avgDE: 0, avgDaecherDE: 0 };
	const opts: RequestInit = signal ? { signal } : {};
	try {
		const [allLatestRes, allPrevRes] = await Promise.all([
			customFetch(
				`${BASE_URL}?filter[date][_eq]=${latestDate}&limit=-1&sort=-net_potential_share${LATEST_FIELDS}`,
				opts
			),
			customFetch(
				`${BASE_URL}?filter[date][_eq]=${prevDate}&limit=-1&sort=-net_potential_share${PREV_FIELDS}`,
				opts
			)
		]);

		if (!allLatestRes.ok) return empty;
		const rawLatest: Array<Record<string, unknown>> = (await allLatestRes.json()).data ?? [];

		const prevDataById: Record<string, { rank: number; potential: number }> = {};
		if (allPrevRes.ok) {
			const prevRaw: Array<Record<string, unknown>> = (await allPrevRes.json()).data ?? [];
			prevRaw.forEach((r, idx) => {
				const reg = parseRegion(r.region);
				if (reg.id) prevDataById[reg.id] = { rank: idx + 1, potential: r.net_potential_share as number };
			});
		}

		const avgDE = rawLatest.length
			? rawLatest.reduce((s, r) => s + (r.net_potential_share as number), 0) / rawLatest.length
			: 0;
		const avgDaecherDE = rawLatest.length
			? rawLatest.reduce((s, r) => s + (r.roofs_solar_share as number), 0) / rawLatest.length
			: 0;

		const allRegions: SolarRankEntry[] = rawLatest.map((r, idx) => {
			const region = parseRegion(r.region);
			const prevData = prevDataById[region.id];
			const currentRank = idx + 1;
			return {
				region,
				potential: r.net_potential_share as number,
				daecher: r.roofs_solar_share as number,
				mwp: +((r.net_power_kw as number) / 1000).toFixed(3),
				unitCount: r.units_count as number,
				trend: prevData != null ? +(((r.net_potential_share as number) - prevData.potential).toFixed(4)) : null,
				rc: prevData != null ? prevData.rank - currentRank : null
			};
		});

		return { allRegions, avgDE: +avgDE.toFixed(4), avgDaecherDE: +avgDaecherDE.toFixed(4) };
	} catch {
		return empty;
	}
}

// SSR entrypoint — calls both phases sequentially.
export async function fetchSolarData(
	regionId: string,
	customFetch: typeof globalThis.fetch = globalThis.fetch,
	signal?: AbortSignal
): Promise<{ stats: SolarStats; allRegions: SolarRankEntry[]; history: HistEntry[] } | null> {
	const regionData = await fetchRegionData(regionId, customFetch, signal);
	if (!regionData) return null;
	const { stats, history, latestDate, prevDate } = regionData;
	const { allRegions, avgDE, avgDaecherDE } = await fetchRankings(latestDate, prevDate, customFetch, signal);
	stats.avgDE = avgDE;
	stats.avgDaecherDE = avgDaecherDE;
	return { stats, allRegions, history };
}

export function buildChartData(stats: SolarStats, allRegions: SolarRankEntry[], regionName = ''): ChartData {
	const columns: TableColumn[] = [
		{ key: 'name', label: 'Gemeinde', align: 'left' },
		{
			key: 'potential',
			label: 'Genutztes Potential (%)',
			align: 'right',
			format: (v) => v.toFixed(2)
		},
		{ key: 'daecher', label: 'Dächer mit PV (%)', align: 'right', format: (v) => v.toFixed(2) },
		{ key: 'mwp', label: 'Leistung (MWp)', align: 'right', format: (v) => v.toFixed(3) },
		{
			key: 'unitCount',
			label: 'PV-Anlagen',
			align: 'right',
			format: (v) => v.toLocaleString('de-DE')
		}
	];

	return {
		raw: allRegions,
		table: {
			columns,
			rows: allRegions.map((r) => ({
				name: r.region.name,
				potential: r.potential,
				daecher: r.daecher,
				mwp: r.mwp,
				unitCount: r.unitCount
			})),
			filename: 'solarpotential-ranking'
		},
		placeholders: {
			regionName,
			potential: stats.potential,
			potentialFormatted: stats.potential.toFixed(1).replace('.', ',') + ' %',
			daecher: stats.daecher,
			daecherFormatted: stats.daecher.toFixed(1).replace('.', ',') + ' %',
			dachPV: stats.dachPV,
			dachPVFormatted: stats.dachPV.toFixed(1).replace('.', ',') + ' MWp',
			unitCount: stats.unitCount,
			unitCountFormatted: stats.unitCount.toLocaleString('de-DE'),
			trend: stats.trend,
			trendFormatted: (stats.trend >= 0 ? '+' : '') + stats.trend.toFixed(2).replace('.', ',') + ' %P',
			neuAnlagenMonat: stats.neuAnlagenMonat,
			neuLeistungMonat: stats.neuLeistungMonat,
			updateDate: stats.updateDate,
			avgDE: stats.avgDE,
			avgDEFormatted: stats.avgDE.toFixed(1).replace('.', ',') + ' %',
			avgDaecherDE: stats.avgDaecherDE,
			avgDaecherDEFormatted: stats.avgDaecherDE.toFixed(1).replace('.', ',') + ' %'
		},
		meta: {
			source: 'MaStR / DLR EO Solar',
			updateDate: stats.updateDate
		}
	};
}

export async function fetchChartData({
	fetch,
	regionId
}: ChartFetchParams): Promise<ChartData | null> {
	if (!regionId) return null;
	const result = await fetchSolarData(regionId, fetch);
	if (!result) return null;
	return buildChartData(result.stats, result.allRegions);
}
