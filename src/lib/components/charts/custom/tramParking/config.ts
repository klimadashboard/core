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
				fields: [
					'id',
					'incident_id',
					'date_start',
					'lines',
					'address',
					'address_category',
					'lat',
					'lon',
					'district'
				]
			})
		);

		if (!items || items.length === 0) return null;

		const total = items.length;
		const geocoded = items.filter((i: any) => i.lat != null);

		// Find most recent date
		const dates = items
			.map((i: any) => i.date_start)
			.filter(Boolean)
			.sort()
			.reverse();
		const updateDate = dates[0]?.slice(0, 10);

		// Count by line
		const lineCounts = new Map<string, number>();
		for (const item of items) {
			if (!(item as any).lines) continue;
			for (const line of (item as any).lines.split(',')) {
				const l = line.trim();
				if (l) lineCounts.set(l, (lineCounts.get(l) || 0) + 1);
			}
		}
		const topLine = [...lineCounts.entries()].sort((a, b) => b[1] - a[1])[0];

		// Count by address
		const addrCounts = new Map<string, number>();
		for (const item of items) {
			const addr = (item as any).address;
			if (addr) addrCounts.set(addr, (addrCounts.get(addr) || 0) + 1);
		}
		const topAddr = [...addrCounts.entries()].sort((a, b) => b[1] - a[1])[0];

		return {
			raw: items as any[],
			table: {
				columns: [
					{ key: 'date_start', label: 'Datum' },
					{ key: 'address', label: 'Adresse' },
					{ key: 'lines', label: 'Linien' },
					{ key: 'district', label: 'Bezirk' }
				],
				rows: items.slice(0, 100) as any[],
				filename: 'falschparker-wien'
			},
			placeholders: {
				total,
				geocoded: geocoded.length,
				topLine: topLine?.[0] || '',
				topLineCount: topLine?.[1] || 0,
				topAddress: topAddr?.[0] || '',
				topAddressCount: topAddr?.[1] || 0
			},
			meta: {
				updateDate,
				source: 'Wiener Linien Störungsmeldungen | f59.at'
			},
			hasData: true,
			allowDataDownload: true
		};
	} catch (e) {
		console.error('tramParking fetchChartData error:', e);
		return null;
	}
}
