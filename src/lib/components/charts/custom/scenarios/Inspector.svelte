<script lang="ts">
	import { page } from '$app/state';
	import centroid from '@turf/centroid';
	import type { GeoJSONFeature } from 'maplibre-gl';
	import BoxPlotChart from './BoxPlotChart.svelte';

	type BoxPlotData = {
		q90: number;
		q50: number;
		q10: number;
		delta: number;
		label: string;
	};

	export let selection: GeoJSONFeature;
	export let indicators: { key: string; label: string; labelLong: string }[];
	export let warmingLevels: { key: string; label: string }[];
	export let activeIndicator: string;
	export let activeWarming: string;

	let locationName: String | null;
	let debounceTimeout: string | number | NodeJS.Timeout | undefined;

	$: if (selection != null) {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(handleSelection, 100);
	}

	let syncAxis = true;

	$: maxDays =
		(syncAxis &&
			Math.max(
				...indicators.map(({ key }) => {
					const indicator = selection?.properties?.[key];
					if (indicator == null) return 0;
					return Math.max(
						...Object.entries(indicator)
							.filter(([key]) => key != 'current')
							.map(([key, value]) => (value as BoxPlotData).q90),
						10
					);
				})
			)) ??
		null;

	async function handleSelection() {
		if (!selection?.properties?.customSelection) {
			locationName = page.data.page.name ?? null;
		} else {
			try {
				const { geometry } = centroid(selection);
				const [lon, lat] = geometry.coordinates;

				const res = await fetch(
					`https://base.klimadashboard.org/get-location-name?lat=${lat}&lon=${lon}`
				);
				const data = await res.json();
				locationName = data.name;
			} catch (e) {
				console.error('Geocoding failed', e);
				locationName = null;
			}
		}
	}

	$: indicatorLabel = indicators.find(({ key }) => key === activeIndicator)?.labelLong;
	$: warmingLabel = warmingLevels.find(({ key }) => key === activeWarming)?.label;
	$: selectionValue =
		activeWarming === 'current'
			? selection?.properties[activeIndicator][activeWarming]
			: selection?.properties[activeIndicator][activeWarming].q50;

	$: selectionChange =
		selectionValue && selectionValue / selection?.properties[activeIndicator].current;

	function formatValue(value: number, fractionDigits = 0) {
		return value?.toFixed(fractionDigits) ?? '?';
	}
</script>

<div
	class="bg-white text-lg dark:bg-gray-900 border border-current/10 shadow p-4 rounded-2xl -mt-10 z-30 relative max-w-3xl mx-auto"
>
	{#if selection}
		<div class="grid md:grid-cols-1 gap-4">
			<h2 class="text-2xl font-bold mb-2">
				Klimaszenarien <span class="font-normal"
					>nahe <span class="underline underline-offset-4 decoration-current/20"
						>{locationName || 'unbekannt'}</span
					>
				</span>
			</h2>
			<p>
				Bei einer globalen Erwärmung von {warmingLabel} gibt es etwa {formatValue(selectionValue)}
				{indicatorLabel} im Jahr.
				{#if activeWarming !== 'current'}
					Das sind {formatValue(selectionChange, 1)} mal so viele wie heute.
				{/if}
			</p>
			<div class="grid md:grid-cols-2 gap-10">
				{#each indicators as indicator}
					<div>
						<h3 class="font-bold">Anzahl {indicator.label} pro Jahr</h3>
						<BoxPlotChart
							data={selection.properties[indicator.key]}
							tint="rgb(245, 73, 0)"
							{maxDays}
						/>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<p>Wähle eine Region aus, um mehr Informationen zu den lokalen Klimaszenarien zu erhalten.</p>
	{/if}
	<p class="text-sm mt-4">Datenquelle: BOKU [Platzhalter, tbc]; SPARTACUS</p>
</div>

<style>
	/* @import 'tailwindcss'; */
</style>
