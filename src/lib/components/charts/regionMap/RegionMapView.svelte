<!--
	Regional choropleth map for energy carriers (PV, wind, storage, …).

	Shows the current region among the regions of the same layer around it (or the members of an
	aggregate region such as the Metropolregion), coloured by installed power/capacity/units –
	per km² by default, absolute values optional. Driven entirely by the `energy` key, see
	`CARRIERS` in regionMapData.ts.

	No basemap and no glyphs: the map only loads region outlines from our own Directus, so no
	visitor data goes to tile/font CDNs.
-->
<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import { page } from '$app/state';
	import * as maplibregl from '$lib/utils/maplibre';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { interpolateRgb } from 'd3-interpolate';
	import Switch from '$lib/components/Switch.svelte';
	import { formatNumber } from '$lib/utils/formatters';
	import {
		getCarrier,
		loadMapRegions,
		loadCarrierValues,
		metricValue,
		type MapMetric,
		type MapRegion,
		type MapRegionSet,
		type RegionValues
	} from './regionMapData';

	/** Region the chart is about (from the Card) */
	export let region: any = null;
	export let regionLoading = false;
	/** Carrier key, e.g. 'solar', 'wind', 'storage', 'biomass', 'hydro' */
	export let energy = 'solar';
	export let height = 380;

	type Normalize = 'area' | 'absolute';

	const NO_DATA_LIGHT = '#E4E4E7';
	const NO_DATA_DARK = '#3F3F46';
	const CLASSES = 5;

	let normalize: Normalize = 'area';
	let ownMetric: MapMetric = getCarrier(energy).metrics[0];
	let width = 0;

	let loading = true;
	let error: string | null = null;
	let set: MapRegionSet | null = null;
	let values = new Map<string, RegionValues>();

	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let mapLoaded = false;
	let currentMarker: maplibregl.Marker | null = null;
	let isDark = false;
	let darkObserver: MutationObserver | null = null;

	let hoverId: string | null = null;
	let tooltip: { x: number; y: number; row: Row } | null = null;
	let selectedId: string | null = null;

	$: carrier = getCarrier(energy);
	$: if (!carrier.metrics.includes(ownMetric)) ownMetric = carrier.metrics[0];
	$: activeMetric = ownMetric;
	$: showMetricSelect = carrier.metrics.length > 1;

	// Same segmented Switch + icons as the charts' own metric switch
	const ICONS: Record<string, string> = {
		power: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
		capacity: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="18" height="10" rx="2"/><line x1="22" y1="11" x2="22" y2="13"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="10" x2="10" y2="14"/></svg>`,
		units: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="6" height="10" rx="1"/><rect x="9" y="3" width="6" height="14" rx="1"/><rect x="16" y="5" width="6" height="12" rx="1"/></svg>`,
		area: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 12h16M12 4v16"/></svg>`,
		absolute: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 4H6l6 8-6 8h12"/></svg>`
	};
	const normalizeViews = [
		{ key: 'area', label: 'pro km²', icon: ICONS.area },
		{ key: 'absolute', label: 'absolut', icon: ICONS.absolute }
	];
	$: metricViews = carrier.metrics.map((m) => ({
		key: m,
		label: m === 'power' ? 'Leistung' : m === 'capacity' ? 'Kapazität' : 'Anzahl Anlagen',
		icon: ICONS[m]
	}));

	// ---------------------------------------------------------------- loading
	let reqId = 0;
	$: if (!regionLoading) load(region, energy);

	async function load(r: any, e: string) {
		const my = ++reqId;
		loading = true;
		error = null;
		try {
			const s = await loadMapRegions(normalizeRegion(r));
			if (my !== reqId) return;
			if (!s || !s.regions.length) {
				set = null;
				values = new Map();
				return;
			}
			const v = await loadCarrierValues(e, s.layer, r?.country || 'DE');
			if (my !== reqId) return;
			set = s;
			values = v;
		} catch (err) {
			console.error('[RegionMapView] load failed', err);
			if (my === reqId) {
				error = 'Karte konnte nicht geladen werden';
				set = null;
			}
		} finally {
			if (my === reqId) loading = false;
		}
	}

	/** The Card passes a Region (getRegion.ts); page data uses Directus field names */
	function normalizeRegion(r: any) {
		const p = r ?? page?.data?.page;
		if (!p?.id) return null;
		return {
			id: p.id,
			code: p.code,
			layer: p.layer,
			country: p.country,
			center: p.center,
			parents: p.parents
		};
	}

	// ---------------------------------------------------------------- rows
	interface Row {
		region: MapRegion;
		absolute: number | null;
		perArea: number | null;
		value: number | null;
		rank: number | null;
		color: string;
		classIndex: number | null;
	}

	$: rows = buildRows(set, values, activeMetric, normalize, isDark);
	$: thresholds = computeThresholds(rows);
	$: palette = buildPalette(carrier.ramp, isDark);
	$: coloredRows = colorRows(rows, thresholds, palette, isDark);
	$: rowById = new Map(coloredRows.map((r) => [r.region.id, r]));
	$: currentRow = coloredRows.find((r) => r.region.isCurrent) ?? null;
	$: hasValues = coloredRows.some((r) => r.value !== null);
	$: sortedRows = [...coloredRows].sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9));
	$: selectedRow = selectedId ? (rowById.get(selectedId) ?? null) : null;

	function buildRows(
		s: MapRegionSet | null,
		v: Map<string, RegionValues>,
		m: MapMetric,
		n: Normalize,
		_dark: boolean
	): Row[] {
		if (!s) return [];
		const base = s.regions.map((region) => {
			const absolute = metricValue(v.get(region.key) ?? v.get(region.code), m, v.size > 0);
			const perArea =
				absolute !== null && region.area && region.area > 0 ? absolute / region.area : null;
			return {
				region,
				absolute,
				perArea,
				value: n === 'area' ? perArea : absolute,
				rank: null as number | null,
				color: '',
				classIndex: null as number | null
			};
		});
		const ranked = base.filter((r) => r.value !== null).sort((a, b) => b.value! - a.value!);
		ranked.forEach((r, i) => (r.rank = i + 1));
		return base;
	}

	function computeThresholds(rs: Row[]): number[] {
		const vals = rs
			.map((r) => r.value)
			.filter((v): v is number => v !== null)
			.sort((a, b) => a - b);
		if (vals.length < 2) return [];
		const t: number[] = [];
		for (let i = 1; i < CLASSES; i++) {
			const q = vals[Math.min(vals.length - 1, Math.floor((i / CLASSES) * vals.length))];
			// no empty classes: every threshold must lie above the minimum and the previous one
			if (q > vals[0] && (!t.length || q > t[t.length - 1])) t.push(q);
		}
		return t;
	}

	function buildPalette(ramp: [string, string], dark: boolean): string[] {
		// Light: pale → saturated. Dark: muted dark → bright, so "more" is always more contrast.
		const steps = CLASSES;
		if (dark) {
			// dark grey → saturated hue → pale tint
			const mid = interpolateRgb(ramp[0], ramp[1])(0.6);
			const lo = interpolateRgb('#2A2A30', mid);
			const hi = interpolateRgb(mid, ramp[0]);
			return Array.from({ length: steps }, (_, i) => {
				const t = i / (steps - 1);
				return t <= 0.5 ? lo(0.25 + t * 1.5) : hi((t - 0.5) * 1.8);
			});
		}
		const interp = interpolateRgb(ramp[0], ramp[1]);
		return Array.from({ length: steps }, (_, i) => interp(0.12 + (0.88 * i) / (steps - 1)));
	}

	function classOf(v: number, t: number[]): number {
		let i = 0;
		while (i < t.length && v >= t[i]) i++;
		return i;
	}

	function colorRows(rs: Row[], t: number[], pal: string[], dark: boolean): Row[] {
		// Spread the classes that exist over the palette so few classes still use its full range
		const n = t.length + 1;
		return rs.map((r) => {
			if (r.value === null)
				return { ...r, color: dark ? NO_DATA_DARK : NO_DATA_LIGHT, classIndex: null };
			const c = classOf(r.value, t);
			const idx = n === 1 ? pal.length - 1 : Math.round((c / (n - 1)) * (pal.length - 1));
			return { ...r, color: pal[idx], classIndex: c };
		});
	}

	// ---------------------------------------------------------------- formatting
	function unitSuffix(m: MapMetric): string {
		if (m === 'power') return energy === 'solar' ? 'kWp' : 'kW';
		if (m === 'capacity') return 'kWh';
		return 'Anlagen';
	}

	/** kW/kWh → k/M/G with German decimals */
	function scaled(v: number, units: [string, string, string]): string {
		const abs = Math.abs(v);
		const [div, unit] = abs >= 1e6 ? [1e6, units[2]] : abs >= 1e3 ? [1e3, units[1]] : [1, units[0]];
		const x = v / div;
		const d = div === 1 || Math.abs(x) >= 100 ? 0 : Math.abs(x) >= 10 ? 1 : 2;
		return `${formatNumber(x, d)}\u202F${unit}`;
	}

	function formatAbsolute(v: number | null, m: MapMetric = activeMetric): string {
		if (v === null) return 'keine Daten';
		if (m === 'power')
			return scaled(v, energy === 'solar' ? ['kWp', 'MWp', 'GWp'] : ['kW', 'MW', 'GW']);
		if (m === 'capacity') return scaled(v, ['kWh', 'MWh', 'GWh']);
		return `${formatNumber(v)} Anlagen`;
	}

	function formatPerArea(v: number | null, m: MapMetric = activeMetric): string {
		if (v === null) return 'keine Daten';
		const d = v >= 100 ? 0 : v >= 10 ? 1 : 2;
		return `${formatNumber(v, d)} ${unitSuffix(m)}/km²`;
	}

	function formatValue(v: number | null): string {
		return normalize === 'area' ? formatPerArea(v) : formatAbsolute(v);
	}

	function formatThreshold(v: number): string {
		if (v === 0) return '0';
		if (normalize === 'area') {
			const d = v >= 100 ? 0 : v >= 10 ? 1 : 2;
			return formatNumber(v, d);
		}
		return formatAbsolute(v).replace(/\s*Anlagen$/, '');
	}

	$: metricLabel =
		activeMetric === 'power'
			? 'Installierte Leistung'
			: activeMetric === 'capacity'
				? 'Speicherkapazität'
				: 'Anzahl Anlagen';
	$: valueLabel = normalize === 'area' ? `${metricLabel} pro km²` : metricLabel;
	$: legendUnit =
		normalize === 'area'
			? `${unitSuffix(activeMetric)}/km²`
			: activeMetric === 'units'
				? 'Anlagen'
				: '';

	$: legendItems = buildLegend(thresholds, palette, coloredRows);
	function buildLegend(t: number[], pal: string[], rs: Row[]) {
		const n = t.length + 1;
		const vals = rs.map((r) => r.value).filter((v): v is number => v !== null);
		if (!vals.length) return [];
		const min = Math.min(...vals);
		const max = Math.max(...vals);
		return Array.from({ length: n }, (_, c) => {
			const lo = c === 0 ? min : t[c - 1];
			const hi = c === n - 1 ? max : t[c];
			const idx = n === 1 ? pal.length - 1 : Math.round((c / (n - 1)) * (pal.length - 1));
			const count = rs.filter((r) => r.classIndex === c).length;
			return {
				color: pal[idx],
				label: `${formatThreshold(lo)} – ${formatThreshold(hi)}`,
				count,
				hasCurrent: currentRow?.classIndex === c
			};
		});
	}

	// ---------------------------------------------------------------- links
	function regionHref(r: MapRegion): string {
		const lang = page?.params?.lang;
		const prefix = lang ? `/${lang}` : '';
		const hash = typeof window !== 'undefined' ? window.location.hash : '';
		return `${prefix}/regions/${r.slug || r.id}${hash}`;
	}

	// ---------------------------------------------------------------- map
	function geojson(rs: Row[]) {
		return {
			type: 'FeatureCollection' as const,
			features: rs.map((r) => ({
				type: 'Feature' as const,
				id: r.region.id,
				properties: {
					id: r.region.id,
					fill: r.color,
					current: r.region.isCurrent ? 1 : 0
				},
				geometry: r.region.outline
			}))
		};
	}

	function boundsOf(s: MapRegionSet): [[number, number], [number, number]] | null {
		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;
		const visit = (c: any) => {
			if (typeof c[0] === 'number') {
				if (c[0] < minX) minX = c[0];
				if (c[0] > maxX) maxX = c[0];
				if (c[1] < minY) minY = c[1];
				if (c[1] > maxY) maxY = c[1];
			} else c.forEach(visit);
		};
		for (const r of s.regions) if (r.outline?.coordinates) visit(r.outline.coordinates);
		return Number.isFinite(minX)
			? [
					[minX, minY],
					[maxX, maxY]
				]
			: null;
	}

	function lineColors(dark: boolean) {
		return {
			border: dark ? '#18181B' : '#FFFFFF',
			current: dark ? '#FFFFFF' : '#18181B',
			hover: dark ? '#E4E4E7' : '#3F3F46'
		};
	}

	/** Tailwind's `dark:` applies if <html> (theme store) or <body> (header LightSwitch) has it */
	function pageIsDark(): boolean {
		return (
			document.documentElement.classList.contains('dark') ||
			document.body.classList.contains('dark')
		);
	}

	function initMap() {
		if (map || !mapContainer) return;
		isDark = pageIsDark();
		map = new maplibregl.Map({
			container: mapContainer,
			style: { version: 8, sources: {}, layers: [] },
			attributionControl: false,
			dragRotate: false,
			pitchWithRotate: false,
			cooperativeGestures: true,
			locale: {
				'CooperativeGesturesHandler.WindowsHelpText': 'Strg + Scrollen zum Zoomen',
				'CooperativeGesturesHandler.MacHelpText': '⌘ + Scrollen zum Zoomen',
				'CooperativeGesturesHandler.MobileHelpText': 'Mit zwei Fingern verschieben'
			},
			// Keep the drawing buffer so the Card's PNG export captures the map.
			canvasContextAttributes: { preserveDrawingBuffer: true }
		});
		map.touchZoomRotate.disableRotation();
		map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

		map.on('load', () => {
			if (!map) return;
			const c = lineColors(isDark);
			map.addSource('regions', { type: 'geojson', data: geojson(coloredRows), promoteId: 'id' });
			map.addSource('aggregate', {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] }
			});
			map.addLayer({
				id: 'regions-fill',
				type: 'fill',
				source: 'regions',
				paint: { 'fill-color': ['get', 'fill'], 'fill-opacity': 1 }
			});
			map.addLayer({
				id: 'regions-border',
				type: 'line',
				source: 'regions',
				paint: { 'line-color': c.border, 'line-width': 0.8 }
			});
			map.addLayer({
				id: 'regions-hover',
				type: 'line',
				source: 'regions',
				paint: {
					'line-color': c.hover,
					'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 0]
				}
			});
			map.addLayer({
				id: 'aggregate-outline',
				type: 'line',
				source: 'aggregate',
				paint: { 'line-color': c.current, 'line-width': 2.5, 'line-dasharray': [3, 1.5] }
			});
			// Current region: light casing + dark line, readable on any fill colour
			map.addLayer({
				id: 'current-casing',
				type: 'line',
				source: 'regions',
				filter: ['==', ['get', 'current'], 1],
				paint: { 'line-color': c.border, 'line-width': 5.5 }
			});
			map.addLayer({
				id: 'current-outline',
				type: 'line',
				source: 'regions',
				filter: ['==', ['get', 'current'], 1],
				paint: { 'line-color': c.current, 'line-width': 2.5 }
			});

			map.on('mousemove', 'regions-fill', (e: any) => {
				const f = e.features?.[0];
				if (!f || !map) return;
				map.getCanvas().style.cursor = 'pointer';
				setHover(String(f.id));
				const row = rowById.get(String(f.id));
				tooltip = row ? { x: e.point.x, y: e.point.y, row } : null;
			});
			map.on('mouseleave', 'regions-fill', () => {
				if (!map) return;
				map.getCanvas().style.cursor = '';
				setHover(null);
				tooltip = null;
			});
			map.on('click', 'regions-fill', (e: any) => {
				const f = e.features?.[0];
				if (f) selectedId = String(f.id);
			});

			mapLoaded = true;
			updateMap(coloredRows, set, isDark);
		});

		darkObserver = new MutationObserver(() => {
			const now = pageIsDark();
			if (now !== isDark) isDark = now;
		});
		for (const el of [document.documentElement, document.body]) {
			darkObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
		}
	}

	function setHover(id: string | null) {
		if (!map || !mapLoaded) return;
		if (hoverId && hoverId !== id)
			map.setFeatureState({ source: 'regions', id: hoverId }, { hover: false });
		if (id) map.setFeatureState({ source: 'regions', id }, { hover: true });
		hoverId = id;
	}

	let fittedFor: MapRegionSet | null = null;
	function updateMap(rs: Row[], s: MapRegionSet | null, dark: boolean) {
		if (!map || !mapLoaded) return;
		(map.getSource('regions') as any)?.setData(geojson(rs));
		(map.getSource('aggregate') as any)?.setData(
			s?.aggregateOutline
				? { type: 'Feature', properties: {}, geometry: s.aggregateOutline }
				: { type: 'FeatureCollection', features: [] }
		);
		const c = lineColors(dark);
		map.setPaintProperty('regions-border', 'line-color', c.border);
		map.setPaintProperty('regions-hover', 'line-color', c.hover);
		map.setPaintProperty('current-casing', 'line-color', c.border);
		map.setPaintProperty('current-outline', 'line-color', c.current);
		map.setPaintProperty('aggregate-outline', 'line-color', c.current);

		if (s && s !== fittedFor) {
			const b = boundsOf(s);
			if (b) map.fitBounds(b, { padding: 16, animate: false });
			fittedFor = s;
			placeCurrentLabel(s);
		}
	}

	function placeCurrentLabel(s: MapRegionSet) {
		currentMarker?.remove();
		currentMarker = null;
		const cur = s.regions.find((r) => r.isCurrent);
		if (!map || !cur?.center) return;
		const el = document.createElement('div');
		el.className =
			'pointer-events-none rounded bg-white/90 px-1.5 py-0.5 text-xs font-semibold text-gray-900 shadow dark:bg-gray-900/90 dark:text-white';
		el.textContent = cur.name;
		el.setAttribute('aria-hidden', 'true');
		currentMarker = new maplibregl.Marker({ element: el, anchor: 'center' })
			.setLngLat(cur.center)
			.addTo(map);
	}

	$: if (set && mapContainer && !map) tick().then(initMap);
	// The container leaves the DOM when there is nothing to show – drop the map with it
	$: if (!set && map) {
		currentMarker?.remove();
		map.remove();
		map = null;
		mapLoaded = false;
		fittedFor = null;
	}
	$: updateMap(coloredRows, set, isDark);
	$: if (width && map) map.resize();

	onDestroy(() => {
		darkObserver?.disconnect();
		currentMarker?.remove();
		map?.remove();
		map = null;
	});

	// Whole aggregate (e.g. Metropolregion): sum of members, per km² from the summed area
	$: aggregateValue = (() => {
		if (set?.mode !== 'members') return null;
		const withData = coloredRows.filter((r) => r.absolute !== null);
		if (!withData.length) return null;
		const abs = withData.reduce((a, r) => a + (r.absolute ?? 0), 0);
		const area = withData.reduce((a, r) => a + (r.region.area ?? 0), 0);
		return normalize === 'area' ? (area > 0 ? abs / area : null) : abs;
	})();

	$: introText = set
		? set.mode === 'members'
			? `${set.regions.length} ${set.layer === 'state' ? 'Bundesländer' : 'Mitgliedsregionen'}`
			: `${currentRow?.region.name ?? 'Region'} und ${set.regions.length - 1} umliegende ${
					set.layer === 'municipality'
						? 'Gemeinden'
						: set.layer === 'state'
							? 'Bundesländer'
							: 'Landkreise und Städte'
				}`
		: '';
