// Reduction labels for climate targets ("−65 %", "−95 % Klimaneutralität").
// Data-driven: a climate-target row opts in by naming its reference year in `scenario`,
// e.g. scenario = 'reduction-vs-1990'. Rows without it keep the plain target bars.

import { isNetZeroTarget, type EmissionsRawData } from './config';

const REFERENCE_PATTERN = /^reduction-vs-(\d{4})$/;

export interface TargetLabel {
	year: number;
	// e.g. 65 for −65 %; null for a climate-neutrality target without a reference year,
	// which is then labelled "Klimaneutralität" only
	reductionPercent: number | null;
	baseYear: number | null;
	netZero: boolean;
}

/** Label with a computed reduction (target declares a reference year that has data). */
export type ReductionLabel = TargetLabel & { reductionPercent: number; baseYear: number };

export function hasReduction(label: TargetLabel): label is ReductionLabel {
	return label.reductionPercent !== null && label.baseYear !== null;
}

function referenceYear(entry: EmissionsRawData & { scenario?: string | null }): number | null {
	const match = entry.scenario?.match(REFERENCE_PATTERN);
	return match ? Number(match[1]) : null;
}

/**
 * Labels for targets that declare a reference year and whose reference year has data,
 * plus climate-neutrality targets without one ("Klimaneutralität", no percentage).
 */
export function getTargetLabels(data: EmissionsRawData[]): TargetLabel[] {
	const totals = new Map<number, number>();
	for (const d of data) {
		if (d.source === 'climate-target' || d.category === 'total') continue;
		totals.set(d.year, (totals.get(d.year) ?? 0) + d.value);
	}

	return data
		.filter((d) => d.source === 'climate-target' && d.type !== 'base-year')
		.map((d): TargetLabel | null => {
			const baseYear = referenceYear(d);
			const baseTotal = baseYear !== null ? totals.get(baseYear) : undefined;
			const netZero = isNetZeroTarget(d);
			if (baseYear === null || !baseTotal) {
				return netZero ? { year: d.year, reductionPercent: null, baseYear: null, netZero } : null;
			}
			return {
				year: d.year,
				reductionPercent: Math.round((1 - d.value / baseTotal) * 100),
				baseYear,
				netZero
			};
		})
		.filter((l): l is TargetLabel => l !== null)
		.sort((a, b) => a.year - b.year);
}

/** Explains a climate-neutrality target that still allows residual emissions (e.g. −95 %). */
export function getTargetNote(labels: TargetLabel[]): string | null {
	const neutral = labels.filter(hasReduction).find((l) => l.netZero && l.reductionPercent < 100);
	if (!neutral) return null;
	return `Klimaneutralität bedeutet hier ${formatReduction(neutral)}; die verbleibenden Emissionen müssen durch Senken ausgeglichen werden.`;
}

export function formatReduction(label: ReductionLabel): string {
	return `−${label.reductionPercent} % ggü. ${label.baseYear}`;
}
