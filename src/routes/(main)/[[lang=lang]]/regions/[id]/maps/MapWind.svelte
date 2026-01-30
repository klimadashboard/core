<script>
	import { onMount } from 'svelte';
	import { scaleThreshold } from 'd3-scale';
	import { interpolateRgb } from 'd3-interpolate';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/stores';
	import { t } from '$lib/utils/t';
	import Loader from '$lib/components/Loader.svelte';

	export let map;
	export let regionId;
	export let regionName;
	export let regionCode = null;
	export let regionCodeShort = null;
	export let regionLayer = null; // 'municipality', 'district', 'state', etc.
	export let isDarkMode = false;

	$: translations = $page.data?.translations;

	// Determine initial layer based on the current region's layer
	function getInitialLayer() {
		if (regionLayer === 'district') return 'districts';
		if (regionLayer === 'state') return 'states';
		return 'municipalities';
	}

	// Colors that work in both light and dark mode (wind/blue theme)
	const colorsLight = ['#E5F3FA', '#003B80'];
	const colorsDark = ['#1E3A5F', '#60A5FA'];
	$: colors = isDarkMode ? colorsDark : colorsLight;

	let loading = false;
	let legendSteps = [];
	let selectedLayer = getInitialLayer();
	let hoveredRegion = null;
	let tooltipX = 0;
	let tooltipY = 0;
	let regionData = [];
	let hoverTimeout = null;
	let currentRegionCode = null; // Code of the current page's region for highlighting

	const layers = [
		{ key: 'municipalities', keySingular: 'municipality', zoom: 9.5 },
		{ key: 'districts', keySingular: 'district', zoom: 7 },
		{ key: 'states', keySingular: 'state', zoom: 6 }
	];

	function getInterpolatedColors(start, end, steps) {
		const interp = interpolateRgb(start, end);
		return Array.from({ length: steps }, (_, i) => interp(i / (steps - 1)));
	}

	function createColorScale(data) {
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

	function idPropertyForLayer(layer) {
		return 'AGS';
	}

	function tilesURLForLayer(layer) {
		const cc = PUBLIC_VERSION.toLowerCase();
		return `https://tiles.klimadashboard.org/data/${layer}-${cc}/{z}/{x}/{y}.pbf`;
	}

	function fillLayerId(layer) {
		return `${layer}-wind-fill`;
	}

	function outlineLayerId(layer) {
		return `${layer}-wind-outline`;
	}

	function highlightLayerId(layer) {
		return `${layer}-wind-highlight`;
	}

	function currentRegionLayerId(layer) {
		return `${layer}-wind-current-region`;
	}

	async function getData(selectedEnergy, selectedLayer) {
		const level =
			selectedLayer === 'districts'
				? 'district'
				: selectedLayer === 'states'
					? 'state'
					: 'municipality';
		const url = `https://base.klimadashboard.org/get-region-stats-for-renewables?table=energy_${selectedEnergy}_units&level=${level}`;
		const res = await fetch(url);
		if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
		const json = await res.json();
		return Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
	}

	function applyColorsToActiveLayer(dataArr) {
		if (!map || !Array.isArray(dataArr) || dataArr.length === 0) return;

		const unique = new Map();
		for (const row of dataArr) {
			if (row?.region && row.power_per_area_kw_per_km2 != null && !unique.has(row.region)) {
				unique.set(row.region, row.power_per_area_kw_per_km2);
			}
		}
		const entriesArray = Array.from(unique.entries()).map(([region, value]) => ({ region, value }));
		if (entriesArray.length === 0) return;

		const { scale, range, thresholds } = createColorScale(entriesArray);
		const idProp = idPropertyForLayer(selectedLayer);

		const matchExpression = ['match', ['get', idProp]];
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
				upper !== undefined ? `${Math.round(lower)}–${Math.round(upper)}` : `> ${Math.round(lower)}`;
			return { color, label };
		});
	}

	async function loadData() {
		loading = true;
		try {
			const rows = await getData('wind', selectedLayer);
			regionData = rows;
			applyColorsToActiveLayer(rows);
		} catch (e) {
			console.error('Stats fetch error:', e);
		} finally {
			loading = false;
		}
	}

	function handleMouseMove(e) {
		if (!e.features || e.features.length === 0) return;

		const feature = e.features[0];
		const regionCode = feature.properties[idPropertyForLayer(selectedLayer)];
		const rName = feature.properties.GEN || feature.properties.name || feature.properties.NAME || regionCode;
		const data = regionData.find(d => d.region === regionCode);

		hoveredRegion = {
			name: rName,
			code: regionCode,
			powerPerArea: data?.power_per_area_kw_per_km2 || 0,
			totalPower: data?.total_power_kw || 0,
			unitCount: data?.unit_count || 0
		};

		tooltipX = e.point.x;
		tooltipY = e.point.y;

		if (hoverTimeout) clearTimeout(hoverTimeout);
		hoverTimeout = setTimeout(() => {
			if (map.getLayer(highlightLayerId(selectedLayer))) {
				map.setFilter(highlightLayerId(selectedLayer), ['==', ['get', idPropertyForLayer(selectedLayer)], regionCode]);
			}
		}, 50);
	}

	function handleMouseLeave() {
		hoveredRegion = null;
		if (hoverTimeout) {
			clearTimeout(hoverTimeout);
			hoverTimeout = null;
		}
		if (map.getLayer(highlightLayerId(selectedLayer))) {
			map.setFilter(highlightLayerId(selectedLayer), ['==', ['get', idPropertyForLayer(selectedLayer)], '']);
		}
	}

	function installRegionLayers() {
		if (!map) return;

		const srcTiles = tilesURLForLayer(selectedLayer);
		const srcLayer = selectedLayer;

		if (!map.getSource('regions-wind')) {
			map.addSource('regions-wind', {
				type: 'vector',
				tiles: [srcTiles],
				minzoom: 4,
				maxzoom: 12
			});
		}

		if (!map.getLayer(fillLayerId(selectedLayer))) {
			map.addLayer({
				id: fillLayerId(selectedLayer),
				type: 'fill',
				source: 'regions-wind',
				'source-layer': srcLayer,
				paint: {
					'fill-color': '#ccc',
					'fill-opacity': ['interpolate', ['linear'], ['zoom'], 6, 1, 8, 0.8, 10, 0.4]
				}
			});
		}

		if (!map.getLayer(outlineLayerId(selectedLayer))) {
			map.addLayer({
				id: outlineLayerId(selectedLayer),
				type: 'line',
				source: 'regions-wind',
				'source-layer': srcLayer,
				paint: { 'line-color': '#fff', 'line-width': 0.5 }
			});
		}

		if (!map.getLayer(highlightLayerId(selectedLayer))) {
			map.addLayer({
				id: highlightLayerId(selectedLayer),
				type: 'line',
				source: 'regions-wind',
				'source-layer': srcLayer,
				paint: {
					'line-color': isDarkMode ? '#fff' : '#000',
					'line-width': 3
				},
				filter: ['==', ['get', idPropertyForLayer(selectedLayer)], '']
			});
		}

		// Add current region highlight layer (persistent)
		if (!map.getLayer(currentRegionLayerId(selectedLayer)) && currentRegionCode) {
			map.addLayer({
				id: currentRegionLayerId(selectedLayer),
				type: 'line',
				source: 'regions-wind',
				'source-layer': srcLayer,
				paint: {
					'line-color': '#3b82f6', // Blue color to indicate current region
					'line-width': 3
				},
				filter: ['==', ['get', idPropertyForLayer(selectedLayer)], currentRegionCode]
			});
		}

		map.on('mousemove', fillLayerId(selectedLayer), handleMouseMove);
		map.on('mouseleave', fillLayerId(selectedLayer), handleMouseLeave);
		map.on('mouseenter', fillLayerId(selectedLayer), () => {
			map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', fillLayerId(selectedLayer), () => {
			map.getCanvas().style.cursor = '';
		});

		loadData();
	}

	function formatPower(kw) {
		if (kw >= 1000000) {
			return `${(kw / 1000000).toFixed(1)} GW`;
		} else if (kw >= 1000) {
			return `${(kw / 1000).toFixed(1)} MW`;
		}
		return `${Math.round(kw)} kW`;
	}

	function removeRegionLayers() {
		if (!map) return;
		layers.forEach((l) => {
			const f = fillLayerId(l.key);
			const o = outlineLayerId(l.key);
			const h = highlightLayerId(l.key);
			const c = currentRegionLayerId(l.key);
			if (map.getLayer(f)) map.removeLayer(f);
			if (map.getLayer(o)) map.removeLayer(o);
			if (map.getLayer(h)) map.removeLayer(h);
			if (map.getLayer(c)) map.removeLayer(c);
		});
		if (map.getSource('regions-wind')) map.removeSource('regions-wind');
	}

	onMount(() => {
		// Set the current region's code for highlighting from props
		if (regionCode || regionCodeShort) {
			currentRegionCode = PUBLIC_VERSION === 'at'
				? String(regionCode)
				: String(regionCodeShort ?? regionCode);
		}

		if (map) {
			installRegionLayers();
		}

		return () => {
			removeRegionLayers();
		};
	});

	$: if (map && selectedLayer) {
		removeRegionLayers();
		installRegionLayers();
	}

	// Re-apply colors when dark mode changes
	$: if (map && isDarkMode !== undefined && regionData.length > 0) {
		applyColorsToActiveLayer(regionData);
	}

	function getLayerLabel(key) {
		const labels = {
			municipalities: t(translations, 'municipalities') !== 'municipalities' ? t(translations, 'municipalities') : 'Gemeinden',
			districts: t(translations, 'districts') !== 'districts' ? t(translations, 'districts') : 'Kreise',
			states: t(translations, 'states') !== 'states' ? t(translations, 'states') : 'Bundesländer'
		};
		return labels[key] || key;
	}
