// $lib/components/charts/custom/ptSupply/config.ts
//
// Public transport supply (e.g. seat-km) per mode and year from `transport_pt_supply`.
// Modes, labels, colours and vehicle shapes come from the `transport_modes` lookup.
// Rows are stored at the region the source covers (e.g. a transport association's area
// at a Metropolregion); member regions fall back to it through their `parents`.

import type { ChartData, ChartFetchParams, TableColumn } from '$lib/components/charts/types';
import { readItems } from '@directus/sdk';
import getDirectusInstance from '$lib/utils/directus';
import { isShownOnPage } from '$lib/utils/regionAggregation';
import { formatNumber } from '$lib/utils/formatters';
import { t } from '$lib/utils/t';

export type Vehicle = 'train' | 'suburban_train' | 'metro' | 'tram' | 'bus';

export interface PtMode {
	key: string;
	label: string;
	vehicle: Vehicle;
	color: string;
	/** one value per year of `PtSupplyData.years`, null where missing */
	values: (number | null)[];
}

export interface PtSupplyData {
	years: number[];
	modes: PtMode[];
	totals: number[];
	type: string;
	operator: string | null;
	region: { id: string; name: string } | null;
	source: string | null;
	updateDate: string | null;
}

/** Translation key of the unit per `transport_pt_supply.type` */
const UNIT_KEYS: Record<string, string> = {
	seat_km: 'unit.seatKm',
	vehicle_km: 'unit.vehicleKm',
	passenger_km: 'unit.passengerKm'
};

/** Divisor and short label so the largest value reads as a small number (13,8 Mio.) */
export function getScale(max: number, translations: Record<string, string>) {
	if (max >= 1e9) return { divisor: 1e9, label: t(translations, 'unit.billionShort') };
	if (max >= 1e6) return { divisor: 1e6, label: t(translations, 'unit.millionShort') };
	return { divisor: 1, label: '' };
}

/** Relative change in percent, e.g. "+12 %" */
export const signedPercent = (v: number | null) =>
	v == null ? null : `${v > 0 ? '+' : v < 0 ? '−' : '±'}${formatNumber(Math.abs(v), 0)} %`;

export const unitLabel = (type: string, translations: Record<string, string>) =>
	t(translations, UNIT_KEYS[type] ?? type);

/** Labels are JSON `{de: '…', en: '…'}` in Directus */
function localized(label: unknown, lang: string, fallback: string): string {
	if (label && typeof label === 'object') {
		const l = label as Record<string, string>;
		return l[lang] ?? l.de ?? Object.values(l)[0] ?? fallback;
	}
	return typeof label === 'string' ? label : fallback;
}

