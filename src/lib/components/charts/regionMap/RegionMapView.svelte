<!--
	Regional choropleth for energy carriers (PV, wind, storage, …), shown in the Card's "Karte" tab.

	All regions of the current region's layer, coloured by installed power/capacity/units – per km²
	by default – and centred on the current region (aggregate regions: their members, others dimmed).
	Geometry from our own vector tiles, no glyphs. Driven by the `energy` key, see `CARRIERS` in
	regionMapData.ts. Carriers with `points` (wind) also show the unit locations on a CARTO
	basemap (raster, no labels below the choropleth, labels above it); the others have no basemap.
-->
<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import { page } from '$app/state';
	import { readItems } from '@directus/sdk';
	import * as maplibregl from '$lib/utils/maplibre';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { interpolateRgb, piecewise } from 'd3-interpolate';
	import Switch from '$lib/components/Switch.svelte';
	import { Toggle } from '$lib/components/ui';
	import { cartoRasterTiles } from '$lib/utils/cartoBasemap';
	import {
		fetchTurbineDetails,
		type TurbineData
	} from '$lib/components/charts/custom/renewablesExplorer/config';
	import getDirectusInstance from '$lib/utils/directus';
	import { formatNumber } from '$lib/utils/formatters';
	import { getAggregateCodes, isAggregateRegion } from '$lib/utils/regionAggregation';
	import {
		getCarrier,
		loadCarrierValues,
		loadUnitLocations,
		type MapMetric,
		type RegionValues
	} from './regionMapData';

	export let region: any = null;
	export let regionLoading = false;
	/** Carrier key: 'solar', 'wind', 'storage', 'biomass', 'hydro' */
	export let energy = 'solar';
	export let height = 380;

	const CLASSES = 5;
	const TILE_LAYER: Record<string, string> = {
		state: 'states',
		district: 'districts',
		municipality: 'municipalities'
	};
	const ZOOM: Record<string, number> = { state: 4.6, district: 7.2, municipality: 9 };

	let normalize: 'area' | 'absolute' = 'area';
	let metric: MapMetric = getCarrier(energy).metrics[0];
	let width = 0;
	let loading = true;
	let values = new Map<string, RegionValues>();
	let members: string[] | null = null;
	let isDark = false;
	let tooltip: { x: number; y: number; code: string; name: string } | null = null;
	let selected: { code: string; name: string; href: string | null } | null = null;

	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let mapLoaded = false;
	let marker: maplibregl.Marker | null = null;
	let hoverCode: string | null = null;
	let darkObserver: MutationObserver | null = null;

	// Unit locations (carriers with `points`)
	const OWN_COLOR = '#0ea5e9';
	let showPoints = true;
	let units: TurbineData[] = [];
	let unitTip: { x: number; y: number; id: string; data: TurbineData | null } | null = null;

	$: carrier = getCarrier(energy);
	$: withPoints = !!carrier.points;
	$: if (withPoints) loadUnitLocations(energy).then((d) => ((units = d), addUnits()));
	$: ownUnits = r?.id ? units.filter((u) => u.region_owner === r.id).length : 0;
	$: if (!carrier.metrics.includes(metric)) metric = carrier.metrics[0];

	// The Card passes a Region (getRegion.ts); without one fall back to the page's region
	$: r = region ?? page?.data?.page ?? null;
	$: country = String(r?.country || 'DE');
	$: code = r ? String(r.codeShort || r.code_short || r.code || '') : '';
	$: layer = !r || r.layer === 'country' ? 'state' : isAggregateRegion(r) ? 'district' : r.layer;
	$: tileLayer = TILE_LAYER[layer] ?? 'districts';

	// ------------------------------------------------------------------ data
	let reqId = 0;
	$: if (!regionLoading) load(r, energy, layer, country);

	async function load(reg: any, e: string, l: string, c: string) {
		const my = ++reqId;
		loading = true;
		const [v, m] = await Promise.all([
			loadCarrierValues(e, l, c),
			isAggregateRegion(reg) ? getAggregateCodes(reg).catch(() => null) : null
		]);
		if (my !== reqId) return;
		values = v;
		members = m ? m.split(',') : null;
		loading = false;
	}

	/** Value of a region for the current metric/normalisation (re-created when they change) */
	$: valueOf = (ags: string): number | null => {
		const v = values.get(ags);
		if (!v) return values.size ? 0 : null; // missing from a non-empty result: no units there
		const abs = metric === 'capacity' ? v.capacity : v[metric];
		if (abs === null || normalize === 'absolute') return abs;
		return v.area ? abs / v.area : null;
	};

	$: hasData = values.size > 0;
	$: numbers = [...values.keys()].map(valueOf).filter((v): v is number => v !== null);
	$: thresholds = quantiles(numbers);
	$: palette = makePalette(carrier.colors, isDark, thresholds.length + 1);
	$: isAggregate = isAggregateRegion(r);
	$: currentValue = code && hasData && !isAggregate ? valueOf(code) : null;

	function quantiles(vals: number[]): number[] {
		const s = [...vals].sort((a, b) => a - b);
		const t: number[] = [];
		for (let i = 1; i < CLASSES && s.length > 1; i++) {
			const q = s[Math.floor((i / CLASSES) * s.length)];
			if (q > s[0] && (!t.length || q > t[t.length - 1])) t.push(q); // no empty classes
		}
		return t;
	}

	/** Chart colours: pale → strong in light mode; on dark backgrounds dark grey → strong → pale */
	function makePalette([pale, strong]: [string, string], dark: boolean, n: number): string[] {
		const ramp = dark
			? piecewise(interpolateRgb, ['#3F3F46', strong, pale])
			: interpolateRgb(pale, strong);
		return Array.from({ length: n }, (_, i) =>
			ramp(n === 1 ? 1 : dark ? 0.15 + (0.85 * i) / (n - 1) : 0.1 + (0.9 * i) / (n - 1))
		);
	}

	$: classOf = (v: number) => thresholds.filter((t) => v >= t).length;
	const noDataColor = () => (isDark ? '#3F3F46' : '#E4E4E7');

	function fillExpression(): any {
		if (!hasData) return noDataColor();
		const expr: any[] = ['match', ['get', 'AGS']];
		for (const ags of values.keys()) {
			const v = valueOf(ags);
			expr.push(ags, v === null ? noDataColor() : palette[classOf(v)]);
		}
		expr.push(palette[0]);
		return expr;
	}

	// ------------------------------------------------------------------ formatting
	const powerUnits = () => (energy === 'solar' ? ['kWp', 'MWp', 'GWp'] : ['kW', 'MW', 'GW']);

	function formatAbsolute(v: number | null, m: MapMetric = metric): string {
		if (v === null) return 'keine Daten';
		if (m === 'units') return `${formatNumber(v)} Anlagen`;
		const [u0, u1, u2] = m === 'capacity' ? ['kWh', 'MWh', 'GWh'] : powerUnits();
		const [div, unit] = v >= 1e6 ? [1e6, u2] : v >= 1e3 ? [1e3, u1] : [1, u0];
		const x = v / div;
		return `${formatNumber(x, div === 1 || x >= 100 ? 0 : x >= 10 ? 1 : 2)} ${unit}`;
	}

	function formatNumberShort(v: number): string {
		return v === 0 ? '0' : formatNumber(v, v >= 100 ? 0 : v >= 10 ? 1 : 2);
	}

	$: unit = metric === 'units' ? 'Anlagen' : metric === 'capacity' ? 'kWh' : powerUnits()[0];
	$: formatValue = (v: number | null) =>
		v === null
			? 'keine Daten'
			: normalize === 'area'
				? `${formatNumberShort(v)} ${unit}/km²`
				: formatAbsolute(v);
	$: legend = palette.map((color, i) => ({
		color,
		label:
			normalize === 'area' || metric === 'units'
				? `${formatNumberShort(i === 0 ? Math.min(...numbers) : thresholds[i - 1])} – ${formatNumberShort(i === thresholds.length ? Math.max(...numbers) : thresholds[i])}`
				: `${formatAbsolute(i === 0 ? Math.min(...numbers) : thresholds[i - 1])} – ${formatAbsolute(i === thresholds.length ? Math.max(...numbers) : thresholds[i])}`,
		current: currentValue !== null && classOf(currentValue) === i
	}));

	// ------------------------------------------------------------------ map
	const pageIsDark = () =>
		document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');

	function center(): [number, number] | null {
		const c = r?.center;
		if (!Array.isArray(c)) return null;
		const lon = parseFloat(c[0]);
		const lat = parseFloat(c[1]);
		return Number.isFinite(lon) && Number.isFinite(lat) ? [lon, lat] : null;
	}

	function initMap() {
		if (map || !mapContainer) return;
		isDark = pageIsDark();
		const c = center() ?? (country === 'AT' ? [13.33, 47.5] : [10.45, 51.16]);
		const zoom =
			(r?.layer === 'country' ? 4.6 : isAggregateRegion(r) ? 6.6 : (ZOOM[layer] ?? 7)) -
			(width < 500 ? 0.7 : 0);
		map = new maplibregl.Map({
			container: mapContainer,
			style: withPoints
				? {
						version: 8,
						sources: {
							basemap: { type: 'raster', tiles: basemapTiles('NoLabels'), tileSize: 256 },
							labels: { type: 'raster', tiles: basemapTiles('LabelsOnly'), tileSize: 256 }
						},
						layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }]
					}
				: { version: 8, sources: {}, layers: [] },
			center: c,
			zoom,
			minZoom: 4,
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
		if (withPoints)
			map.addControl(
				new maplibregl.AttributionControl({
					compact: true,
					customAttribution: '© OpenStreetMap-Mitwirkende © CARTO'
				})
			);

		map.on('load', () => {
			if (!map) return;
			map.addSource('regions', {
				type: 'vector',
				tiles: [
					`https://tiles.klimadashboard.org/data/${tileLayer}-${country.toLowerCase()}/{z}/{x}/{y}.pbf`
				],
				minzoom: 4,
				maxzoom: 12,
				promoteId: { [tileLayer]: 'AGS' }
			});
			const own = ['==', ['get', 'AGS'], code];
			const add = (id: string, type: any, paint: any, filter?: any) =>
				map!.addLayer({
					id,
					type,
					source: 'regions',
					'source-layer': tileLayer,
					paint,
					...(filter && { filter })
				});
			add('fill', 'fill', withPoints ? { 'fill-opacity': 0.7 } : {});
			add('border', 'line', { 'line-width': 0.6 });
			add('hover', 'line', {
				'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 0]
			});
			if (withPoints) {
				map.addLayer({ id: 'labels', type: 'raster', source: 'labels' });
				map.addSource('units', { type: 'geojson', data: unitFeatures() });
				map.addLayer({
					id: 'units',
					type: 'circle',
					source: 'units',
					layout: { visibility: showPoints ? 'visible' : 'none' },
					paint: {
						'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 1.4, 8, 2.6, 11, 4.5],
						'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 5, 0, 8, 0.6]
					}
				});
				map.on('mousemove', 'units', (e: any) => {
					const f = e.features?.[0];
					if (!f || !map) return;
					map.getCanvas().style.cursor = 'pointer';
					tooltip = null;
					const id = String(f.properties?.id);
					if (unitTip?.id !== id) {
						unitTip = { x: e.point.x, y: e.point.y, id, data: null };
						fetchTurbineDetails(id, energy as any).then((d) => {
							if (unitTip?.id === id) unitTip = { ...unitTip, data: d };
						});
					} else unitTip = { ...unitTip, x: e.point.x, y: e.point.y };
				});
				map.on('mouseleave', 'units', () => (unitTip = null));
			}
			add('current-casing', 'line', { 'line-width': 5 }, own);
			add('current', 'line', { 'line-width': 2.5 }, own);

			map.on('mousemove', 'fill', (e: any) => {
				const f = e.features?.[0];
				if (!f || !map) return;
				map.getCanvas().style.cursor = 'pointer';
				setHover(String(f.id));
				if (unitTip) return; // a unit's tooltip wins over the region's
				tooltip = { x: e.point.x, y: e.point.y, code: String(f.id), name: f.properties?.GEN ?? '' };
			});
			map.on('mouseleave', 'fill', () => {
				if (map) map.getCanvas().style.cursor = '';
				setHover(null);
				tooltip = null;
			});
			map.on('click', 'fill', (e: any) => {
				const f = e.features?.[0];
				if (f) select(String(f.id), f.properties?.GEN ?? '');
			});

			// Compact attribution starts collapsed (the ⓘ button opens it)
			mapContainer
				?.querySelector('.maplibregl-ctrl-attrib')
				?.classList.remove('maplibregl-compact-show');
			mapLoaded = true;
			paint();
		});

		darkObserver = new MutationObserver(() => (isDark = pageIsDark()));
		for (const el of [document.documentElement, document.body])
			darkObserver.observe(el, { attributes: true, attributeFilter: ['class'] });

		if (center() && r?.layer !== 'country') {
			const el = document.createElement('div');
			el.className =
				'pointer-events-none rounded bg-white/90 px-1.5 py-0.5 text-xs font-semibold text-gray-900 shadow dark:bg-gray-900/90 dark:text-white';
			el.textContent = r?.name ?? '';
			el.setAttribute('aria-hidden', 'true');
			marker = new maplibregl.Marker({ element: el }).setLngLat(c).addTo(map);
		}
	}

	function basemapTiles(kind: 'NoLabels' | 'LabelsOnly') {
		const dark = pageIsDark();
		return cartoRasterTiles(`${dark ? 'dark' : 'light'}${kind}` as any, { retina: true });
	}

	function unitFeatures(): any {
		return {
			type: 'FeatureCollection',
			features: units.map((u) => ({
				type: 'Feature',
				geometry: { type: 'Point', coordinates: [u.lon, u.lat] },
				properties: { id: u.id, own: !!r?.id && u.region_owner === r.id }
			}))
		};
	}

	function addUnits() {
		const src = map?.getSource('units') as any;
		if (mapLoaded && src) src.setData(unitFeatures());
	}

	function setHover(ags: string | null) {
		if (!map || !mapLoaded) return;
		const target = (id: string) => ({ source: 'regions', sourceLayer: tileLayer, id });
		if (hoverCode && hoverCode !== ags) map.setFeatureState(target(hoverCode), { hover: false });
		if (ags) map.setFeatureState(target(ags), { hover: true });
		hoverCode = ags;
	}

	// Arguments only make the reactive call above re-run when they change
	function paint(..._deps: unknown[]) {
		if (!map || !mapLoaded) return;
		const line = isDark ? '#18181B' : '#FFFFFF';
		const strong = isDark ? '#FFFFFF' : '#18181B';
		// Aggregate regions: only members get data colours, the rest stays neutral for orientation
		const fill = fillExpression();
		map.setPaintProperty(
			'fill',
			'fill-color',
			members?.length
				? ['match', ['get', 'AGS'], members, fill, isDark ? '#27272A' : '#F4F4F5']
				: fill
		);
		map.setPaintProperty('border', 'line-color', line);
		map.setPaintProperty('hover', 'line-color', strong);
		map.setPaintProperty('current-casing', 'line-color', line);
		map.setPaintProperty('current', 'line-color', strong);
		if (withPoints && map.getLayer('units')) {
			map.setPaintProperty('units', 'circle-color', [
				'case',
				['get', 'own'],
				OWN_COLOR,
				isDark ? '#F4F4F5' : '#18181B'
			]);
			map.setPaintProperty('units', 'circle-stroke-color', line);
			map.setLayoutProperty('units', 'visibility', showPoints ? 'visible' : 'none');
			(map.getSource('basemap') as any)?.setTiles(basemapTiles('NoLabels'));
			(map.getSource('labels') as any)?.setTiles(basemapTiles('LabelsOnly'));
		}
	}

	async function select(ags: string, name: string) {
		selected = { code: ags, name, href: null };
		if (ags === code) return;
		try {
			const [hit] = (await getDirectusInstance().request(
				readItems('regions', {
					filter: {
						layer: { _eq: layer },
						country: { _eq: country },
						_or: [{ code_short: { _eq: ags } }, { code: { _eq: ags } }]
					},
					fields: ['id', 'slug'],
					limit: 1
				})
			)) as any[];
			if (hit && selected?.code === ags) {
				const lang = page?.params?.lang ? `/${page.params.lang}` : '';
				selected = {
					...selected,
					href: `${lang}/regions/${hit.slug || hit.id}${window.location.hash}`
				};
			}
		} catch {
			/* no link then */
		}
	}

	$: if (!loading && mapContainer && !map) tick().then(initMap);
	$: if (map) paint(valueOf, classOf, palette, members, isDark, showPoints);
	$: if (width && map) map.resize();

	onDestroy(() => {
		darkObserver?.disconnect();
		marker?.remove();
		map?.remove();
	});

	$: metricViews = carrier.metrics.map((m) => ({
		key: m,
		label: m === 'power' ? 'Leistung' : m === 'capacity' ? 'Kapazität' : 'Anzahl Anlagen',
		icon: ICONS[m]
	}));
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
	const swatch = 'inline-block h-3 w-5 rounded-sm border border-gray-300 dark:border-gray-600';
