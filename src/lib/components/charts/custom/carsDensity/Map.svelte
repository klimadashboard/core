<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { scaleThreshold } from 'd3-scale';
	import { interpolateRgb } from 'd3-interpolate';
	import { fade } from 'svelte/transition';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/state';
	import Loader from '$lib/components/Loader.svelte';

	type LayerPlural = 'municipalities' | 'districts' | 'states';
	type LayerSingular = 'municipality' | 'district' | 'state';

	const layers = [
		{
			key: 'municipalities' as LayerPlural,
			keySingular: 'municipality' as LayerSingular,
			zoom: 9.5
		},
		{ key: 'districts' as LayerPlural, keySingular: 'district' as LayerSingular, zoom: 7 }
	];

	// Props
	export let selectedRegion: string | null = null; // region code to highlight (e.g. AGS/RS)
	export let selectedLayer: LayerPlural = 'municipalities';
	export let selectedPeriod: string;
	export let regions: Array<{
		code: string | number;
		center?: [number, number];
		name?: string;
		data?: Array<{ period: string | number; value: number | null }>;
	}> = [];
	export let colors: [string, string] = ['#fee5d9', '#a50f15'];
	export let unit = '';
	export let max = 0; // not used for threshold scale, but kept for UI parity

	// Map state
	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map;
	let mapReady = false;
	let zoomLevel = 0;

	// UI state
	let legendSteps: Array<{ color: string; label: string }> = [];
	let switchingLayer = false;

	// Dispatch (on click we emit the region code)
	const dispatch = createEventDispatcher();

	// Country default view
	const CC = PUBLIC_VERSION.toUpperCase();
	const defaultView = {
		AT: { center: [13.333, 47.5], zoom: 6 },
		DE: { center: [10.45, 51.1657], zoom: 5 }
	} as const;
	const { center, zoom } = defaultView[CC] || defaultView.DE;

	// ------------------------------------------------------------------------
	// Helpers
	// ------------------------------------------------------------------------

	function getInterpolatedColors(start: string, end: string, steps: number): string[] {
		const interp = interpolateRgb(start, end);
		return Array.from({ length: steps }, (_, i) => interp(i / (steps - 1)));
	}

	function createColorScale(data: Array<{ region: string; value: number }>) {
		if (!Array.isArray(data) || data.length === 0) {
			return { scale: () => '#F2F2F2', range: [], thresholds: [] as number[] };
		}
		const values = data.map((d) => d.value).filter((v) => v != null) as number[];
		if (!values.length) return { scale: () => '#F2F2F2', range: [], thresholds: [] as number[] };

		const sorted = [...values].sort((a, b) => a - b);
		const steps = 7;
		const thresholds = Array.from({ length: steps - 1 }, (_, i) => {
			const p = (i + 1) / steps;
			return sorted[Math.floor(p * sorted.length)];
		});
		const colorRange = getInterpolatedColors(colors[0], colors[1], steps);
		const scale = scaleThreshold(thresholds, colorRange);
		return { scale, range: colorRange, thresholds };
	}

	function tilesURLForLayer(layer: LayerPlural) {
		const cc = PUBLIC_VERSION.toLowerCase();
		return `https://tiles.klimadashboard.org/data/${layer}-${cc}/{z}/{x}/{y}.pbf`;
	}
	function fillLayerId(layer: LayerPlural) {
		return `${layer}-fill`;
	}
	function outlineLayerId(layer: LayerPlural) {
		return `${layer}-outline`;
	}

	function ensureZOrder() {
		const before = 'city-labels';
		(['states', 'districts', 'municipalities'] as const).forEach((l) => {
			[fillLayerId(l), outlineLayerId(l), 'highlight-outline'].forEach((id) => {
				if (map.getLayer(id) && map.getLayer(before)) map.moveLayer(id, before);
			});
		});
	}

	// Determine the property name in the vector tiles that holds the region code.
	// Based on your working example, AGS works across layers in your tiles.
	// Still, we auto-detect to be safe (AGS / RS / GKZ / code / code_short).
	let idProp = 'AGS';
	function detectIdProp() {
		try {
			const feats = map?.querySourceFeatures('regions') || [];
			const f = feats.find(Boolean);
			if (f?.properties) {
				const candidates = ['AGS', 'RS', 'GKZ', 'code', 'code_short', 'ID'];
				const found = candidates.find((k) => k in f.properties);
				if (found) idProp = found;
			}
		} catch {
			/* ignore until source fully ready */
		}
	}

	// Build “{ region, value }” for the selected period from the `regions` prop
	function buildDataForPeriod(): Array<{ region: string; value: number }> {
		const unique = new Map<string, number>();
		for (const r of regions) {
			const hit = r.data?.find((d) => String(d.period) === String(selectedPeriod));
			if (!unique.has(String(r.code))) {
				unique.set(String(r.code), hit?.value ?? (null as any));
			}
		}
		return Array.from(unique.entries())
			.filter(([, v]) => v != null)
			.map(([region, value]) => ({ region, value: value as number }));
	}

	function applyColorsToActiveLayer() {
		if (!mapReady || !map || !selectedPeriod) return;

		const entries = buildDataForPeriod();
		if (!entries.length) return;

		const { scale, range, thresholds } = createColorScale(entries);

		const matchExpression: any[] = ['match', ['get', idProp]];
		for (const { region, value } of entries) {
			matchExpression.push(region, scale(value));
		}
		matchExpression.push('#F2F2F2');

		const fid = fillLayerId(selectedLayer);
		if (map.getLayer(fid)) {
			map.setPaintProperty(fid, 'fill-color', matchExpression);
		}

		// Build legend
		legendSteps = range.map((color, i) => {
			const lower = i === 0 ? 0 : thresholds[i - 1];
			const upper = thresholds[i];
			const label =
				upper !== undefined
					? `${Math.round(lower)}–${Math.round(upper)}`
					: `> ${Math.round(lower)}`;
			return { color, label };
		});
	}

	function removeRegionSourceAndLayers() {
		(['municipalities', 'districts', 'states'] as const).forEach((lyr) => {
			const f = fillLayerId(lyr);
			const o = outlineLayerId(lyr);
			if (map.getLayer(f)) map.removeLayer(f);
			if (map.getLayer(o)) map.removeLayer(o);
		});
		if (map.getLayer('highlight-outline')) map.removeLayer('highlight-outline');
		if (map.getSource('regions')) map.removeSource('regions');
	}

	function installRegionSourceAndLayers() {
		switchingLayer = true;

		const tileURL = tilesURLForLayer(selectedLayer);
		const srcLayer = selectedLayer;

		map.addSource('regions', {
			type: 'vector',
			tiles: [tileURL],
			minzoom: 4,
			maxzoom: 12
		});

		map.addLayer(
			{
				id: fillLayerId(selectedLayer),
				type: 'fill',
				source: 'regions',
				'source-layer': srcLayer,
				paint: {
					'fill-color': '#ccc',
					'fill-opacity': ['interpolate', ['linear'], ['zoom'], 6, 1, 8, 0.85, 10, 0.6]
				}
			},
			map.getLayer('city-labels') ? 'city-labels' : undefined
		);

		map.addLayer(
			{
				id: outlineLayerId(selectedLayer),
				type: 'line',
				source: 'regions',
				'source-layer': srcLayer,
				paint: { 'line-color': '#fff', 'line-width': 0.08 }
			},
			map.getLayer('city-labels') ? 'city-labels' : undefined
		);

		map.addLayer(
			{
				id: 'highlight-outline',
				type: 'line',
				source: 'regions',
				'source-layer': srcLayer,
				paint: { 'line-color': '#000', 'line-width': 2 },
				filter: ['==', idProp, '']
			},
			map.getLayer('city-labels') ? 'city-labels' : undefined
		);

		map.on('click', fillLayerId(selectedLayer), (e) => {
			const feature = e.features?.[0];
			if (feature) {
				const regionId = String(feature.properties?.[idProp]);
				dispatch('selectRegion', regionId);
			}
		});
		map.on(
			'mouseenter',
			fillLayerId(selectedLayer),
			() => (map.getCanvas().style.cursor = 'pointer')
		);
		map.on('mouseleave', fillLayerId(selectedLayer), () => (map.getCanvas().style.cursor = ''));

		ensureZOrder();

		const onData = (ev: any) => {
			if (ev.sourceId === 'regions' && ev.isSourceLoaded) {
				map.off('sourcedata', onData);
				detectIdProp(); // auto-pick AGS / RS / GKZ
				switchingLayer = false;
				applyColorsToActiveLayer(); // repaint with proper key
				updateHighlight(); // re-apply selection with proper key
			}
		};
		map.on('sourcedata', onData);
	}

	function updateHighlight() {
		if (!mapReady || !map) return;
		if (selectedRegion) {
			if (map.getLayer('highlight-outline')) {
				map.setFilter('highlight-outline', ['==', idProp, String(selectedRegion)]);
			}
			// optional flyTo (if you pass centers in your regions array for current layer)
			const hit = regions.find((r) => String(r.code) === String(selectedRegion));
			if (hit?.center) {
				const z = layers.find((l) => l.key === selectedLayer)?.zoom ?? zoom + 3;
				map.flyTo({ center: hit.center, zoom: z, duration: 800 });
			}
		} else {
			if (map.getLayer('highlight-outline')) {
				map.setFilter('highlight-outline', ['==', idProp, '']);
			}
			map.flyTo({ center, zoom, duration: 800 });
		}
	}

	// ------------------------------------------------------------------------
	// Lifecycle + reactive glue
	// ------------------------------------------------------------------------

	onMount(() => {
		map = new maplibregl.Map({
			container: mapContainer,
			style: {
				version: 8,
				glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=C9NLXahOLRDRQl9OB6yH`,
				sources: {
					labels: {
						type: 'vector',
						url: 'https://tiles.klimadashboard.org/data/labels-' + PUBLIC_VERSION + '.json'
					}
				},
				layers: [
					{ id: 'background', type: 'background', paint: { 'background-color': 'transparent' } }
				]
			},
			center,
			zoom,
			minZoom: zoom,
			maxZoom: 14
		});

		map.addControl(new maplibregl.NavigationControl(), 'top-right');
		map.scrollZoom.disable();

		map.on('load', () => {
			installRegionSourceAndLayers();

			map.addLayer({
				id: 'city-labels',
				source: 'labels',
				'source-layer': 'city-labels',
				type: 'symbol',
				layout: {
					'text-field': ['get', 'name'],
					'text-font': ['Noto Sans Regular'],
					'text-size': 12,
					'symbol-sort-key': ['get', 'population']
				},
				paint: { 'text-color': '#000', 'text-halo-color': '#fff', 'text-halo-width': 1 },
				minzoom: 4,
				maxzoom: 9
			});

			mapReady = true;
			applyColorsToActiveLayer();
			updateHighlight();
		});

		map.on('zoom', () => (zoomLevel = map.getZoom()));
	});

	// When props change
	$: if (mapReady && map && selectedLayer) {
		// reinstall tiles & layers when layer switches
		removeRegionSourceAndLayers();
		idProp = 'AGS'; // reset guess; detect again after source loads
		installRegionSourceAndLayers();
	}

	$: if (mapReady && map && regions && selectedPeriod) {
		applyColorsToActiveLayer();
	}

	$: if ((mapReady && map && selectedRegion) || selectedRegion === null) {
		updateHighlight();
	}

	// Selected value highlighting in legend (optional)
	$: selectedValue = (() => {
		if (!selectedRegion || !Array.isArray(regions)) return null;
		const row = regions.find((d) => String(d.code) === String(selectedRegion));
		const val = row?.data?.find((d) => String(d.period) === String(selectedPeriod))?.value ?? null;
		return val;
	})();
</script>

<div
	bind:this={mapContainer}
	id="map"
	class="w-full h-full relative rounded-2xl bg-white dark:bg-gray-950"
>
	<div class="absolute bottom-4 left-4 z-40 flex items-center gap-2">
		{#if zoomLevel > 4}
			<button
				on:mousedown={() => (selectedRegion = null)}
				class="cursor-pointer border border-current/10 bg-white dark:bg-gray-200 rounded-full w-8 h-8 grid shadow"
				transition:fade
				aria-label="Zurück zur nationalen Ansicht"
			>
				<img src="/icons/general/{PUBLIC_VERSION}.svg" class="w-6 h-6 m-auto" alt="" />
			</button>
		{/if}

		<div class="border border-current/10 bg-white dark:bg-gray-200 rounded-full py-1.5 px-2 shadow">
			<select bind:value={selectedLayer} class="appearance-none">
				{#each layers as l}
					<option value={l.key}>{page.data.translations[l.key]}</option>
				{/each}
			</select>
		</div>

		{#if switchingLayer}
			<Loader />
		{/if}
	</div>

	{#if legendSteps.length}
		<div
			class="legend absolute top-2 left-2 z-40 bg-white dark:bg-gray-800 text-xs rounded shadow p-2"
		>
			<div class="font-semibold mb-1">Wert ({unit})</div>
			{#each legendSteps as step, i}
				<div class="flex items-center gap-1 mb-0.5">
					<span class="inline-block w-4 h-4 rounded" style="background-color: {step.color}"></span>
					<span
						class={selectedValue != null &&
						(() => {
							const prev =
								i === 0 ? 0 : parseFloat(legendSteps[i - 1].label.split(/[–>]/)[1] || '0');
							const upper = step.label.includes('–')
								? parseFloat(step.label.split('–')[1])
								: Infinity;
							return (selectedValue as number) >= prev && (selectedValue as number) < upper;
						})()
							? 'font-bold'
							: ''}
					>
						{step.label}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* minimal */
</style>
