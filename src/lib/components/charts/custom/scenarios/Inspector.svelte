<script lang="ts">
	import { page } from '$app/state';
	import centroid from '@turf/centroid';
	import type { GeoJSONFeature } from 'maplibre-gl';
	import BoxPlotChart from './BoxPlotChart.svelte';

	export let selection: GeoJSONFeature;
	export let indicators;
	// export let warmingLevels;

	$: if (selection) {
		console.log(selection);
	}

	let locationName: String | null;
	let debounceTimeout: string | number | NodeJS.Timeout | undefined;

	$: if (selection != null) {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(handleSelection, 100);
	}

	// $: indicators = Object.keys(selection.properties.indicators);

	async function handleSelection() {
		if (!selection?.properties?.customSelection) {
			locationName = page.data.page.name ?? null;
		} else {
			try {
				const { geometry } = centroid(selection);
				const res = await fetch(
					`https://api.mapbox.com/geocoding/v5/mapbox.places/${geometry.coordinates[0]},${geometry.coordinates[1]}.json?access_token=pk.eyJ1Ijoia2xpbWFkYXNoYm9hcmQiLCJhIjoiY2x5eTl3cGR5MXQ5ZTJscXNmNXR5aG44eiJ9.iPxhi0LuuA0Nxzzp8cXU7Q&language=de`
				);
				const data = await res.json();
				locationName = data.features
					.filter(
						({ place_type = '' }) => place_type.includes('place') || place_type.includes('region')
					)
					.map(({ text = '' }) => text)
					.join(', ');
			} catch (e) {
				console.error('Geocoding failed', e);
				locationName = null;
			}
		}
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
			<div class="grid md:grid-cols-2 gap-10">
				{#each indicators as indicator}
					<div>
						<h3 class="font-bold">Anzahl {indicator.label} pro Jahr</h3>
						<BoxPlotChart data={selection.properties[indicator.key]} tint="rgb(245, 73, 0)" />
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<p>Wähle eine Region aus, um mehr Informationen zu den lokalen Klimaszenarien zu erhalten.</p>
	{/if}
</div>

<style>
	/* @import 'tailwindcss'; */
</style>
