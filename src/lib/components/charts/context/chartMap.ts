import { getContext, setContext, type Snippet } from 'svelte';
import { writable, type Writable } from 'svelte/store';

/**
 * Lets a chart hand its own map to the surrounding Card, which shows it in the "Karte" tab
 * (next to Grafik / Tabelle / Info). See ChartMap.svelte. The chart stays mounted while the
 * map tab is open, so the map can share the chart's state (data, selection).
 */
export interface ChartMapEntry {
	snippet: Snippet;
	/** Open the map tab first, as long as the reader hasn't picked a tab yet */
	isDefault: boolean;
}

const KEY = Symbol('chart-map');

export function provideChartMap(): Writable<ChartMapEntry | null> {
	return setContext(KEY, writable<ChartMapEntry | null>(null));
}

export function getChartMap(): Writable<ChartMapEntry | null> | undefined {
	return getContext(KEY);
}
