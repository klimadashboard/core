import { getContext, setContext, type Snippet } from 'svelte';
import { writable, type Writable } from 'svelte/store';

/**
 * Lets a chart hand its own controls to the surrounding Card, which renders them in its
 * settings area (next to the view switch and the download options). See ChartSettings.svelte.
 */
export interface ChartSetting {
	snippet: Snippet;
	/** Shown behind the "Mehr Einstellungen" toggle */
	secondary: boolean;
}

const KEY = Symbol('chart-settings');

export function provideChartSettings(): Writable<ChartSetting[]> {
	return setContext(KEY, writable<ChartSetting[]>([]));
}

export function getChartSettings(): Writable<ChartSetting[]> | undefined {
	return getContext(KEY);
}
