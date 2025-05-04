<script lang="ts">
	import { page } from '$app/state';
	import type { CompanyEmission, CompanyEmissionArray } from './types';

	export let data: CompanyEmissionArray;

	function escapeCSVValue(value: string | number | null | undefined) {
		if (typeof value === 'string') {
			// Escape double quotes by doubling them
			const escaped = value.replace(/"/g, '""');
			// Wrap in quotes only if string contains special characters
			if (escaped.search(/("|,|\n)/g) >= 0) {
				return `"${escaped}"`;
			}
			return escaped;
		}
		// Leave numbers and other types as-is
		return value ?? ''; // fallback to empty if null/undefined
	}

	function downloadCSV() {
		if (!data || !Array.isArray(data) || data.length === 0) {
			alert('No data to download.');
			return;
		}

		const headers = Object.keys(data[0]) as (keyof CompanyEmission)[];
		const rows = data.map((row) => headers.map((header) => escapeCSVValue(row[header])).join(','));
		const csvContent = [headers.join(','), ...rows].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute('download', 'data.csv');
		link.click();
		URL.revokeObjectURL(url);
	}
</script>

<button on:click={downloadCSV} class="button text-sm mt-2"
	>{page.data.translations.downloadData} (.csv)</button
>