export async function fetchPtSupply({
	regionId,
	parentIds,
	lang,
	fetch,
	chartConfig
}: Pick<ChartFetchParams, 'regionId' | 'parentIds' | 'lang' | 'fetch' | 'chartConfig'>): Promise<PtSupplyData | null> {
	if (!regionId) return null;
	const type: string = chartConfig?.type ?? 'seat_km';
	const candidates = [regionId, ...parentIds];
	const directus = getDirectusInstance(fetch);

	const rows = (await directus.request(
		readItems('transport_pt_supply', {
			filter: { region: { _in: candidates }, type: { _eq: type } },
			fields: [
				'year',
				'value',
				'operator',
				'source',
				'update',
				'region.id',
				'region.name',
				'region.layer',
				'region.visible',
				'mode.key',
				'mode.label',
				'mode.vehicle',
				'mode.color',
				'mode.sort'
			],
			sort: ['year'],
			limit: -1
		})
	)) as any[];

	// the closest region with data, unless it's an unlaunched aggregate seen from another page
	const regionRows = (id: string) => rows.filter((r) => r.region?.id === id);
	const dataRegionId = candidates.find(
		(id) => regionRows(id).length > 0 && isShownOnPage(regionRows(id)[0].region, regionId)
	);
	if (!dataRegionId) return null;
	const own = regionRows(dataRegionId).filter((r) => r.mode?.key && r.value != null);

	const years = [...new Set(own.map((r) => r.year as number))].sort((a, b) => a - b);
	const byMode = new Map<string, PtMode & { sort: number }>();
	for (const r of own) {
		let mode = byMode.get(r.mode.key);
		if (!mode) {
			mode = {
				key: r.mode.key,
				label: localized(r.mode.label, lang, r.mode.key),
				vehicle: r.mode.vehicle ?? 'train',
				color: r.mode.color ?? '#6b7280',
				sort: r.mode.sort ?? 0,
				values: years.map(() => null)
			};
			byMode.set(r.mode.key, mode);
		}
		mode.values[years.indexOf(r.year)] = r.value;
	}
	const modes = [...byMode.values()].sort((a, b) => a.sort - b.sort);
	const totals = years.map((_, i) => modes.reduce((sum, m) => sum + (m.values[i] ?? 0), 0));
	const updateDate = own.map((r) => r.update).filter(Boolean).sort().at(-1) ?? null;

	return {
		years,
		modes,
		totals,
		type,
		operator: own.find((r) => r.operator)?.operator ?? null,
		region: { id: dataRegionId, name: own[0].region.name },
		source: own.find((r) => r.source)?.source ?? null,
		updateDate
	};
}

export function buildChartData(data: PtSupplyData, translations: Record<string, string>): ChartData {
	const { years, modes, totals } = data;
	const n = years.length - 1;
	const { divisor, label: scaleLabel } = getScale(Math.max(...totals), translations);
	const unit = `${scaleLabel} ${unitLabel(data.type, translations)}`.trim();
	const fmt = (v: number | null) => (v == null ? '–' : formatNumber(v / divisor, 2));
	const pct = (a: number | null, b: number | null) => (a && b != null ? (b / a - 1) * 100 : null);

	// the mode with the largest absolute gain and its share of the total gain (heading text)
	const gains = modes.map((m) => ({ m, gain: (m.values[n] ?? 0) - (m.values[0] ?? 0) }));
	const top = [...gains].sort((a, b) => b.gain - a.gain)[0];
	const totalGain = totals[n] - totals[0];

	const columns: TableColumn[] = [
		{ key: 'year', label: t(translations, 'ui.time.year'), align: 'left' },
		...[...modes, { key: 'total', label: t(translations, 'table.total') }].map((c) => ({
			key: c.key,
			label: `${c.label} (${unit})`,
			align: 'right' as const,
			format: fmt
		}))
	];
	const rows = years.map((year, i) => ({
		year,
		...Object.fromEntries(modes.map((m) => [m.key, m.values[i]])),
		total: totals[i]
	}));

	return {
		raw: rows,
		table: { columns, rows, filename: `pt-supply-${data.type}` },
		placeholders: {
			firstYear: years[0],
			lastYear: years[n],
			totalFirst: fmt(totals[0]),
			totalLast: fmt(totals[n]),
			totalGain: fmt(totalGain),
			totalChange: signedPercent(pct(totals[0], totals[n])),
			unit,
			operator: data.operator,
			dataRegion: data.region?.name ?? null,
			topGainMode: top?.m.label ?? null,
			topGainChange: top ? signedPercent(pct(top.m.values[0], top.m.values[n])) : null,
			topGainShareOfTotal:
				top && totalGain > 0 ? formatNumber((top.gain / totalGain) * 100, 0) : null
		},
		meta: {
			source: data.source ?? data.operator ?? undefined,
			updateDate: data.updateDate ?? undefined
		}
	};
}

export async function fetchChartData(params: ChartFetchParams): Promise<ChartData | null> {
	try {
		const data = await fetchPtSupply(params);
		return data ? buildChartData(data, params.translations) : null;
	} catch (e) {
		console.error('[ptSupply] fetchChartData error:', e);
		return null;
	}
}
