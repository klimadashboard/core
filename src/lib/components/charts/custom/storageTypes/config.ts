// $lib/components/charts/custom/storageTypes/config.ts

import type { Region } from '$lib/utils/getRegion';

export interface StorageTypeConfig {
	key: string;
	label: string;
	image: string;
	/** Only show this type if the region has data for it */
	alwaysShow?: boolean;
}

export interface StorageTypeData {
	power_kw: number;
	capacity_kwh: number;
	units: number;
}

export interface StorageTypesResponse {
	by_period: Array<Record<string, any>>;
	categories: string[];
	update_date: string | null;
}

export { type Region };

// Category image IDs in Directus assets — battery types only
export const storageTypeConfigs: StorageTypeConfig[] = [
	{
		key: 'heimspeicher',
		label: 'Heimspeicher',
		image: '', // TODO: add Directus asset ID
		alwaysShow: true
	},
	{
		key: 'gewerbespeicher',
		label: 'Gewerbespeicher',
		image: '' // TODO: add Directus asset ID
	},
	{
		key: 'grossspeicher',
		label: 'Großspeicher',
		image: '' // TODO: add Directus asset ID
	}
];

export const baseAssetUrl = 'https://base.klimadashboard.org/assets';

export function getImageUrl(imageId: string, size: string = 'medium'): string {
	if (!imageId) return '';
	return `${baseAssetUrl}/${imageId}?key=${size}`;
}

export function formatNumber(value: number, locale: string = 'de-DE'): string {
	return value.toLocaleString(locale, { maximumFractionDigits: 0 });
}

export function formatCapacity(kwh: number): string {
	if (kwh >= 1_000_000) return `${(kwh / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} GWh`;
	if (kwh >= 1_000) return `${(kwh / 1_000).toLocaleString('de-DE', { maximumFractionDigits: 0 })} MWh`;
	return `${formatNumber(kwh)} kWh`;
}

export function formatPercentage(part: number, total: number): string {
	if (total === 0) return '0';
	const pct = Math.round((part / total) * 100);
	if (pct === 0 && part > 0) return '<1';
	if (pct === 100 && part < total) return '>99';
	return pct.toString();
}

/**
 * Extract current totals per category from the time-series data.
 * Uses the last row of the time series (latest cumulative values).
 */
function extractCurrentByCategory(
	data: StorageTypesResponse
): Record<string, StorageTypeData> {
	const byPeriod = data.by_period || [];
	if (byPeriod.length === 0) return {};

	const lastRow = byPeriod[byPeriod.length - 1]!;
	const currentYear = new Date().getFullYear();
	const thisYearRow = byPeriod.find((r) => r.period === currentYear);

	const result: Record<string, StorageTypeData> = {};

	for (const cat of data.categories || []) {
		const prefix = cat.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue');
		result[prefix] = {
			power_kw: lastRow[`${prefix}_cumulative_power_kw`] || 0,
			capacity_kwh: lastRow[`${prefix}_cumulative_capacity_kwh`] || 0,
			units: lastRow[`${prefix}_cumulative_units`] || 0
		};
	}

	return result;
}

/** Fetch storage types data */
export async function fetchStorageTypesData(
	region: Region | null
): Promise<{ currentByCategory: Record<string, StorageTypeData>; updateDate: string | null }> {
	const regionCode = region?.codeShort || region?.code;

	let url = 'https://base.klimadashboard.org/get-storage-growth?group=year';
	if (regionCode) url += `&region=${regionCode}`;

	const response = await fetch(url);
	if (!response.ok) throw new Error(`HTTP ${response.status}`);

	const data: StorageTypesResponse = await response.json();

	return {
		currentByCategory: extractCurrentByCategory(data),
		updateDate: data.update_date
	};
}

function formatUpdateDate(updateDate: string | null): string {
	if (!updateDate) return '';
	try {
		const date = new Date(updateDate);
		return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
	} catch {
		return updateDate;
	}
}

/** Build placeholders for text templates */
export function getPlaceholders(
	currentByCategory: Record<string, StorageTypeData>,
	region: Region | null,
	updateDate: string | null
): Record<string, string | number> {
	const totalUnits = Object.values(currentByCategory).reduce((s, d) => s + d.units, 0);
	const totalPower = Object.values(currentByCategory).reduce((s, d) => s + d.power_kw, 0);
	const totalCapacity = Object.values(currentByCategory).reduce((s, d) => s + d.capacity_kwh, 0);

	return {
		regionName: region?.name || 'Deutschland',
		totalUnits: formatNumber(totalUnits),
		totalPowerKw: formatNumber(totalPower),
		totalPowerMW: formatNumber(Math.round(totalPower / 1000)),
		totalCapacityKwh: formatNumber(totalCapacity),
		totalCapacityMWh: formatNumber(Math.round(totalCapacity / 1000)),
		updateDate: formatUpdateDate(updateDate)
	};
}

/** Build ChartData for Card.svelte */
export function buildChartData(
	currentByCategory: Record<string, StorageTypeData>,
	region: Region | null,
	updateDate: string | null
) {
	const formattedDate = formatUpdateDate(updateDate);
	const source = formattedDate
		? `Marktstammdatenregister der Bundesnetzagentur (Stand: ${formattedDate})`
		: 'Marktstammdatenregister der Bundesnetzagentur';

	const rows = storageTypeConfigs
		.filter((c) => currentByCategory[c.key])
		.map((c) => ({
			type: c.label,
			units: currentByCategory[c.key]!.units,
			power_kw: currentByCategory[c.key]!.power_kw,
			capacity_kwh: currentByCategory[c.key]!.capacity_kwh
		}));

	return {
		raw: rows,
		table: {
			columns: [
				{ key: 'type', label: 'Kategorie', align: 'left' as const },
				{
					key: 'units',
					label: 'Anzahl',
					align: 'right' as const,
					format: (v: number) => formatNumber(v)
				},
				{
					key: 'power_kw',
					label: 'Leistung (kW)',
					align: 'right' as const,
					format: (v: number) => formatNumber(v)
				},
				{
					key: 'capacity_kwh',
					label: 'Kapazität (kWh)',
					align: 'right' as const,
					format: (v: number) => formatNumber(v)
				}
			],
			rows,
			filename: 'speicher_kategorien'
		},
		placeholders: getPlaceholders(currentByCategory, region, updateDate),
		meta: {
			updateDate: updateDate || '',
			source,
			region
		}
	};
}
