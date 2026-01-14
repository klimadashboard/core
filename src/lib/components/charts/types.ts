// $lib/charts/types.ts

import type { Region } from '$lib/utils/getRegion';

/** Data point for charts */
export interface DataPoint {
	[key: string]: any;
}

/** Mark registration for tooltip aggregation */
export interface MarkRegistration {
	id: string;
	label: string;
	color: string;
	yField: string;
	getData: () => DataPoint[];
}

/** Hover state shared across marks */
export interface HoverState {
	x: any | null;
	clientX: number;
	clientY: number;
}

/** Table column */
export interface TableColumn {
	key: string;
	label: string;
	align?: 'left' | 'center' | 'right';
	format?: (value: any) => string;
}

/** Chart data exposed to Card */
export interface ChartData {
	raw: DataPoint[];
	table: {
		columns: TableColumn[];
		rows: DataPoint[];
		filename: string;
	};
	placeholders: Record<string, string | number | boolean | null>;
	meta: {
		updateDate?: string;
		source?: string;
		region?: Region | null;
	};
}
