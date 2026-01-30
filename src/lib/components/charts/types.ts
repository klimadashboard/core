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

/** Embed option definition for custom chart parameters */
export interface EmbedOption {
	/** Parameter name used in URL query string */
	key: string;
	/** Display label in embed modal */
	label: string;
	/** Available choices */
	choices: Array<{
		value: string;
		label: string;
	}>;
	/** Currently selected value */
	currentValue: string;
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
		/** Optional note to display below the source (e.g., privacy disclaimer) */
		note?: string;
	};
	/**
	 * Override for data availability check. When true, the chart is considered
	 * to have data even if raw[] is empty (useful for map views, etc.).
	 * When undefined, falls back to checking raw.length > 0.
	 */
	hasData?: boolean;
	/**
	 * Custom embed options that this chart supports.
	 * These will be displayed in the embed modal as configurable parameters.
	 */
	embedOptions?: EmbedOption[];
}
