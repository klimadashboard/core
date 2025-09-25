<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { scaleThreshold } from 'd3-scale';
	import { interpolateRgb } from 'd3-interpolate';
	import { fade } from 'svelte/transition';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/state';
	import Loader from '$lib/components/Loader.svelte';

	let layers = [
		{
			key: 'municipalities',
			keySingular: 'municipality',
			zoom: 9.5
		},
		{
			key: 'districts',
			keySingular: 'district',
			zoom: 7
		},
		{
			key: 'states',
			keySingular: 'state',
			zoom: 6
		}
	];

	// Props
	export let selectedRegion;
	export let selectedLayer: 'municipalities' | 'districts' | 'states' = 'municipalities';
	export let regions;
	export let colors: [string, string] = ['#fee5d9', '#a50f15'];
	export let selectedEnergy: 'wind' | 'solar' | 'hydro' | 'bio' = 'wind';

	// Map state
	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map;
	let mapReady = false;
	let zoomLevel = 0;

	// UI state
	let legendSteps: Array<{ color: string; label: string }> = [];
	let loadingData = false;
	let switchingLayer = false;

	// Data memory
	let resolvedData: Array<{ region: string; power_per_area_kw_per_km2: number }> = [];
	let reqId = 0;

	const dispatch = createEventDispatcher();

	const COUNTRY_CODE = PUBLIC_VERSION.toUpperCase();
	const defaultView = {
		AT: { center: [13.333, 47.5], zoom: 6 },
		DE: { center: [10.45, 51.1657], zoom: 5 }
	} as const;
	const { center, zoom } = defaultView[COUNTRY_CODE] || defaultView.DE;

	// ------------------------------------------------------------------------
	// Helpers
	// ------------------------------------------------------------------------

	function getInterpolatedColors(start: string, end: string, steps: number): string[] {
		const interp = interpolateRgb(start, end);
		return Array.from({ length: steps }, (_, i) => interp(i / (steps - 1)));
	}

	function createColorScale(data: Array<{ region: string; value: number }>) {
		if (!Array.isArray(data)) return { scale: () => '#F2F2F2', range: [], thresholds: [] };
		const values = data.map((d) => d.value).filter((v) => v != null);
		if (!values.length) return { scale: () => '#F2F2F2', range: [], thresholds: [] };

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

	function idPropertyForLayer(_layer: 'municipalities' | 'districts' | 'states') {
		return 'AGS';
	}

	function tilesURLForLayer(layer: 'municipalities' | 'districts' | 'states') {
		const cc = PUBLIC_VERSION.toLowerCase();
		return `https://tiles.klimadashboard.org/data/${layer}-${cc}/{z}/{x}/{y}.pbf`;
	}

	function fillLayerId(layer: 'municipalities' | 'districts' | 'states') {
		return `${layer}-fill`;
	}
	function outlineLayerId(layer: 'municipalities' | 'districts' | 'states') {
		return `${layer}-outline`;
	}

	function ensureZOrder() {
		const before = 'city-labels';
		(['states', 'districts', 'municipalities'] as const).forEach((l) => {
			[fillLayerId(l), outlineLayerId(l), 'highlight-outline'].forEach((id) => {
				if (map.getLayer(id) && map.getLayer(before)) map.moveLayer(id, before);
			});
		});
		['wind-clusters', 'wind-cluster-count', 'wind-points'].forEach((id) => {
			if (map.getLayer(id)) map.moveLayer(id);
		});
	}

	function applyColorsToActiveLayer(
		dataArr: Array<{ region: string; power_per_area_kw_per_km2: number }>
	) {
		if (!mapReady || !map || !Array.isArray(dataArr) || dataArr.length === 0) return;

		const unique = new Map<string, number>();
		for (const row of dataArr) {
			if (row?.region && row.power_per_area_kw_per_km2 != null && !unique.has(row.region)) {
				unique.set(row.region, row.power_per_area_kw_per_km2);
			}
		}
		const entriesArray = Array.from(unique.entries()).map(([region, value]) => ({ region, value }));
		if (entriesArray.length === 0) return;

		const { scale, range, thresholds } = createColorScale(entriesArray);
		const idProp = idPropertyForLayer(selectedLayer);

		const matchExpression: any[] = ['match', ['get', idProp]];
		for (const { region, value } of entriesArray) {
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

	async function getData(_selectedEnergy: string, _selectedLayer: string) {
		const level =
			_selectedLayer === 'districts'
				? 'district'
				: _selectedLayer === 'states'
					? 'state'
					: 'municipality';
		const url = `https://base.klimadashboard.org/get-region-stats-for-renewables?table=energy_${_selectedEnergy}_units&level=${level}`;
		const res = await fetch(url);
		if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
		const json = await res.json();
		return Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
	}

	// ✅ Clean reactive fetch handler
	$: if (mapReady && map && selectedEnergy && selectedLayer) {
		loadLayerStats();
		removeRegionSourceAndLayers();
		installRegionSourceAndLayers();
	}

	async function loadLayerStats() {
		const myReq = ++reqId;
		loadingData = true;
		try {
			const rows = await getData(selectedEnergy, selectedLayer);
			if (myReq !== reqId) return;
			resolvedData = rows;
			applyColorsToActiveLayer(resolvedData);
		} catch (e) {
			if (myReq === reqId) resolvedData = [];
			console.error('Stats fetch error:', e);
		} finally {
			if (myReq === reqId) loadingData = false;
		}
	}

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

			map.addSource('carto-voyager', {
				type: 'raster',
				tiles: [
					'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
					'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
					'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
					'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
				],
				tileSize: 256,
				maxzoom: 20
			});

			map.addLayer(
				{
					id: 'carto-voyager',
					type: 'raster',
					source: 'carto-voyager',
					paint: { 'raster-opacity': 0 },
					minzoom: 9
				},
				map.getLayer(fillLayerId(selectedLayer)) ? fillLayerId(selectedLayer) : undefined
			);

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
		});

		map.on('zoom', () => {
			zoomLevel = map.getZoom();
			const fadeTarget = zoomLevel > 9 ? 1 : 0;
			if (map.getLayer('carto-voyager')) {
				map.setPaintProperty('carto-voyager', 'raster-opacity', fadeTarget);
				map.setPaintProperty('carto-voyager', 'raster-fade-duration', 300);
			}
		});
	});

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
		const srcTiles = tilesURLForLayer(selectedLayer);
		const srcLayer = selectedLayer;
		const idProp = idPropertyForLayer(selectedLayer);

		map.addSource('regions', {
			type: 'vector',
			tiles: [srcTiles],
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
					'fill-opacity': ['interpolate', ['linear'], ['zoom'], 6, 1, 8, 0.8, 10, 0.4]
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
				paint: { 'line-color': '#fff', 'line-width': 0.05 }
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
				const regionId = feature.properties?.[idProp];
				console.log(regionId);
				console.log(regions.filter((d) => d.code == regionId));
				selectedRegion = regions.find((d) => d.code == regionId);
				// dispatch('selectRegion', regionId);
			}
		});
		map.on(
			'mouseenter',
			fillLayerId(selectedLayer),
			() => (map.getCanvas().style.cursor = 'pointer')
		);
		map.on('mouseleave', fillLayerId(selectedLayer), () => (map.getCanvas().style.cursor = ''));

		ensureZOrder();

		const onData = (e: any) => {
			if (e.sourceId === 'regions' && e.isSourceLoaded) {
				map.off('sourcedata', onData);
				switchingLayer = false;
				if (resolvedData.length) applyColorsToActiveLayer(resolvedData);
			}
		};
		map.on('sourcedata', onData);
	}

	$: if (mapReady && map) {
		const idProp = idPropertyForLayer(selectedLayer);
		if (selectedRegion && selectedRegion.layer !== 'country') {
			if (map.getLayer('highlight-outline')) {
				map.setFilter('highlight-outline', ['==', idProp, selectedRegion.code]);
			}
			if (selectedRegion?.center) {
				map.flyTo({
					center: selectedRegion.center,
					zoom: layers.find((l) => l.keySingular == selectedRegion?.layer)?.zoom,
					duration: 800
				});
			}
		} else {
			if (map.getLayer('highlight-outline')) {
				map.setFilter('highlight-outline', ['==', idProp, '']);
			}
			map.flyTo({ center, zoom, duration: 800 });
		}
	}

	$: selectedValue = (() => {
		if (!selectedRegion || !Array.isArray(resolvedData)) return null;
		const row = resolvedData.find((d) => d.region === selectedRegion.code);
		return row?.power_per_area_kw_per_km2 ?? null;
	})();

	// Track previous layer to compare direction
	let previousLayer: typeof selectedLayer = selectedLayer;

	$: if (mapReady && selectedLayer !== previousLayer) {
		const currentLayerIndex = layers.findIndex((l) => l.key === selectedLayer);
		const previousLayerIndex = layers.findIndex((l) => l.key === previousLayer);
		const selectedLayerSingular = layers.find((l) => l.key === selectedLayer)?.keySingular;

		let nextRegion = null;

		// 1. Try to find region from page context if it's in the current layer
		const pageRegionCode = page?.data?.page?.code;
		if (pageRegionCode) {
			nextRegion = regions.find(
				(r) => r.code === pageRegionCode && r.layer === selectedLayerSingular
			);
		}

		// 2. If moving up (e.g. muni → district), select parent of correct layer
		if (!nextRegion && previousLayerIndex < currentLayerIndex && selectedRegion?.parents?.length) {
			const parent = selectedRegion.parents.find((p) => p.layer === selectedLayerSingular);
			console.log(parent);
			if (parent) {
				nextRegion = regions.find((r) => r.id === parent.id);
			}
		}

		// 3. If moving down (e.g. district → muni), pick any matching child
		if (!nextRegion && previousLayerIndex > currentLayerIndex && selectedRegion?.id) {
			nextRegion = regions
				.sort((a, b) => a.code.localeCompare(b.code))
				.find(
					(r) =>
						r.parents?.some((p) => p.id === selectedRegion.id) && r.layer === selectedLayerSingular
				);
		}

		// 4. Fallback: stay at country level
		if (!nextRegion) {
			nextRegion = regions.find((r) => r.layer === 'country');
		}

		selectedRegion = nextRegion;
		previousLayer = selectedLayer;
	}