</script>

<div class="w-full" bind:clientWidth={width}>
	<div class="mb-4 flex flex-wrap gap-2">
		<Switch
			label="Darstellung"
			views={normalizeViews}
			activeView={normalize}
			on:itemClick={(e) => (normalize = e.detail)}
		/>
		{#if showMetricSelect}
			<Switch
				label="Kennzahl"
				views={metricViews}
				activeView={ownMetric}
				on:itemClick={(e) => (ownMetric = e.detail)}
			/>
		{/if}
	</div>

	{#if !set && (loading || regionLoading)}
		<div
			class="animate-pulse rounded bg-gray-100 dark:bg-gray-800"
			style="height: {width < 500 ? 320 : height}px"
		></div>
	{:else if error}
		<div class="flex h-[300px] items-center justify-center text-red-500">{error}</div>
	{:else if !set}
		<div class="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
			Keine Karte für diese Region verfügbar
		</div>
	{:else}
		<p class="mb-2 text-sm text-gray-600 dark:text-gray-300">
			{valueLabel} – {introText}{#if currentRow?.rank}. {currentRow.region.name}:
				<strong class="font-semibold text-gray-900 dark:text-white"
					>{formatValue(currentRow.value)}</strong
				>, Rang {currentRow.rank} von {coloredRows.filter((r) => r.rank)
					.length}{:else if aggregateValue !== null}, zusammen <strong
					class="font-semibold text-gray-900 dark:text-white">{formatValue(aggregateValue)}</strong
				>{/if}.
		</p>

		<div
			class="relative overflow-hidden rounded bg-gray-50 dark:bg-gray-900"
			style="height: {width < 500 ? 320 : height}px"
		>
			<div
				bind:this={mapContainer}
				class="h-full w-full"
				role="img"
				aria-label="Karte: {valueLabel}, {introText}. Die Werte stehen in der Liste unter der Karte und im Tab Tabelle."
			></div>

			{#if !hasValues}
				<div
					class="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit rounded bg-white/90 px-3 py-1.5 text-sm text-gray-700 shadow dark:bg-gray-800/90 dark:text-gray-200"
				>
					Für {carrier.label} liegen noch keine regionalen Daten vor
				</div>
			{/if}

			{#if tooltip}
				<div
					class="pointer-events-none absolute z-10 min-w-[10rem] rounded border border-gray-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-800"
					style="left: {Math.min(tooltip.x + 12, width - 190)}px; top: {Math.max(
						tooltip.y - 12,
						0
					)}px"
				>
					<div class="font-semibold text-gray-900 dark:text-white">{tooltip.row.region.name}</div>
					{#if tooltip.row.region.layer_label}
						<div class="text-xs text-gray-500 dark:text-gray-400">
							{tooltip.row.region.layer_label}
						</div>
					{/if}
					<div class="mt-1 text-gray-800 dark:text-gray-100">
						{formatPerArea(tooltip.row.perArea)}
					</div>
					<div class="text-gray-600 dark:text-gray-300">{formatAbsolute(tooltip.row.absolute)}</div>
					{#if tooltip.row.rank}
						<div class="text-xs text-gray-500 dark:text-gray-400">
							Rang {tooltip.row.rank} ({normalize === 'area' ? 'pro km²' : 'absolut'})
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Legend: class ranges as text, the current region's class marked with a symbol -->
		{#if legendItems.length}
			<div
				class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-700 dark:text-gray-300"
			>
				<span class="font-medium">{legendUnit || valueLabel}:</span>
				{#each legendItems as item}
					<span class="inline-flex items-center gap-1">
						<span
							class="inline-block h-3 w-5 rounded-sm border border-gray-300 dark:border-gray-600"
							style="background: {item.color}"
						></span>
						{item.label}{#if item.hasCurrent}<span
								class="font-semibold"
								title="Klasse der ausgewählten Region">&nbsp;◆</span
							>{/if}
					</span>
				{/each}
				{#if coloredRows.some((r) => r.value === null)}
					<span class="inline-flex items-center gap-1">
						<span
							class="inline-block h-3 w-5 rounded-sm border border-gray-300 dark:border-gray-600"
							style="background: {isDark ? NO_DATA_DARK : NO_DATA_LIGHT}"
						></span>
						keine Daten
					</span>
				{/if}
				{#if currentRow}
					<span class="inline-flex items-center gap-1">
						<span class="inline-block h-3 w-5 rounded-sm border-2 border-gray-900 dark:border-white"
						></span>
						◆ {currentRow.region.name}
					</span>
				{/if}
			</div>
		{/if}

		{#if selectedRow}
			<div
				class="mt-3 flex flex-wrap items-center justify-between gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
				aria-live="polite"
			>
				<div class="text-gray-800 dark:text-gray-100">
					<span class="font-semibold">{selectedRow.region.name}</span>:
					{formatPerArea(selectedRow.perArea)} · {formatAbsolute(selectedRow.absolute)}
					{#if selectedRow.rank}· Rang {selectedRow.rank}{/if}
				</div>
				{#if !selectedRow.region.isCurrent}
					<a
						href={regionHref(selectedRow.region)}
						class="rounded bg-gray-900 px-3 py-1 text-sm font-medium text-white hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
					>
						Zu {selectedRow.region.name} wechseln
					</a>
				{/if}
			</div>
		{/if}

		<!-- Text alternative for screen readers (no visible list) -->
		<table class="sr-only">
			<caption>{valueLabel} – {coloredRows.length} Regionen</caption>
			<thead><tr><th>Rang</th><th>Region</th><th>{valueLabel}</th></tr></thead>
			<tbody>
				{#each sortedRows as row (row.region.id)}
					<tr>
						<td>{row.rank ?? '–'}</td>
						<td>{row.region.name}{row.region.isCurrent ? ' (ausgewählt)' : ''}</td>
						<td>{formatValue(row.value)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