</script>

<!-- Controls positioned absolutely over map - top left -->
<div class="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto max-w-[calc(100%-120px)]">
	<!-- Layer Selector -->
	<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1.5 px-2 border border-gray-200 dark:border-gray-700">
		<select bind:value={selectedLayer} class="appearance-none text-sm bg-transparent cursor-pointer">
			{#each layers as layer}
				<option value={layer.key}>{getLayerLabel(layer.key)}</option>
			{/each}
		</select>
	</div>

	<!-- Legend -->
	{#if legendSteps.length}
		<div class="bg-white dark:bg-gray-800 text-xs rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700">
			<div class="font-semibold mb-2">
				{t(translations, 'ui.map.windPower') !== 'ui.map.windPower' ? t(translations, 'ui.map.windPower') : 'Windleistung'} (kW/km²)
			</div>
			{#each legendSteps as step}
				<div class="flex items-center gap-2 mb-1">
					<span class="inline-block w-4 h-4 rounded" style="background-color: {step.color}"></span>
					<span>{step.label}</span>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Loading Indicator -->
	{#if loading}
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700">
			<Loader />
		</div>
	{/if}
</div>

<!-- Tooltip -->
{#if hoveredRegion}
	<div
		class="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 text-sm pointer-events-none"
		style="left: {tooltipX + 10}px; top: {tooltipY + 10}px;"
	>
		<div class="font-bold mb-2 text-base">{hoveredRegion.name}</div>
		<div class="space-y-1">
			<div class="flex justify-between gap-4">
				<span class="text-gray-600 dark:text-gray-400">
					{t(translations, 'ui.map.powerPerArea') !== 'ui.map.powerPerArea' ? t(translations, 'ui.map.powerPerArea') : 'Leistung pro Fläche'}:
				</span>
				<span class="font-semibold">{Math.round(hoveredRegion.powerPerArea)} kW/km²</span>
			</div>
			<div class="flex justify-between gap-4">
				<span class="text-gray-600 dark:text-gray-400">
					{t(translations, 'ui.renewable.totalPower') !== 'ui.renewable.totalPower' ? t(translations, 'ui.renewable.totalPower') : 'Gesamtleistung'}:
				</span>
				<span class="font-semibold">{formatPower(hoveredRegion.totalPower)}</span>
			</div>
			<div class="flex justify-between gap-4">
				<span class="text-gray-600 dark:text-gray-400">
					{t(translations, 'table.count') !== 'table.count' ? t(translations, 'table.count') : 'Anzahl Anlagen'}:
				</span>
				<span class="font-semibold">{hoveredRegion.unitCount.toLocaleString('de-DE')}</span>
			</div>
		</div>
	</div>
{/if}
