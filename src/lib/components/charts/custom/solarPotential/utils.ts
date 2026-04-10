import { formatLabel } from '$lib/utils/format';
import type { Solar_Potential_De } from '../../../../../types';

export function formatPercentage(value: number | null | undefined): string {
	if (value == null) return '-';
	return `${formatLabel(value, 1)}%`;
}

export function formatPower(value: number | null | undefined): string {
	if (value == null) return '-';
	return `${formatLabel(value, 1)} MWp`;
}

export function applyFiltersAndSort(
	municipalities: Solar_Potential_De[],
	searchTerm: string,
	selectedRegion: string,
	sortColumn: keyof Solar_Potential_De | null,
	sortDirection: 'asc' | 'desc'
): { filtered: Solar_Potential_De[]; globallySorted: Solar_Potential_De[] } {
	const globallySorted = [...municipalities].sort((a, b) => {
		const valueA = a.netPotentialShare;
		const valueB = b.netPotentialShare;
		if (valueA == null && valueB == null) return 0;
		if (valueA == null) return 1;
		if (valueB == null) return -1;
		return valueB - valueA;
	});

	let filtered = [...municipalities];

	if (searchTerm.trim()) {
		const term = searchTerm.toLowerCase();
		filtered = filtered.filter((m) => {
			const name = m.GEN?.toLowerCase() || '';
			const bez = m.BEZ?.toLowerCase() || '';
			return name.includes(term) || bez.includes(term);
		});
	}

	if (selectedRegion !== 'Gemeinden') {
		filtered = filtered.filter((m) => m.BEZ === selectedRegion);
	}

	if (sortColumn) {
		filtered.sort((a, b) => {
			const valueA = a[sortColumn];
			const valueB = b[sortColumn];

			if (valueA == null && valueB == null) return 0;
			if (valueA == null) return 1;
			if (valueB == null) return -1;

			if (typeof valueA === 'number' && typeof valueB === 'number') {
				return sortDirection === 'desc' ? valueB - valueA : valueA - valueB;
			}

			if (typeof valueA === 'string' && typeof valueB === 'string') {
				return sortDirection === 'desc'
					? valueB.localeCompare(valueA)
					: valueA.localeCompare(valueB);
			}

			return 0;
		});
	}

	return { filtered, globallySorted };
}
