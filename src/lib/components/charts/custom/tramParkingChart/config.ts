import type { ChartFetchParams, ChartData } from '$lib/components/charts/types';
import getDirectusInstance from '$lib/utils/directus';
import { readItems } from '@directus/sdk';

export async function fetchChartData({
	fetch: fetchFn
}: ChartFetchParams): Promise<ChartData | null> {
	try {
		const directus = getDirectusInstance(fetchFn);
		const items = await directus.request(
			readItems('mobility_tram_parking', {
				limit: -1,
				fields: ['id', 'date_start', 'lines', 'address', 'district']
			})
		);

		if (!items || items.length === 0) return null;

		const total = items.length;
		const dates = (items as any[])
			.map((i) => i.date_start)
			.filter(Boolean)
			.sort()
			.reverse();
		const updateDate = dates[0]?.slice(0, 10);

		const lineCounts = new Map<string, number>();
		for (const item of items as any[]) {
			if (!item.lines) continue;
			for (const line of item.lines.split(',')) {
				const l = line.trim();
				if (l) lineCounts.set(l, (lineCounts.get(l) || 0) + 1);
			}
		}
		const topLine = [...lineCounts.entries()].sort((a, b) => b[1] - a[1])[0];

		return {
			raw: items as any[],
			placeholders: {
				total,
				topLine: topLine?.[0] || '',
				topLineCount: topLine?.[1] || 0
			},
			meta: { source: 'Wiener Linien Störungsmeldungen | f59.at', updateDate }
		};
	} catch (e) {
		console.error('tramParkingChart fetchChartData error:', e);
		return null;
	}
}
