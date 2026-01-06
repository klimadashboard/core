<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { scaleThreshold } from 'd3-scale';
	import { interpolateRgb } from 'd3-interpolate';
	import { fade } from 'svelte/transition';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/state';
	import Loader from '$lib/components/Loader.svelte';
	import {
		fetchAllRegions,
		colors,
		type RegionWithData
	} from '$lib/components/charts/custom/carsDensity/config';

	export let map: any; // MapLibre GL map instance from parent
	export let regionId: string | undefined = undefined;
	export let regionName: string | undefined = undefined;

	type LayerPlural = 'municipalities' | 'districts';
	type LayerSingular = 'municipality' | 'district';
	type ViewKey = 'pop' | 'private' | 'company';

	const layers: Array<{ key: LayerPlural; keySingular: LayerSingular; zoom: number }> = [
		{ key: 'municipalities', keySingular: 'municipality', zoom: 9.5 },
		{ key: 'districts', keySingular: 'district', zoom: 7 }
	];

	const views: Array<{ label: string; key: ViewKey; unit: string }> = [
		{ label: 'Gesamt', key: 'pop', unit: '' },
		{ label: 'Privat', key: 'private', unit: '%' },
		{ label: 'Firmen', key: 'company', unit: '%' }
	];

	// State
	let regions: RegionWithData[] = [];
	let availablePeriods: string[] = [];
	let selectedPeriodIndex = 0;
	let selectedPeriod = '';
	let selectedLayer: LayerPlural = 'municipalities';
	let selectedView: ViewKey = 'pop';
	let selectedRegion: string | null = null;
	let loading = true;
	let switchingLayer = false;
	let legendSteps: Array<{ color: string; label: string }> = [];
	let idProp = 'AGS';
	let hoveredRegion: { name: string; code: string; value: number } | null = null;
	let tooltipX = 0;
	let tooltipY = 0;
	let hoverTimeout: number | null = null;

	// Load data
	onMount(async () => {
		try {
			const payload = await fetchAllRegions(fetch);
			regions = payload.regions;
			availablePeriods = payload.periods;
			selectedPeriodIndex = availablePeriods.length - 1;
			selectedPeriod = availablePeriods[selectedPeriodIndex];
			loading = false;

			// Install map layers after data loads
			if (map && map.loaded()) {
				installRegionSourceAndLayers();
			}
		} catch (e) {
			console.error('Failed to load mobility data:', e);
			loading = false;
		}
	});

	onDestroy(() => {
		if (map) {
			removeRegionSourceAndLayers();
		}
	});

	$: selectedPeriod = availablePeriods[selectedPeriodIndex];

	// Color scale helpers
	function getInterpolatedColors(start: string, end: string, steps: number): string[] {
		const interp = interpolateRgb(start, end);
		return Array.from({ length: steps }, (_, i) => interp(i / (steps - 1)));
	}

	function getColorRangeForView(view: ViewKey): [string, string] {
		switch (view) {
			case 'pop':
				return [colors.carsLight, colors.cars];
			case 'private':
				return [colors.privateLight, colors.private];
			case 'company':
				return [colors.companyLight, colors.company];
		}
	}

	function createColorScale(data: Array<{ region: string; value: number }>) {
		if (!Array.isArray(data) || data.length === 0) {
			return { scale: () => '#F2F2F2', range: [] as string[], thresholds: [] as number[] };
		}
		const values = data.map((d) => d.value).filter((v) => v != null) as number[];
		if (!values.length) {
			return { scale: () => '#F2F2F2', range: [] as string[], thresholds: [] as number[] };
		}

		const sorted = [...values].sort((a, b) => a - b);
		const steps = 7;
		const thresholds = Array.from({ length: steps - 1 }, (_, i) => {
			const p = (i + 1) / steps;
			return sorted[Math.floor(p * sorted.length)];
		});

		const [startColor, endColor] = getColorRangeForView(selectedView);
		const colorRange = getInterpolatedColors(startColor, endColor, steps);
		const scale = scaleThreshold<number, string>().domain(thresholds).range(colorRange);

		return { scale, range: colorRange, thresholds };
	}

	// Map layer helpers
	function tilesURLForLayer(layer: LayerPlural): string {
		const cc = PUBLIC_VERSION.toLowerCase();
		return `https://tiles.klimadashboard.org/data/${layer}-${cc}/{z}/{x}/{y}.pbf`;
	}

	function fillLayerId(layer: LayerPlural): string {
		return `cars-${layer}-fill`;
	}

	function outlineLayerId(layer: LayerPlural): string {
		return `cars-${layer}-outline`;
	}

	function detectIdProp(): void {
		try {
			const feats = map?.querySourceFeatures('cars-regions') || [];
			const f = feats.find(Boolean);
			if (f?.properties) {
				const candidates = ['AGS', 'RS', 'GKZ', 'code', 'code_short', 'ID'];
				const found = candidates.find((k) => k in f.properties);
				if (found) idProp = found;
			}
		} catch {
			/* ignore */
		}
	}

	function buildDataForPeriod(): Array<{ region: string; value: number }> {
		const regionsForMap = regions.filter((d) =>
			selectedLayer === 'districts' ? d.layer === 'district' : d.layer === 'municipality'
		);

		return regionsForMap
			.map((d) => {
				const code = PUBLIC_VERSION === 'at' ? String(d.code) : String(d.code_short ?? d.code);
				const dataArr =
					selectedView === 'pop'
						? d.carsPer1000Inhabitants
						: selectedView === 'private'
							? d.carsPrivateShare
							: d.carsCompanyShare;
				const hit = dataArr.find((row) => String(row.period) === String(selectedPeriod));
				return { region: code, value: hit?.value ?? (null as any) };
			})
			.filter((d) => d.value != null);
	}

	function applyColorsToActiveLayer(): void {
		if (!map || loading) return;
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

	function handleMouseMove(e: any): void {
		if (!e.features || e.features.length === 0) return;

		const feature = e.features[0];
		const regionCode = String(feature.properties?.[idProp]);
		const regionName = feature.properties?.GEN || feature.properties?.name || feature.properties?.NAME || regionCode;

		// Find the region data
		const regionData = regions.find((r) => {
			const code = PUBLIC_VERSION === 'at' ? String(r.code) : String(r.code_short ?? r.code);
			return code === regionCode;
		});

		if (!regionData) {
			hoveredRegion = null;
			return;
		}

		const dataArr =
			selectedView === 'pop'
				? regionData.carsPer1000Inhabitants
				: selectedView === 'private'
					? regionData.carsPrivateShare
					: regionData.carsCompanyShare;

		const hit = dataArr.find((row) => String(row.period) === String(selectedPeriod));
		const value = hit?.value ?? 0;

		hoveredRegion = {
			name: regionName,
			code: regionCode,
			value
		};

		tooltipX = e.point.x;
		tooltipY = e.point.y;

		// Debounce highlight updates
		if (hoverTimeout) clearTimeout(hoverTimeout);
		hoverTimeout = window.setTimeout(() => {
			if (map.getLayer('cars-highlight-outline')) {
				map.setFilter('cars-highlight-outline', ['==', idProp, regionCode]);
			}
		}, 50);
	}

	function handleMouseLeave(): void {
		hoveredRegion = null;

		// Clear timeout and highlight
		if (hoverTimeout) {
			clearTimeout(hoverTimeout);
			hoverTimeout = null;
		}

		if (map.getLayer('cars-highlight-outline')) {
			map.setFilter('cars-highlight-outline', ['==', idProp, '']);
		}
	}

	function removeRegionSourceAndLayers(): void {
		(['municipalities', 'districts'] as const).forEach((lyr) => {
			const f = fillLayerId(lyr);
			const o = outlineLayerId(lyr);
			if (map.getLayer(f)) map.removeLayer(f);
			if (map.getLayer(o)) map.removeLayer(o);
		});
		if (map.getLayer('cars-highlight-outline')) map.removeLayer('cars-highlight-outline');
		if (map.getSource('cars-regions')) map.removeSource('cars-regions');
	}

	function installRegionSourceAndLayers(): void {
		if (!map) return;
		switchingLayer = true;

		const tileURL = tilesURLForLayer(selectedLayer);
		const srcLayer = selectedLayer;

		map.addSource('cars-regions', {
			type: 'vector',
			tiles: [tileURL],
			minzoom: 4,
			maxzoom: 12
		});

		map.addLayer(
			{
				id: fillLayerId(selectedLayer),
				type: 'fill',
				source: 'cars-regions',
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
				source: 'cars-regions',
				'source-layer': srcLayer,
				paint: { 'line-color': '#fff', 'line-width': 0.08 }
			},
			map.getLayer('city-labels') ? 'city-labels' : undefined
		);

		map.addLayer(
			{
				id: 'cars-highlight-outline',
				type: 'line',
				source: 'cars-regions',
				'source-layer': srcLayer,
				paint: { 'line-color': '#000', 'line-width': 2 },
				filter: ['==', idProp, '']
			},
			map.getLayer('city-labels') ? 'city-labels' : undefined
		);

		map.on('click', fillLayerId(selectedLayer), (e: any) => {
			const feature = e.features?.[0];
			if (feature) {
				const regionCode = String(feature.properties?.[idProp]);
				selectedRegion = regionCode;
			}
		});

		map.on('mousemove', fillLayerId(selectedLayer), handleMouseMove);
		map.on('mouseleave', fillLayerId(selectedLayer), handleMouseLeave);
		map.on(
			'mouseenter',
			fillLayerId(selectedLayer),
			() => (map.getCanvas().style.cursor = 'pointer')
		);
		map.on('mouseleave', fillLayerId(selectedLayer), () => (map.getCanvas().style.cursor = ''));

		const onData = (ev: any) => {
			if (ev.sourceId === 'cars-regions' && ev.isSourceLoaded) {
				map.off('sourcedata', onData);
				detectIdProp();
				switchingLayer = false;
				applyColorsToActiveLayer();
			}
		};
		map.on('sourcedata', onData);
	}

	// Reactivity
	$: if (!loading && map && selectedLayer) {
		removeRegionSourceAndLayers();
		idProp = 'AGS';
		installRegionSourceAndLayers();
	}

	$: if (!loading && map && regions && selectedPeriod && selectedView) {
		applyColorsToActiveLayer();
	}

	$: selectedUnit = views.find((v) => v.key === selectedView)?.unit || '';
</script>

<!-- Controls positioned absolutely over map -->
<div class="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto">
	<!-- Layer Selector -->
	<div
		class="bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1.5 px-2 border border-gray-200 dark:border-gray-700"
	>
		<select bind:value={selectedLayer} class="appearance-none text-sm bg-transparent">
			{#each layers as layer}
				<option value={layer.key}>{page.data.translations?.[layer.key] || layer.key}</option>
			{/each}
		</select>
	</div>

	<!-- View Switcher -->
	<div
		class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700"
	>
		<div class="flex gap-1">
			{#each views as view}
				<button
					class="px-3 py-1 text-xs rounded transition-colors {selectedView === view.key
						? 'bg-blue-600 text-white'
						: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}"
					on:click={() => (selectedView = view.key)}
				>
					{view.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Period Slider (Austria only) -->
	{#if PUBLIC_VERSION === 'at' && availablePeriods.length > 1}
		<div
			class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700"
		>
			<div class="flex gap-2 items-center">
				<input
					type="range"
					class="w-24"
					min={0}
					max={availablePeriods.length - 1}
					step={1}
					bind:value={selectedPeriodIndex}
				/>
				<span class="text-xs font-medium">{selectedPeriod}</span>
			</div>
		</div>
	{/if}

	<!-- Loading Indicator -->
	{#if loading || switchingLayer}
		<div
			class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700"
		>
			<Loader />
		</div>
	{/if}
</div>

<!-- Legend -->
{#if legendSteps.length && !loading}
	<div
		class="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-xs pointer-events-auto border border-gray-200 dark:border-gray-700"
		transition:fade
	>
		<div class="font-semibold mb-2">
			{views.find((v) => v.key === selectedView)?.label}
			{#if selectedUnit}({selectedUnit}){/if}
		</div>
		{#each legendSteps as step}
			<div class="flex items-center gap-2 mb-1">
				<span class="inline-block w-4 h-4 rounded" style="background-color: {step.color}"></span>
				<span>{step.label}</span>
			</div>
		{/each}
	</div>
{/if}

<!-- Tooltip -->
{#if hoveredRegion}
	<div
		class="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 text-sm pointer-events-none"
		style="left: {tooltipX + 10}px; top: {tooltipY + 10}px;"
	>
		<div class="font-bold mb-2 text-base">{hoveredRegion.name}</div>
		<div class="space-y-1">
			<div class="flex justify-between gap-4">
				<span class="text-gray-600 dark:text-gray-400"
					>{views.find((v) => v.key === selectedView)?.label}:</span
				>
				<span class="font-semibold"
					>{Math.round(hoveredRegion.value)}{selectedUnit ? ` ${selectedUnit}` : ''}</span
				>
			</div>
		</div>
	</div>
{/if}

<style>
	select {
		cursor: pointer;
	}
</style>
