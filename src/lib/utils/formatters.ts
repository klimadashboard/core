// $lib/utils/formatters.ts

/**
 * Format number with German locale
 */
export function formatNumber(value: number, decimals: number = 0): string {
	if (value == null || isNaN(value)) return '–';
	return new Intl.NumberFormat('de-DE', {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals
	}).format(value);
}

/**
 * Format power values (kW input) to appropriate unit
 */
export function formatPower(valueKw: number, energy?: 'solar' | 'wind'): string {
	if (valueKw == null || isNaN(valueKw)) return '–';

	const sign = valueKw < 0 ? '-' : '';
	const abs = Math.abs(valueKw);
	const suffix = energy === 'solar' ? 'p' : '';

	if (abs >= 1_000_000)
		return `${sign}${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}\u202FGW${suffix}`;
	if (abs >= 1_000)
		return `${sign}${(abs / 1_000).toFixed(abs >= 10_000 ? 1 : 2)}\u202FMW${suffix}`;
	if (abs > 0) return `${sign}${abs.toFixed(abs >= 10 ? 0 : 1)}\u202FkW${suffix}`;
	return `0\u202FkW${suffix}`;
}

/**
 * Get power unit string based on max value
 */
export function getPowerUnit(maxKw: number, energy?: 'solar' | 'wind'): string {
	const suffix = energy === 'solar' ? 'p' : '';
	if (maxKw >= 1_000_000) return `GW${suffix}`;
	if (maxKw >= 1_000) return `MW${suffix}`;
	return `kW${suffix}`;
}

/**
 * Convert kW to display unit
 */
export function convertPowerUnit(valueKw: number, maxKw: number): number {
	if (maxKw >= 1_000_000) return valueKw / 1_000_000;
	if (maxKw >= 1_000) return valueKw / 1_000;
	return valueKw;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
	if (value == null || isNaN(value)) return '–';
	return `${formatNumber(value, decimals)}\u202F%`;
}

/**
 * Format CO2 (tons input)
 */
export function formatCO2(tons: number): string {
	if (tons == null || isNaN(tons)) return '–';
	const abs = Math.abs(tons);
	const sign = tons < 0 ? '-' : '';
	if (abs >= 1_000_000) return `${sign}${formatNumber(abs / 1_000_000, 2)}\u202FMt CO₂`;
	if (abs >= 1_000) return `${sign}${formatNumber(abs / 1_000, 2)}\u202Fkt CO₂`;
	return `${sign}${formatNumber(abs, 0)}\u202Ft CO₂`;
}

/**
 * Format date
 */
export function formatDate(
	date: string | Date,
	format: 'short' | 'long' | 'datetime' = 'short'
): string {
	if (!date) return '–';
	const d = typeof date === 'string' ? new Date(date) : date;
	if (isNaN(d.getTime())) return '–';

	const opts: Intl.DateTimeFormatOptions =
		format === 'long'
			? { year: 'numeric', month: 'long', day: 'numeric' }
			: format === 'datetime'
				? { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
				: { year: 'numeric', month: '2-digit', day: '2-digit' };

	return d.toLocaleDateString('de-DE', opts);
}

/**
 * Format year
 */
export function formatYear(value: number | string): string {
	return value == null ? '–' : String(value);
}

/**
 * Format area
 */
export function formatArea(km2: number): string {
	if (km2 == null || isNaN(km2)) return '–';
	return `${formatNumber(km2, 0)}\u202Fkm²`;
}

/**
 * Format population
 */
export function formatPopulation(value: number): string {
	if (value == null || isNaN(value)) return '–';
	if (value >= 1_000_000) return `${formatNumber(value / 1_000_000, 2)}\u202FMio.`;
	return formatNumber(value, 0);
}
