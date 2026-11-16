<!--
	All public charging stations (Ladesäulenregister, /api/charging-locations) in the Card's "Karte" tab.
	Nearby stations are combined into bubbles labelled with their number of charging points; clicking
	or zooming in splits them up until the single stations show at their exact location.
	The current region is outlined (aggregate regions: their member districts).
-->
<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import * as maplibregl from '$lib/utils/maplibre';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { cartoRasterTiles } from '$lib/utils/cartoBasemap';
	import { formatNumber, formatDate } from '$lib/utils/formatters';
	import { getAggregateCodes, isAggregateRegion } from '$lib/utils/regionAggregation';
	import { ZUBAU_COLORS } from './config';

	export let region: any = null;
	export let height = 420;

	const BUBBLE = '#1FB5C9';

	// Station pin (40×48 box): white drop with a soft shadow, a light disc in the series colour and
	// the Tabler "bolt" icon in that colour. Same paths for the map icon (canvas) and the legend (SVG).
	const PIN = {
		width: 40,
		height: 48,
		drop: 'M20 44 L15.6 36.4 A17 17 0 1 1 24.4 36.4 Z',
		disc: { cx: 20, cy: 20, r: 13 },
		// Tabler bolt (24×24) scaled to 0.75 and centred on the disc
		bolt: 'M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11',
		boltTransform: { scale: 0.75, x: 11, y: 11 }
	};
	const PIN_RATIO = 2;

	function pinImage(color: string): ImageData {
		const canvas = document.createElement('canvas');
		canvas.width = PIN.width * PIN_RATIO;
		canvas.height = PIN.height * PIN_RATIO;
		const ctx = canvas.getContext('2d')!;
		ctx.scale(PIN_RATIO, PIN_RATIO);
		ctx.shadowColor = 'rgba(0,0,0,0.28)';
		ctx.shadowBlur = 5;
		ctx.shadowOffsetY = 1;
		ctx.fillStyle = '#FFFFFF';
		ctx.fill(new Path2D(PIN.drop));
		ctx.shadowColor = 'transparent';
		ctx.globalAlpha = 0.2;
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(PIN.disc.cx, PIN.disc.cy, PIN.disc.r, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalAlpha = 1;
		const { scale, x, y } = PIN.boltTransform;
		ctx.translate(x, y);
		ctx.scale(scale, scale);
		ctx.strokeStyle = color;
		ctx.lineWidth = 2;
		ctx.lineJoin = 'round';
		ctx.lineCap = 'round';
		ctx.stroke(new Path2D(PIN.bolt));
		return ctx.getImageData(0, 0, canvas.width, canvas.height);
	}
	const MAPTILER_KEY = 'C9NLXahOLRDRQl9OB6yH';
	const TILE_LAYER: Record<string, string> = { state: 'states', district: 'districts', municipality: 'municipalities' };
	const ZOOM: Record<string, number> = { state: 6.4, district: 8.6, municipality: 10.5 };

	interface Locations {
		updateDate: string | null;
		count: number;
		stride: number;
		points: number[];
	}
	/** All stations (Ladeeinrichtungen) at one coordinate, see /api/charging-locations */
	interface Station {
		id: number;
		stations: number;
		points: number;
		fastPoints: number;
		kw: number;
		maxKw: number;
		operators: string[];
		since: string;
		street: string;
		zip: string;
		city: string;
	}

	// One request per map; repeat requests come from the browser cache (the endpoint sends max-age)
	let locationsRequest: Promise<Locations> | null = null;
	function loadLocations(): Promise<Locations> {
		// ?v= changes with the response format, so browsers don't reuse a cached older one (max-age 1 h)
		locationsRequest ??= fetch('/api/charging-locations?v=2').then((r) => {
			if (!r.ok) throw new Error(`Standorte konnten nicht geladen werden (${r.status})`);
			return r.json();
		});
		locationsRequest.catch(() => (locationsRequest = null));
		return locationsRequest;
	}

	let width = 0;
	let loading = true;
	let error: string | null = null;
	let data: Locations | null = null;
	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let darkObserver: MutationObserver | null = null;
	let tip:
		| { x: number; y: number; kind: 'cluster'; points: number; stations: number }
		| { x: number; y: number; kind: 'station'; id: number; station: Station | null }
		| null = null;

	$: code = region ? String(region.codeShort || region.code_short || region.code || '') : '';
	$: layer = !region || region.layer === 'country' ? null : isAggregateRegion(region) ? 'district' : region.layer;
	$: tileLayer = layer ? TILE_LAYER[layer] : null;

	// Browser only: never load the ~4 MB of locations during SSR
	onMount(() => {
		loadLocations()
			.then((d) => (data = d))
			.catch((e) => (error = e.message))
			.finally(() => (loading = false));
	});

	const pageIsDark = () =>
		document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
	const basemap = (kind: 'NoLabels' | 'LabelsOnly') =>
		cartoRasterTiles(`${pageIsDark() ? 'dark' : 'light'}${kind}` as any, { retina: true });

	/**
	 * Which locations belong to the region, by the district (Kreis AGS as a number) the endpoint
	 * assigned them: an aggregate region its member districts, a state its districts, a district
	 * or municipality its district. Germany (or no region): all, so null.
	 */
	function regionFilter(members: string | null): ((district: number) => boolean) | null {
		if (!region || region.layer === 'country') return null;
		if (members) {
			const set = new Set(members.split(',').map((c) => parseInt(c.slice(0, 5), 10)));
			return (d) => set.has(d);
		}
		const c = String(region.code || '');
		if (region.layer === 'state' && /^\d{2}/.test(c)) {
			const state = parseInt(c.slice(0, 2), 10);
			return (d) => Math.floor(d / 1000) === state;
		}
		if (/^\d{5}/.test(c)) {
			const district = parseInt(c.slice(0, 5), 10);
			return (d) => d === district;
		}
		return null;
	}

	/** Stations (Ladeeinrichtungen) shown, for the legend */
	let shownStations: number | null = null;

	function features(d: Locations, keep: ((district: number) => boolean) | null): any {
		const out = [];
		const p = d.points;
		let stations = 0;
		for (let i = 0; i < p.length; i += d.stride) {
			if (keep && !keep(p[i + 6])) continue;
			stations += p[i + 4];
			out.push({
				type: 'Feature',
				geometry: { type: 'Point', coordinates: [p[i + 1], p[i + 2]] },
				properties: { id: p[i], points: p[i + 3], stations: p[i + 4], fast: p[i + 5] }
			});
		}
		shownStations = stations;
		return { type: 'FeatureCollection', features: out };
	}

	function center(): [number, number] {
		const c = region?.center;
		const lon = Array.isArray(c) ? parseFloat(c[0]) : NaN;
		const lat = Array.isArray(c) ? parseFloat(c[1]) : NaN;
		return Number.isFinite(lon) && Number.isFinite(lat) ? [lon, lat] : [10.45, 51.16];
	}

	let initializing = false;
	async function initMap() {
		if (map || initializing || !mapContainer || !data) return;
		// Before creating the map: awaiting after it would miss its 'load' event
		initializing = true;
		const members = isAggregateRegion(region) ? await getAggregateCodes(region).catch(() => null) : null;
		initializing = false;
		if (map || !mapContainer) return;
		const zoom =
			(!region || region.layer === 'country' ? 5 : isAggregateRegion(region) ? 7 : (ZOOM[region.layer] ?? 8)) -
			(width < 500 ? 0.7 : 0);
		map = new maplibregl.Map({
			container: mapContainer,
			style: {
				version: 8,
				glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${MAPTILER_KEY}`,
				sources: {
					basemap: { type: 'raster', tiles: basemap('NoLabels'), tileSize: 256 },
					labels: { type: 'raster', tiles: basemap('LabelsOnly'), tileSize: 256 }
				},
				layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }]
			},
			center: center(),
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
			// Keep the drawing buffer so the Card's PNG export captures the map
			canvasContextAttributes: { preserveDrawingBuffer: true }
		});
		map.touchZoomRotate.disableRotation();
		map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
		map.addControl(
			new maplibregl.AttributionControl({ compact: true, customAttribution: '© OpenStreetMap-Mitwirkende © CARTO' })
		);

		map.on('load', () => {
			if (!map || !data) return;
			const dark = pageIsDark();

			// Outline of the current region (members of an aggregate region), below the bubbles
			if (tileLayer && (code || members)) {
				map.addSource('regions', {
					type: 'vector',
					tiles: [`https://tiles.klimadashboard.org/data/${tileLayer}-${String(region.country || 'DE').toLowerCase()}/{z}/{x}/{y}.pbf`],
					minzoom: 4,
					maxzoom: 12
				});
				const filter: any = members ? ['in', ['get', 'AGS'], ['literal', members.split(',')]] : ['==', ['get', 'AGS'], code];
				map.addLayer({
					id: 'region-fill',
					type: 'fill',
					source: 'regions',
					'source-layer': tileLayer,
					filter,
					paint: { 'fill-color': BUBBLE, 'fill-opacity': 0.06 }
				});
				map.addLayer({
					id: 'region-line',
					type: 'line',
					source: 'regions',
					'source-layer': tileLayer,
					filter,
					paint: { 'line-color': dark ? '#F4F4F5' : '#18181B', 'line-width': 1.2, 'line-opacity': 0.6 }
				});
			}
			map.addLayer({ id: 'labels', type: 'raster', source: 'labels' });

			map.addSource('stations', {
				type: 'geojson',
				// Only the region's stations: no bubbles from neighbouring districts
				data: features(data, regionFilter(members)),
				cluster: true,
				clusterRadius: 45,
				clusterMaxZoom: 14,
				clusterProperties: { points: ['+', ['get', 'points']] }
			});

			// Bubbles: area grows with the charging points, a soft halo like a ripple
			const radius: any = ['interpolate', ['linear'], ['sqrt', ['get', 'points']], 1, 9, 10, 15, 50, 30, 150, 46];
			map.addLayer({
				id: 'cluster-halo',
				type: 'circle',
				source: 'stations',
				filter: ['has', 'point_count'],
				paint: { 'circle-color': BUBBLE, 'circle-opacity': 0.25, 'circle-radius': ['+', radius, 5] }
			});
			map.addLayer({
				id: 'clusters',
				type: 'circle',
				source: 'stations',
				filter: ['has', 'point_count'],
				paint: {
					'circle-color': BUBBLE,
					'circle-opacity': 0.9,
					'circle-radius': radius,
					'circle-stroke-color': '#FFFFFF',
					'circle-stroke-width': 1,
					'circle-stroke-opacity': 0.6
				}
			});
			map.addLayer({
				id: 'cluster-count',
				type: 'symbol',
				source: 'stations',
				filter: ['has', 'point_count'],
				layout: {
					'text-field': [
						'case',
						['>=', ['get', 'points'], 10000],
						['concat', ['number-format', ['/', ['get', 'points'], 1000], { locale: 'de', 'max-fraction-digits': 0 }], ' Tsd'],
						['number-format', ['get', 'points'], { locale: 'de' }]
					],
					'text-font': ['Noto Sans Bold'],
					'text-size': ['interpolate', ['linear'], ['get', 'points'], 10, 11, 1000, 13, 10000, 15],
					'text-allow-overlap': true
				},
				paint: { 'text-color': '#FFFFFF', 'text-halo-color': 'rgba(0,0,0,0.25)', 'text-halo-width': 1 }
			});

			// Locations at their exact position as pins: red with Schnellladepunkte, teal with
			// Normalladepunkte only; from 3 charging points their number sits next to the pin
			map.addImage('pin-normal', pinImage(ZUBAU_COLORS.normal), { pixelRatio: PIN_RATIO });
			map.addImage('pin-fast', pinImage(ZUBAU_COLORS.fast), { pixelRatio: PIN_RATIO });
			const isFast: any = ['>', ['get', 'fast'], 0];
			map.addLayer({
				id: 'stations',
				type: 'symbol',
				source: 'stations',
				filter: ['!', ['has', 'point_count']],
				layout: {
					'icon-image': ['case', isFast, 'pin-fast', 'pin-normal'],
					'icon-anchor': 'bottom',
					'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.55, 16, 0.85],
					'icon-allow-overlap': true,
					'icon-ignore-placement': true,
					// larger locations drawn on top
					'symbol-sort-key': ['-', 0, ['get', 'points']]
				}
			});
			map.addLayer({
				id: 'station-count',
				type: 'symbol',
				source: 'stations',
				filter: ['all', ['!', ['has', 'point_count']], ['>=', ['get', 'points'], 3]],
				minzoom: 13,
				layout: {
					'text-field': ['number-format', ['get', 'points'], { locale: 'de' }],
					'text-font': ['Noto Sans Bold'],
					'text-size': 11,
					'text-anchor': 'left',
					// right of the pin's head (the icon is anchored at its tip)
					'text-offset': [1.45, -2.2],
					'text-allow-overlap': true
				},
				paint: {
					'text-color': ['case', isFast, ZUBAU_COLORS.fast, ZUBAU_COLORS.normal],
					'text-halo-color': '#FFFFFF',
					'text-halo-width': 1.5
				}
			});

			map.on('click', 'clusters', async (e: any) => {
				const f = e.features?.[0];
				if (!f || !map) return;
				const src = map.getSource('stations') as any;
				const zoomTo = await src.getClusterExpansionZoom(f.properties.cluster_id);
				map.easeTo({ center: f.geometry.coordinates, zoom: zoomTo });
			});
			map.on('mousemove', 'clusters', (e: any) => {
				const f = e.features?.[0];
				if (!f || !map) return;
				map.getCanvas().style.cursor = 'pointer';
				tip = { x: e.point.x, y: e.point.y, kind: 'cluster', points: f.properties.points, stations: f.properties.point_count };
			});
			map.on('mousemove', 'stations', (e: any) => {
				const f = e.features?.[0];
				if (!f || !map) return;
				map.getCanvas().style.cursor = 'pointer';
				const id = Number(f.properties.id);
				if (tip?.kind === 'station' && tip.id === id) {
					tip = { ...tip, x: e.point.x, y: e.point.y };
					return;
				}
				tip = { x: e.point.x, y: e.point.y, kind: 'station', id, station: null };
				fetch(`/api/charging-locations?id=${id}`)
					.then((r) => (r.ok ? r.json() : null))
					.then((s) => {
						if (tip?.kind === 'station' && tip.id === id) tip = { ...tip, station: s };
					})
					// No details: close the tooltip instead of leaving "Lade Details…"
					.catch(() => {
						if (tip?.kind === 'station' && tip.id === id) tip = null;
					});
			});
			// Each layer only closes its own tooltip: leaving a bubble may fire after entering a station
			for (const [id, kind] of [['clusters', 'cluster'], ['stations', 'station']] as const)
				map.on('mouseleave', id, () => {
					if (map) map.getCanvas().style.cursor = '';
					if (tip?.kind === kind) tip = null;
				});

			mapContainer?.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
		});

		darkObserver = new MutationObserver(() => {
			(map?.getSource('basemap') as any)?.setTiles(basemap('NoLabels'));
			(map?.getSource('labels') as any)?.setTiles(basemap('LabelsOnly'));
			if (map?.getLayer('region-line')) map.setPaintProperty('region-line', 'line-color', pageIsDark() ? '#F4F4F5' : '#18181B');
		});
		for (const el of [document.documentElement, document.body])
			darkObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
	}

	$: if (data && mapContainer && !map) tick().then(initMap);
	$: if (width && map) map.resize();

	onDestroy(() => {
		darkObserver?.disconnect();
		map?.remove();
	});

	$: mapHeight = width < 500 ? 340 : height;
