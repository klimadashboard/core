<script>
	import { onMount, onDestroy } from 'svelte';
	import { scaleThreshold } from 'd3-scale';
	import { interpolateRgb } from 'd3-interpolate';
	import { fade } from 'svelte/transition';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/stores';
	import { t } from '$lib/utils/t';
	import Loader from '$lib/components/Loader.svelte';
	import { getRegions } from '$lib/utils/regions';

	export let map;
	export let regionId;
	export let regionName;
	export let isDarkMode = false;

	$: translations = $page.data?.translations;

	// Drive types to visualize (matching categoryConfig from carsTypes/config.ts)
	const driveTypes = [
		{ key: 'Elektro', labelKey: 'domain.fuel.electric', labelFallback: 'Elektro', color: '#10B981' },
		{ key: 'Plug-in-Hybrid', labelKey: 'domain.fuel.pluginHybrid', labelFallback: 'Plug-in-Hybrid', color: '#8B5CF6' },
		{ key: 'Hybrid', labelKey: 'domain.fuel.hybrid', labelFallback: 'Hybrid', color: '#38BDF8' },
		{ key: 'Benzin', labelKey: 'domain.fuel.petrol', labelFallback: 'Benzin', color: '#F59E0B' },
		{ key: 'Diesel', labelKey: 'domain.fuel.diesel', labelFallback: 'Diesel', color: '#DB2777' }
	];

	const layers = [
		{ key: 'municipalities', keySingular: 'municipality', zoom: 9.5 },
		{ key: 'districts', keySingular: 'district', zoom: 7 }
	];

	let loading = true;
	let switchingLayer = false;
	let selectedLayer = 'districts';
	let selectedDriveType = 'Elektro';
	let regionData = new Map(); // Map of region -> { Elektro: %, Diesel: %, etc. }
	let legendSteps = [];
	let idProp = 'AGS';
	let hoveredRegion = null;
	let tooltipX = 0;
	let tooltipY = 0;
	let hoverTimeout = null;

	// Colors for the gradient (green for EV share)
	function getColorRange() {
		const driveType = driveTypes.find(d => d.key === selectedDriveType);
		const baseColor = driveType?.color || '#10B981';
		// Create a gradient from light to the base color
		const lightColor = isDarkMode ? '#1F2937' : '#F3F4F6';
		return [lightColor, baseColor];
	}

	function getInterpolatedColors(start, end, steps) {
		const interp = interpolateRgb(start, end);
		return Array.from({ length: steps }, (_, i) => interp(i / (steps - 1)));
	}

	function createColorScale(data) {
		if (!data || data.size === 0) {
			return { scale: () => '#F2F2F2', range: [], thresholds: [] };
		}

		const values = Array.from(data.values())
			.map(d => d[selectedDriveType] || 0)
			.filter(v => v != null && v > 0);

		if (!values.length) {
			return { scale: () => '#F2F2F2', range: [], thresholds: [] };
		}

		const sorted = [...values].sort((a, b) => a - b);
		const steps = 7;
		const thresholds = Array.from({ length: steps - 1 }, (_, i) => {
			const p = (i + 1) / steps;
			return sorted[Math.floor(p * sorted.length)];
		});

		const [startColor, endColor] = getColorRange();
		const colorRange = getInterpolatedColors(startColor, endColor, steps);
		const scale = scaleThreshold().domain(thresholds).range(colorRange);

		return { scale, range: colorRange, thresholds };
	}

	function tilesURLForLayer(layer) {
		const cc = PUBLIC_VERSION.toLowerCase();
		return `https://tiles.klimadashboard.org/data/${layer}-${cc}/{z}/{x}/{y}.pbf`;
	}

	function fillLayerId(layer) {
		return `car-types-${layer}-fill`;
	}

	function outlineLayerId(layer) {
		return `car-types-${layer}-outline`;
	}

	function detectIdProp() {
		try {
			const feats = map?.querySourceFeatures('car-types-regions') || [];
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

	async function loadData() {
		loading = true;
		try {
			const country = PUBLIC_VERSION.toUpperCase();
			const layerFilter = selectedLayer === 'districts' ? 'district' : 'municipality';

			// Fetch registrations data from Directus (contains drive type categories)
			const url = `https://base.klimadashboard.org/items/mobility_cars_registrations?filter[country][_eq]=${country}&limit=-1`;
			const res = await fetch(url);
			if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

			const json = await res.json();
			const records = json.data || [];

			// Get region shapes to map region IDs to codes
			const allRegions = await getRegions();
			const regionsOfLayer = allRegions.filter(r => r.country === country && r.layer === layerFilter);

			// Create a map from region ID to region code (code_short for DE, code for AT)
			const regionIdToCode = new Map();
			const regionIdToName = new Map();
			for (const r of regionsOfLayer) {
				const code = PUBLIC_VERSION === 'at' ? r.code : (r.code_short || r.code);
				regionIdToCode.set(r.id, code);
				regionIdToName.set(r.id, r.name);
			}

			// Group records by region and period, then get latest period per region
			const regionPeriods = new Map();
			for (const row of records) {
				const regionCode = regionIdToCode.get(row.region) || row.region;
				if (!regionPeriods.has(regionCode)) {
					regionPeriods.set(regionCode, new Map());
				}
				const periods = regionPeriods.get(regionCode);
				if (!periods.has(row.period)) {
					periods.set(row.period, []);
				}
				periods.get(row.period).push(row);
			}

			// Process into regionData with shares
			regionData = new Map();
			for (const [regionCode, periods] of regionPeriods.entries()) {
				// Get the latest period
				const sortedPeriods = Array.from(periods.keys()).sort();
				const latestPeriod = sortedPeriods[sortedPeriods.length - 1];
				const latestRecords = periods.get(latestPeriod);

				// Calculate total and shares
				const categoryTotals = {};
				let total = 0;
				for (const row of latestRecords) {
					categoryTotals[row.category] = (categoryTotals[row.category] || 0) + row.value;
					total += row.value;
				}

				// Convert to percentages
				const shares = {};
				for (const [cat, val] of Object.entries(categoryTotals)) {
					shares[cat] = total > 0 ? (val / total) * 100 : 0;
				}

				// Find region name
				let name = regionCode;
				for (const [id, code] of regionIdToCode.entries()) {
					if (code === regionCode) {
						name = regionIdToName.get(id) || regionCode;
						break;
					}
				}

				shares.name = name;
				regionData.set(regionCode, shares);
			}

			loading = false;
			applyColorsToActiveLayer();
		} catch (e) {
			console.error('Failed to load car types data:', e);
			loading = false;
		}
	}

	function applyColorsToActiveLayer() {
		if (!map || loading || regionData.size === 0) return;

		const { scale, range, thresholds } = createColorScale(regionData);

		const matchExpression = ['match', ['get', idProp]];
		for (const [regionCode, data] of regionData.entries()) {
			const value = data[selectedDriveType] || 0;
			matchExpression.push(regionCode, scale(value));
		}
		matchExpression.push('#F2F2F2');

		const fid = fillLayerId(selectedLayer);
		if (map.getLayer(fid)) {
			map.setPaintProperty(fid, 'fill-color', matchExpression);
		}

		legendSteps = range.map((color, i) => {
			const lower = i === 0 ? 0 : thresholds[i - 1];
			const upper = thresholds[i];
			const label = upper !== undefined
				? `${lower.toFixed(1)}–${upper.toFixed(1)}%`
				: `> ${lower.toFixed(1)}%`;
			return { color, label };
		});
	}

	function handleMouseMove(e) {
		if (!e.features || e.features.length === 0) return;

		const feature = e.features[0];
		const regionCode = String(feature.properties?.[idProp]);
		const rName = feature.properties?.GEN || feature.properties?.name || feature.properties?.NAME || regionCode;

		const data = regionData.get(regionCode);
		if (!data) {
			hoveredRegion = null;
			return;
		}

		hoveredRegion = {
			name: data.name || rName,
			code: regionCode,
			...data
		};

		tooltipX = e.point.x;
		tooltipY = e.point.y;

		if (hoverTimeout) clearTimeout(hoverTimeout);
		hoverTimeout = window.setTimeout(() => {
			if (map.getLayer('car-types-highlight-outline')) {
				map.setFilter('car-types-highlight-outline', ['==', idProp, regionCode]);
			}
		}, 50);
	}

	function handleMouseLeave() {
		hoveredRegion = null;
		if (hoverTimeout) {
			clearTimeout(hoverTimeout);
			hoverTimeout = null;
		}
		if (map.getLayer('car-types-highlight-outline')) {
			map.setFilter('car-types-highlight-outline', ['==', idProp, '']);
		}
	}

	function removeRegionSourceAndLayers() {
		(['municipalities', 'districts']).forEach((lyr) => {
			const f = fillLayerId(lyr);
			const o = outlineLayerId(lyr);
			if (map.getLayer(f)) map.removeLayer(f);
			if (map.getLayer(o)) map.removeLayer(o);
		});
		if (map.getLayer('car-types-highlight-outline')) map.removeLayer('car-types-highlight-outline');
		if (map.getSource('car-types-regions')) map.removeSource('car-types-regions');
	}

	function installRegionSourceAndLayers() {
		if (!map) return;
		switchingLayer = true;

		const tileURL = tilesURLForLayer(selectedLayer);
		const srcLayer = selectedLayer;

		map.addSource('car-types-regions', {
			type: 'vector',
			tiles: [tileURL],
			minzoom: 4,
			maxzoom: 12
		});

		map.addLayer(
			{
				id: fillLayerId(selectedLayer),
				type: 'fill',
				source: 'car-types-regions',
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
				source: 'car-types-regions',
				'source-layer': srcLayer,
				paint: { 'line-color': isDarkMode ? '#374151' : '#fff', 'line-width': 0.5 }
			},
			map.getLayer('city-labels') ? 'city-labels' : undefined
		);

		map.addLayer(
			{
				id: 'car-types-highlight-outline',
				type: 'line',
				source: 'car-types-regions',
				'source-layer': srcLayer,
				paint: { 'line-color': isDarkMode ? '#fff' : '#000', 'line-width': 2 },
				filter: ['==', idProp, '']
			},
			map.getLayer('city-labels') ? 'city-labels' : undefined
		);

		map.on('mousemove', fillLayerId(selectedLayer), handleMouseMove);
		map.on('mouseleave', fillLayerId(selectedLayer), handleMouseLeave);
		map.on('mouseenter', fillLayerId(selectedLayer), () => (map.getCanvas().style.cursor = 'pointer'));
		map.on('mouseleave', fillLayerId(selectedLayer), () => (map.getCanvas().style.cursor = ''));

		const onData = (ev) => {
			if (ev.sourceId === 'car-types-regions' && ev.isSourceLoaded) {
				map.off('sourcedata', onData);
				detectIdProp();
				switchingLayer = false;
				applyColorsToActiveLayer();
			}
		};
		map.on('sourcedata', onData);
	}

	onMount(async () => {
		await loadData();
		if (map && map.loaded()) {
			installRegionSourceAndLayers();
		}
	});

	onDestroy(() => {
		if (map) {
			removeRegionSourceAndLayers();
		}
	});

	// Reactivity
	$: if (!loading && map && selectedLayer) {
		removeRegionSourceAndLayers();
		idProp = 'AGS';
		installRegionSourceAndLayers();
		loadData();
	}

	$: if (!loading && map && regionData && selectedDriveType) {
		applyColorsToActiveLayer();
	}

	$: if (!loading && map && isDarkMode !== undefined) {
		applyColorsToActiveLayer();
	}

	function getDriveTypeLabel(driveType) {
		const translated = t(translations, driveType.labelKey);
		return translated !== driveType.labelKey ? translated : driveType.labelFallback;
	}

	function getLayerLabel(key) {
		const labels = {
			municipalities: t(translations, 'municipalities') !== 'municipalities' ? t(translations, 'municipalities') : 'Gemeinden',
			districts: t(translations, 'districts') !== 'districts' ? t(translations, 'districts') : 'Kreise'
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

	<!-- Drive Type Switcher -->
	<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700">
		<div class="text-xs font-semibold mb-2 text-gray-600 dark:text-gray-400">
			{t(translations, 'ui.map.driveType') !== 'ui.map.driveType' ? t(translations, 'ui.map.driveType') : 'Antriebsart'}
		</div>
		<div class="flex gap-1 flex-wrap">
			{#each driveTypes as driveType}
				<button
					class="px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 {selectedDriveType === driveType.key
						? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
						: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}"
					on:click={() => (selectedDriveType = driveType.key)}
				>
					<span class="w-2 h-2 rounded-full" style="background-color: {driveType.color}"></span>
					{getDriveTypeLabel(driveType)}
				</button>
			{/each}
		</div>
	</div>

	<!-- Legend -->
	{#if legendSteps.length && !loading}
		<div
			class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-xs border border-gray-200 dark:border-gray-700"
			transition:fade
		>
			<div class="font-semibold mb-2">
				{getDriveTypeLabel(driveTypes.find(d => d.key === selectedDriveType))} ({t(translations, 'table.share') !== 'table.share' ? t(translations, 'table.share') : 'Anteil'})
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
	{#if loading || switchingLayer}
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
			{#each driveTypes as driveType}
				{@const value = hoveredRegion[driveType.key]}
				{#if value !== undefined}
					<div class="flex justify-between gap-4 {selectedDriveType === driveType.key ? 'font-semibold' : ''}">
						<span class="flex items-center gap-1">
							<span class="w-2 h-2 rounded-full" style="background-color: {driveType.color}"></span>
							{getDriveTypeLabel(driveType)}:
						</span>
						<span>{value.toFixed(1)}%</span>
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/if}
