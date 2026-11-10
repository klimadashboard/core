/**
 * Comparison regions for the renewables chart: data per region (cached per
 * energy, shared by all views) and the per-km² ranking for "Top 3".
 */
import { growthCode, type ContextRegion } from '$lib/utils/regionContext';
import { getAggregateCodes, isAggregateRegion } from '$lib/utils/regionAggregation';
import { fetchComparisonData, type EnergyType, type RenewablesRawData } from './config';

/** Max comparison lines on top of the region itself (palette has 8 colours) */
export const MAX_COMPARISONS = 7;

const cache = new Map<string, Promise<RenewablesRawData[]>>();

/** Yearly data of a comparison region; failures are not cached */
export function loadComparisonData(r: ContextRegion, energy: EnergyType): Promise<RenewablesRawData[]> {
	const key = `${energy}-${r.id}`;
	if (!cache.has(key)) {
		const request = (async () => {
			// Metropolregion: sum of its members; Deutschland: no region filter (region=de has no rows)
			const code = isAggregateRegion(r) ? await getAggregateCodes(r) : growthCode(r);
			return fetchComparisonData(code ?? '', { energy });
		})();
		request.catch(() => cache.delete(key));
		cache.set(key, request);
	}
	return cache.get(key)!;
}

/** Regions sorted by installed power per km² (latest year), best first */
export async function rankByArea(list: ContextRegion[], energy: EnergyType): Promise<ContextRegion[]> {
	const withArea = list.filter((r) => r.area);
	const latest = await Promise.all(
		withArea.map(async (r) => {
			const d = await loadComparisonData(r, energy).catch(() => []);
			return (d.at(-1)?.cumulative_power_kw ?? 0) / r.area!;
		})
	);
	return withArea
		.map((r, i) => ({ r, v: latest[i] }))
		.sort((a, b) => b.v - a.v)
		.map((x) => x.r);
}
