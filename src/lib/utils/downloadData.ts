// functions to download data as CSV/JSON in the frontend

export function downloadJSON(data: any, filename = 'data.json') {
	if (!data || data.length === 0) return;

	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function downloadCSV(data: any[], filename = 'data.csv') {
	if (!data || data.length === 0) return;

	const rows: Record<string, any>[] = [];

	for (const r of data) {
		for (const d of r.data) {
			rows.push({
				region: r.name,
				layer: r.layer_label,
				year: d.year,
				value: d.value,
				unit: d.unit,
				category: d.category,
				category_label: d.category_label
			});
		}
	}

	if (rows.length === 0) return;

	const header = Object.keys(rows[0]);
	const csvContent = [
		header.join(','),
		...rows.map((row) => header.map((field) => JSON.stringify(row[field] ?? '')).join(','))
	].join('\n');

	const blob = new Blob([csvContent], { type: 'text/csv' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