</script>

<div
	bind:this={mapContainer}
	id="map"
	class="w-full h-full relative rounded-2xl bg-white dark:bg-gray-950"
>
	<div class="absolute bottom-4 left-4 z-40 flex items-center gap-2">
		{#if zoomLevel > 4}
			<button
				on:mousedown={() => (selectedRegion = regions.find((d) => d.layer == 'country'))}
				class="cursor-pointer border border-current/10 bg-white dark:bg-gray-200 rounded-full w-8 h-8 grid shadow"
				transition:fade
				aria-label="Zurück zur nationalen Ansicht"
			>
				<img src="/icons/general/{PUBLIC_VERSION}.svg" class="w-6 h-6 m-auto" alt="" />
			</button>
		{/if}

		<div
			class=" border border-current/10 bg-white dark:bg-gray-200 rounded-full py-1.5 px-2 shadow"
		>
			<select bind:value={selectedLayer} class="appearance-none">
				{#each layers as layer}
					<option value={layer.key}>{page.data.translations[layer.key]}</option>
				{/each}
			</select>
		</div>

		{#if loadingData || switchingLayer}
			<Loader />
		{/if}
	</div>

	{#if legendSteps.length}
		<div
			class="legend absolute top-2 left-2 z-40 bg-white dark:bg-gray-800 text-xs rounded shadow p-2"
		>
			<div class="font-semibold mb-1">Leistung (kW/km²)</div>
			{#each legendSteps as step, i}
				<div class="flex items-center gap-1 mb-0.5">
					<span class="inline-block w-4 h-4 rounded" style="background-color: {step.color}"></span>
					<span
						class={selectedValue != null &&
						(() => {
							// inline check: is selectedValue within this step range?
							const prev =
								i === 0 ? 0 : parseFloat(legendSteps[i - 1].label.split(/[–>]/)[1] || '0');
							const upper = step.label.includes('–')
								? parseFloat(step.label.split('–')[1])
								: Infinity;
							return selectedValue >= prev && selectedValue < upper;
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
	/* minimal; transitions handled via paint props */
</style>