</script>

<div class="w-full" bind:clientWidth={width}>
	{#if loading}
		<div class="animate-pulse rounded bg-gray-100 dark:bg-gray-800" style="height: {mapHeight}px"></div>
	{:else if error}
		<div class="flex items-center justify-center text-red-500" style="height: {mapHeight}px">{error}</div>
	{:else}
		<div class="relative overflow-hidden rounded bg-gray-50 dark:bg-gray-900" style="height: {mapHeight}px">
			<div
				bind:this={mapContainer}
				class="h-full w-full"
				role="img"
				aria-label="Karte der {formatNumber(shownStations ?? data?.count ?? 0)} öffentlichen Ladeeinrichtungen in {region?.name ?? 'Deutschland'}, zu Bubbles mit der Zahl ihrer Ladepunkte zusammengefasst"
			></div>

			{#if tip}
				<div
					class="pointer-events-none absolute z-10 min-w-[11rem] max-w-[16rem] rounded border border-gray-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-800"
					style="left: {Math.min(tip.x + 12, width - 270)}px; top: {Math.max(tip.y - 12, 0)}px"
				>
					{#if tip.kind === 'cluster'}
						<div class="font-semibold text-gray-900 dark:text-white">{formatNumber(tip.points)} Ladepunkte</div>
						<div class="text-xs text-gray-700 dark:text-gray-300">
							an {formatNumber(tip.stations)} Standorten · Klicken zum Vergrößern
						</div>
					{:else if !tip.station}
						<div class="text-gray-600 dark:text-gray-300">Lade Details…</div>
					{:else}
						{@const s = tip.station}
						{@const many = s.stations > 1}
						<div class="font-semibold text-gray-900 dark:text-white">
							{s.operators.slice(0, 2).join(', ')}{s.operators.length > 2 ? ` und ${s.operators.length - 2} weitere` : ''}
						</div>
						<div class="text-xs text-gray-600 dark:text-gray-400">{s.street}, {s.zip} {s.city}</div>
						<dl class="mt-1 grid grid-cols-[auto_1fr] gap-x-2 text-xs text-gray-700 dark:text-gray-300">
							<dt>Ladepunkte</dt>
							<dd>
								{formatNumber(s.points)}{#if s.fastPoints}&nbsp;(davon {formatNumber(s.fastPoints)} Schnellladen){/if}
							</dd>
							{#if many}<dt>Ladeeinrichtungen</dt><dd>{formatNumber(s.stations)}</dd>{/if}
							<dt>Leistung</dt>
							<dd>{many ? `${formatNumber(s.kw)} kW gesamt, bis ${formatNumber(s.maxKw)} kW` : `${formatNumber(s.kw)} kW`}</dd>
							{#if !many && s.since}<dt>In Betrieb seit</dt><dd>{s.since}</dd>{/if}
						</dl>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Legend: bubbles carry their number as text; the pins match the map icons (colour plus label) -->
		<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-700 dark:text-gray-300">
			<span class="inline-flex items-center gap-1.5">
				<span class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white" style="background: {BUBBLE}">12</span>
				Ladepunkte in der Umgebung
			</span>
			{#each [{ color: ZUBAU_COLORS.normal, label: 'Standort mit Normalladepunkten' }, { color: ZUBAU_COLORS.fast, label: 'Standort mit Schnellladepunkten' }] as item}
				<span class="inline-flex items-center gap-1">
					<svg width="17" height="20" viewBox="0 0 {PIN.width} {PIN.height}" aria-hidden="true" class="shrink-0 drop-shadow">
						<path d={PIN.drop} fill="#FFFFFF" />
						<circle cx={PIN.disc.cx} cy={PIN.disc.cy} r={PIN.disc.r} fill={item.color} fill-opacity="0.2" />
						<path
							d={PIN.bolt}
							transform="translate({PIN.boltTransform.x} {PIN.boltTransform.y}) scale({PIN.boltTransform.scale})"
							fill="none"
							stroke={item.color}
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					{item.label}
				</span>
			{/each}
			<!-- Count of the region's stations: only once the map has filtered them -->
			{#if shownStations !== null}
				<span class="text-gray-500 dark:text-gray-400">
					{formatNumber(shownStations)} Ladeeinrichtungen in Betrieb{region?.name && region.layer !== 'country'
						? ` in ${region.name}`
						: ''}{data?.updateDate ? `, Stand ${formatDate(data.updateDate)}` : ''}
				</span>
			{/if}
		</div>
	{/if}
</div>