</script>

<div class="w-full" bind:clientWidth={width}>
	<div class="mb-4 flex flex-wrap gap-2">
		<Switch
			label="Darstellung"
			views={normalizeViews}
			activeView={normalize}
			on:itemClick={(e) => (normalize = e.detail)}
		/>
		{#if carrier.metrics.length > 1}
			<Switch
				label="Kennzahl"
				views={metricViews}
				activeView={metric}
				on:itemClick={(e) => (metric = e.detail)}
			/>
		{/if}
		{#if withPoints}
			<div class="flex items-center">
				<Toggle label="Anlagenstandorte" bind:checked={showPoints} />
			</div>
		{/if}
	</div>

	{#if loading && !map}
		<div
			class="animate-pulse rounded bg-gray-100 dark:bg-gray-800"
			style="height: {width < 500 ? 320 : height}px"
		></div>
	{:else}
		<div
			class="relative overflow-hidden rounded bg-gray-50 dark:bg-gray-900"
			style="height: {width < 500 ? 320 : height}px"
		>
			<div
				bind:this={mapContainer}
				class="h-full w-full"
				role="img"
				aria-label="Karte: {carrier.label}, {normalize === 'area'
					? 'pro km²'
					: 'absolut'}.{r?.name && currentValue !== null
					? ` ${r.name}: ${formatValue(currentValue)}.`
					: ''}"
			></div>

			{#if !hasData && !loading}
				<div
					class="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit rounded bg-white/90 px-3 py-1.5 text-sm text-gray-700 shadow dark:bg-gray-800/90 dark:text-gray-200"
				>
					Für {carrier.label} liegen noch keine regionalen Daten vor
				</div>
			{/if}

			{#if unitTip}
				{@const u = unitTip.data}
				<div
					class="pointer-events-none absolute z-10 min-w-[11rem] rounded border border-gray-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-800"
					style="left: {Math.min(unitTip.x + 12, width - 210)}px; top: {Math.max(unitTip.y - 12, 0)}px"
				>
					{#if !u}
						<div class="text-gray-600 dark:text-gray-300">Lade Details…</div>
					{:else}
						<div class="font-semibold text-gray-900 dark:text-white">
							{u.name || carrier.points?.labelSingular}
						</div>
						<dl class="mt-0.5 grid grid-cols-[auto_1fr] gap-x-2 text-xs text-gray-700 dark:text-gray-300">
							<dt>Leistung</dt><dd>{formatAbsolute(u.net_power_kw, 'power')}</dd>
							{#if u.commissioning_date}
								<dt>In Betrieb seit</dt><dd>{new Date(u.commissioning_date).toLocaleDateString('de-DE')}</dd>
							{/if}
							{#if u.municipality}<dt>Gemeinde</dt><dd>{u.municipality}</dd>{/if}
							{#if u.height}<dt>Nabenhöhe</dt><dd>{u.height} m</dd>{/if}
							{#if u.rotor_diameter}<dt>Rotor</dt><dd>{u.rotor_diameter} m</dd>{/if}
							{#if u.manufacturer && u.manufacturer !== 'Unbekannt'}<dt>Hersteller</dt><dd>{u.manufacturer}</dd>{/if}
						</dl>
					{/if}
				</div>
			{:else if tooltip}
				{@const v = values.get(tooltip.code)}
				<div
					class="pointer-events-none absolute z-10 min-w-[10rem] rounded border border-gray-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-800"
					style="left: {Math.min(tooltip.x + 12, width - 190)}px; top: {Math.max(
						tooltip.y - 12,
						0
					)}px"
				>
					<div class="font-semibold text-gray-900 dark:text-white">{tooltip.name}</div>
					<div class="text-gray-800 dark:text-gray-100">{formatValue(valueOf(tooltip.code))}</div>
					{#if normalize === 'area' && v}
						<div class="text-gray-600 dark:text-gray-300">
							{formatAbsolute(metric === 'capacity' ? v.capacity : v[metric])}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		{#if hasData && numbers.length}
			{#if withPoints && showPoints && units.length}
				<div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-700 dark:text-gray-300">
					<span class="inline-flex items-center gap-1.5">
						<span class="inline-block h-2.5 w-2.5 rounded-full bg-gray-900 ring-1 ring-white dark:bg-gray-100 dark:ring-gray-900"></span>
						{carrier.points?.label} ({formatNumber(units.length)} in Betrieb)
					</span>
					{#if ownUnits}
						<span class="inline-flex items-center gap-1.5">
							<span class="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-white dark:ring-gray-900" style="background: {OWN_COLOR}"></span>
							Anlagen von {r?.name} ({formatNumber(ownUnits)})
						</span>
					{/if}
				</div>
			{/if}
			<div
				class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-700 dark:text-gray-300"
			>
				{#if normalize === 'area'}<span class="font-medium">{unit}/km²:</span>{/if}
				{#each legend as item}
					<span class="inline-flex items-center gap-1">
						<span class={swatch} style="background: {item.color}"></span>
						{item.label}{#if item.current}<span class="font-semibold" title="Klasse von {r?.name}"
								>&nbsp;◆</span
							>{/if}
					</span>
				{/each}
				{#if r?.name && r.layer !== 'country' && !isAggregate}
					<span class="inline-flex items-center gap-1">
						<span class="inline-block h-3 w-5 rounded-sm border-2 border-gray-900 dark:border-white"
						></span>
						◆ {r.name}
					</span>
				{/if}
			</div>
		{/if}

		{#if selected}
			<div
				class="mt-3 flex flex-wrap items-center justify-between gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
				aria-live="polite"
			>
				<div class="text-gray-800 dark:text-gray-100">
					<span class="font-semibold">{selected.name}</span>: {formatValue(valueOf(selected.code))}
				</div>
				{#if selected.href}
					<a
						href={selected.href}
						class="rounded bg-gray-900 px-3 py-1 text-sm font-medium text-white hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
					>
						Zu {selected.name} wechseln
					</a>
				{/if}
			</div>
		{/if}
	{/if}
</div>
