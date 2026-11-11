import { getContext, setContext, type Snippet } from 'svelte';
import { writable, type Writable } from 'svelte/store';

/**
 * Lets a chart hand its own controls to the surrounding Card, which renders them in its
 * settings area (next to the view switch and the download options). See ChartSettings.svelte.
 */
const KEY = Symbol('chart-settings');

export function provideChartSettings(): Writable<Snippet[]> {
	return setContext(KEY, writable<Snippet[]>([]));
}

export function getChartSettings(): Writable<Snippet[]> | undefined {
	return getContext(KEY);
}
