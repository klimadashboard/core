// $lib/charts/utils/export.ts

import type { TableColumn } from '../types';

interface TableData {
	columns: TableColumn[];
	rows: Record<string, any>[];
	filename: string;
}

function download(content: string, filename: string, type: string) {
	const blob = new Blob([content], { type });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function exportCSV(table: TableData, regionCode?: string) {
	const { columns, rows, filename } = table;
	const header = columns.map((c) => c.label).join(',');
	const body = rows
		.map((row) =>
			columns
				.map((c) => {
					const v = row[c.key];
					if (v == null) return '';
					const s = String(v);
					return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
				})
				.join(',')
		)
		.join('\n');

	const name = regionCode ? `${filename}-${regionCode}.csv` : `${filename}.csv`;
	download(`${header}\n${body}`, name, 'text/csv;charset=utf-8');
}

export function exportJSON(data: any[], filename: string, regionCode?: string) {
	const name = regionCode ? `${filename}-${regionCode}.json` : `${filename}.json`;
	download(JSON.stringify(data, null, 2), name, 'application/json');
}

export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		const ta = document.createElement('textarea');
		ta.value = text;
		ta.style.position = 'fixed';
		ta.style.opacity = '0';
		document.body.appendChild(ta);
		ta.select();
		const ok = document.execCommand('copy');
		document.body.removeChild(ta);
		return ok;
	}
}

export function generateEmbedCode(chartId: string, regionId?: string): string {
	const base = typeof window !== 'undefined' ? window.location.origin : '';
	const url = regionId ? `${base}/embed/${chartId}?region=${regionId}` : `${base}/embed/${chartId}`;
	return `<iframe src="${url}" width="100%" height="450" frameborder="0"></iframe>`;
}
