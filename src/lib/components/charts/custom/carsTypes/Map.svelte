<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { scaleLinear } from 'd3-scale';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { interpolateRgb } from 'd3-interpolate';
	import { fade } from 'svelte/transition';
	import { page } from '$app/state';

	// props
	export let selectedRegion; // string code like "01001"
	export let selectedPeriod; // number | string
	export let regions; // [{ code, center, layer, name, data:[{period,value}], ... }]
	export let colors; // [start,end]
	export let min; // number
	export let max; // number
	export let selectedLayer = PUBLIC_VERSION.toUpperCase() === 'AT' ? 'municipalities' : 'districts';
	export let selectedType; // e.g. 'Elektro' | 'Diesel' ... (used as a dependency trigger)

	let mapContainer;
	let map;
	let mapReady = false;
	let zoomLevel = 0;

	const COUNTRY_CODE = PUBLIC_VERSION.toUpperCase();
	const defaultView = {
		AT: { center: [13.333, 47.5], zoom: 6 },
		DE: { center: [10.45, 51.1657], zoom: 4.7 }
	};
	const { center, zoom } = defaultView[COUNTRY_CODE] || defaultView.DE;

	const dispatch = createEventDispatcher();

	const MAPTILER_KEY = 'C9NLXahOLRDRQl9OB6yH';
	const unit = '%';
	const idProp = 'AGS';

	// helpers for dynamic tiles
	function tilejsonURLForLayer(layer) {
		const cc = PUBLIC_VERSION.toLowerCase();
		return `https://tiles.klimadashboard.org/data/${layer}-${cc}.json`;
	}
	function fillLayerId(layer) {
		return `${layer}-fill`;
	}
	function outlineLayerId(layer) {
		return `${layer}-outline`;
	}

	function ensureLabelsOnTop() {
		// If labels exist, move them to the very top
		if (map.getLayer('city-labels')) {
			map.moveLayer('city-labels'); // no beforeId => move to top
		}
	}

	function addRegionSourceAndLayers(layerKey) {
		const styleSrc = { type: 'vector', url: tilejsonURLForLayer(layerKey) };

		if (map.getSource('regions')) removeRegionSourceAndLayers();
		map.addSource('regions', styleSrc);

		map.addLayer({
			id: fillLayerId(layerKey),
			type: 'fill',
			source: 'regions',
			'source-layer': layerKey,
			paint: {
				'fill-color': '#ccc',
				'fill-opacity': ['interpolate', ['linear'], ['zoom'], 6, 1, 10, 0.6]
			}
		});

		map.addLayer({
			id: outlineLayerId(layerKey),
			type: 'line',
			source: 'regions',
			'source-layer': layerKey,
			paint: { 'line-color': '#000', 'line-width': 0.5, 'line-opacity': 0.35 }
		});

		map.addLayer({
			id: 'highlight-outline',
			type: 'line',
			source: 'regions',
			'source-layer': layerKey,
			paint: { 'line-color': '#000', 'line-width': 3 },
			filter: ['==', idProp, '']
		});

		map.on('click', fillLayerId(layerKey), (e) => {
			const feature = e.features?.[0];
			if (feature) {
				const regionId = feature.properties?.[idProp];
				dispatch('selectRegion', regionId);
			}
		});
		map.on('mouseenter', fillLayerId(layerKey), () => (map.getCanvas().style.cursor = 'pointer'));
		map.on('mouseleave', fillLayerId(layerKey), () => (map.getCanvas().style.cursor = ''));
	}

	function removeRegionSourceAndLayers() {
		['municipalities', 'districts'].forEach((k) => {
			const f = fillLayerId(k);
			const o = outlineLayerId(k);
			if (map.getLayer(f)) map.removeLayer(f);
			if (map.getLayer(o)) map.removeLayer(o);
		});
		if (map.getLayer('highlight-outline')) map.removeLayer('highlight-outline');
		if (map.getSource('regions')) map.removeSource('regions');
	}

	onMount(() => {
		map = new maplibregl.Map({
			container: mapContainer,
			style: {
				version: 8,
				glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MAPTILER_KEY}`,
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
			maxZoom: 11
		});

		map.addControl(new maplibregl.NavigationControl(), 'top-right');
		map.scrollZoom.disable();

		map.on('load', () => {
			addRegionSourceAndLayers(selectedLayer);

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
				paint: {
					'text-color': '#000',
					'text-halo-color': '#fff',
					'text-halo-width': 1
				},
				minzoom: 4
			});

			mapReady = true;
			ensureLabelsOnTop();
		});

		map.on('zoom', () => {
			zoomLevel = map.getZoom();
		});
	});

	/* -------------------- Reactive updates with real deps -------------------- */

	// When layer changes: reinstall layers, then reapply colors & selection
	$: if (mapReady && map && selectedLayer) {
		removeRegionSourceAndLayers();
		addRegionSourceAndLayers(selectedLayer);
		// defer a tick for safety (source->layer ready), then apply
		queueMicrotask(() => {
			updateFillColors(regions, selectedPeriod, colors, min, max, selectedLayer, selectedType);
			updateSelection(selectedRegion, regions, selectedLayer);
		});
		ensureLabelsOnTop();
	}

	// Colors update whenever these change
	$: if (mapReady && map) {
		// explicitly reference deps so Svelte re-runs when they change
		const _deps = { regions, selectedPeriod, colors, min, max, selectedLayer, selectedType };
		updateFillColors(regions, selectedPeriod, colors, min, max, selectedLayer, selectedType);
		ensureLabelsOnTop();
	}

	// Selection update whenever these change
	$: if (mapReady && map) {
		const _depsSel = { selectedRegion, regions, selectedLayer };
		updateSelection(selectedRegion, regions, selectedLayer);
		ensureLabelsOnTop();
	}

	/* ---------------------------- Update helpers ---------------------------- */

	function updateFillColors(regs, period, colorPair, vmin, vmax, layerKey /*, type */) {
		if (!Array.isArray(regs) || !Array.isArray(colorPair) || colorPair.length < 2) return;
		if (vmin == null || vmax == null || period == null) return;

		const colorScale = scaleLinear()
			.domain([vmin, vmax])
			.range(colorPair)
			.interpolate(interpolateRgb)
			.clamp(true);

		const matchExpression = ['match', ['get', idProp]];
		let hasAny = false;

		for (const r of regs) {
			const v = r?.data?.find((d) => String(d.period) === String(period))?.value;
			if (v != null && isFinite(v)) {
				matchExpression.push(r.code, colorScale(v));
				hasAny = true;
			}
		}
		if (!hasAny) matchExpression.push('__none__', '#ccc');
		matchExpression.push('#ccc');

		const fid = fillLayerId(layerKey);
		if (map.getLayer(fid)) {
			map.setPaintProperty(fid, 'fill-color', matchExpression);
		}
	}

	function updateSelection(selCode, regs, layerKey) {
		const current = Array.isArray(regs) ? regs.find((d) => d.code === selCode) : null;

		if (map.getLayer('highlight-outline')) {
			map.setFilter('highlight-outline', ['==', idProp, current ? selCode : '']);
		}

		if (current && current.layer !== 'country' && current.center) {
			map.flyTo({ center: current.center, zoom: Math.min(zoom + 3, 10), duration: 800 });
		} else {
			map.flyTo({ center, zoom, duration: 800 });
		}
	}

	// UI: layer dropdown
	function onLayerChange(e) {
		const next = e.currentTarget.value;
		selectedLayer = next;
		dispatch('changeLayer', next);
		ensureLabelsOnTop();
	}
</script>

<div
	bind:this={mapContainer}
	id="map"
	class="w-full h-full relative my-4 rounded-2xl bg-white dark:bg-gray-950"
>
	<!-- Bottom-left controls -->
	<div class="absolute bottom-4 left-2 z-40 flex items-center gap-2">
		{#if zoomLevel > 4}
			<button
				on:mousedown={() => {
					const national = regions?.find((d) => d.layer === 'country');
					if (national) dispatch('selectRegion', national.code);
				}}
				class="cursor-pointer border border-current/10 bg-white dark:bg-gray-500 rounded-full w-8 h-8 grid shadow"
				transition:fade
				aria-label="Zurück zur nationalen Ansicht"
			>
				<img src="/icons/general/{PUBLIC_VERSION}.svg" class="w-6 h-6 m-auto" alt="" />
			</button>
		{/if}

		{#if PUBLIC_VERSION !== 'de'}
			<!-- layer switch -->
			<div class="border border-current/10 bg-white dark:bg-gray-700 rounded-full py-1 px-2 shadow">
				<select
					bind:value={selectedLayer}
					on:change={onLayerChange}
					class="appearance-none bg-transparent"
				>
					<option value="municipalities">Gemeinden</option>
					<option value="districts">Bezirke / Kreise</option>
				</select>
			</div>
		{/if}
	</div>

	<!-- Legend -->
	<div
		class="text-xs absolute top-2 left-2 z-40 flex bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded-full gap-1 items-center"
	>
		<p>{Math.round(min)}{unit}</p>
		<div
			class="w-6 h-2 r rounded-full"
			style="background: linear-gradient(to right, {colors[0]}, {colors[1]});"
		></div>
		<p>{Math.round(max)}{unit}</p>
	</div>
</div>
