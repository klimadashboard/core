// Battery-electric share of new passenger car registrations: Norway, Denmark, China, Austria.
// Data: Robbie Andrew, "Collected vehicle registration data" (CC BY 4.0), one CSV per country, updated monthly:
//   https://robbieandrew.github.io/carsales/data/<country>_carsales_monthly.csv
// Columns differ per country (China only has ICE / Plugin hybrid / Battery electric),
// so everything that is neither battery electric nor plug-in hybrid counts as "fossil" (incl. non-plug-in hybrids).
import type { ChartData, ChartFetchParams } from '$lib/components/charts/types';
import { formatNumber } from '$lib/utils/formatters';

export const SOURCE = 'Robbie Andrew, Collected vehicle registration data (CC BY 4.0)';
export const SOURCE_URL = 'https://robbieandrew.github.io/carsales/';
export const START = '2018-01';

export const COUNTRIES = [
	{ key: 'norway', label: 'Norwegen', color: '#2a78d6', dash: null, group: 'done' },
	{ key: 'denmark', label: 'Dänemark', color: '#6250d6', dash: '9 3 2 3', group: 'done' },
	{ key: 'china', label: 'China', color: '#1baf7a', dash: '2 3', group: 'onTheWay' },
	{ key: 'austria', label: 'Österreich', color: '#eb6834', dash: '6 3', group: 'onTheWay' }
] as const;
export type CountryKey = (typeof COUNTRIES)[number]['key'];

export const MIX = [
	{ key: 'bev', label: 'Batterieelektrisch', color: '#1a9850' },
	{ key: 'phev', label: 'Plug-in-Hybrid', color: '#91cf60' },
	{ key: 'fossil', label: 'Verbrenner (inkl. Hybrid ohne Stecker)', color: '#9ca3af' }
] as const;

export type MonthRow = { month: string; bev: number; phev: number; fossil: number; total: number };
export type CarSalesData = Record<CountryKey, MonthRow[]>;

function parseCsv(text: string): MonthRow[] {
	const [head, ...lines] = text.trim().split(/\r?\n/);
	const cols = head.split(',').map((c) => c.replace(/"/g, '').trim());
	const iMonth = cols.indexOf('YYYYMM');
	const iBev = cols.indexOf('Battery electric');
	const iPhev = cols.indexOf('Plugin hybrid');
	if (iMonth < 0 || iBev < 0 || iPhev < 0) throw new Error('unexpected carsales CSV columns: ' + cols.join(', '));
	const rows: MonthRow[] = [];
	for (const line of lines) {
		const v = line.split(',');
		const ym = v[iMonth]?.trim();
		if (!ym || ym.length !== 6) continue;
		const month = `${ym.slice(0, 4)}-${ym.slice(4)}`;
		if (month < START) continue;
		const nums = v.map((x) => (x.trim() === '' ? 0 : Number(x)));
		const total = nums.reduce((s, n, i) => (i === iMonth || isNaN(n) ? s : s + n), 0);
		if (!total) continue;
		const bev = nums[iBev] || 0;
		const phev = nums[iPhev] || 0;
		rows.push({ month, bev, phev, fossil: total - bev - phev, total });
	}
	return rows;
}

/** loads all four countries; pass the `fetch` of ChartFetchParams on the server (4 h cache) */
export async function fetchCarSales(fetchFn: typeof fetch = fetch): Promise<CarSalesData> {
	const entries = await Promise.all(
		COUNTRIES.map(async (c) => {
			const res = await fetchFn(`https://robbieandrew.github.io/carsales/data/${c.key}_carsales_monthly.csv`);
			if (!res.ok) throw new Error(`carsales ${c.key}: HTTP ${res.status}`);
			return [c.key, parseCsv(await res.text())] as const;
		})
	);
	return Object.fromEntries(entries) as CarSalesData;
}

export const MONTHS = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const monthLabel = (m: string) => `${MONTHS[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`;
export const share = (r: MonthRow | undefined, k: 'bev' | 'phev' | 'fossil' = 'bev') => (r && r.total ? (r[k] / r.total) * 100 : null);

/** latest month that all four countries have */
export function commonLatestMonth(data: CarSalesData): string | null {
	const lasts = COUNTRIES.map((c) => data[c.key]?.at(-1)?.month).filter(Boolean) as string[];
	return lasts.length === COUNTRIES.length ? lasts.sort()[0] : null;
}

export function buildChartData(data: CarSalesData): ChartData {
	const latest = commonLatestMonth(data);
	const months = [...new Set(COUNTRIES.flatMap((c) => data[c.key].map((r) => r.month)))].sort();
	const byMonth = Object.fromEntries(COUNTRIES.map((c) => [c.key, new Map(data[c.key].map((r) => [r.month, r]))]));
	const rows = months.map((m) => ({
		month: monthLabel(m),
		...Object.fromEntries(COUNTRIES.map((c) => [c.key, share(byMonth[c.key].get(m))]))
	}));
	const at = (k: CountryKey) => (latest ? share(byMonth[k].get(latest)) : null);
	const fmt = (v: any) => (v == null ? '–' : `${formatNumber(v, 1)} %`);
	return {
		raw: data,
		table: {
			columns: [
				{ key: 'month', label: 'Monat', align: 'left' },
				...COUNTRIES.map((c) => ({ key: c.key, label: `${c.label} (BEV-Anteil)`, align: 'right' as const, format: fmt }))
			],
			rows,
			filename: 'e_auto_anteil_norwegen_daenemark_china_oesterreich'
		},
		placeholders: {
			latestMonth: latest ? monthLabel(latest) : '',
			norwayShare: formatNumber(at('norway') ?? 0, 1),
			denmarkShare: formatNumber(at('denmark') ?? 0, 1),
			chinaShare: formatNumber(at('china') ?? 0, 1),
			austriaShare: formatNumber(at('austria') ?? 0, 1)
		},
		meta: {
			source: SOURCE,
			note: 'Anteil batterieelektrischer Autos an allen Pkw-Neuzulassungen. „Verbrenner“ umfasst auch Hybride ohne Stecker, weil die chinesischen Daten sie nicht getrennt ausweisen.'
		}
	};
}

export async function fetchChartData({ fetch }: ChartFetchParams): Promise<ChartData | null> {
	try {
		return buildChartData(await fetchCarSales(fetch));
	} catch {
		return null;
	}
}
