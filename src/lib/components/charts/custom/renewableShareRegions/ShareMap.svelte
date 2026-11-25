<!-- $lib/components/charts/custom/renewableShareRegions/ShareMap.svelte
	Map view: the compared districts (a Metropolregion's members, or all districts of the state)
	coloured by their renewable share, diverging at 100 %: blues below (darker = further from
	covering the consumption), greens from 100 % on. Districts outside the comparison stay
	neutral and borderless for orientation; the compared districts are separated by gaps in the
	background colour, members without data are hatched.

	The emphasised district (the page's own, or one picked in the dropdown or by clicking it) gets
	a strong outline and a label with value and rank; on a municipality's page the municipality is
	outlined too. The district with the highest share is named in a note in the map corner nearest
	to it, with an arrow pointing at it. The largest cities are labelled with their value (spaced
	so labels don't collide). Tooltips show value and rank, the legend counts the districts per
	class.
	Geometry from our own vector tiles (no basemap, no glyphs), framed on the districts' centres. -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import * as maplibregl from '$lib/utils/maplibre';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { interpolateLab } from 'd3-interpolate';
	import { formatNumber, formatPercent } from '$lib/utils/formatters';
	import { Legend } from '$lib/components/charts/primitives';
	import type { Region } from '$lib/utils/getRegion';
	import type { ShareRow } from './config';

	/** the compared districts */
	export let rows: ShareRow[];
	/** members without data: hatched, part of the region's contour */
	export let missing: ShareRow[] = [];
	/** id of the emphasised district ('' = none) */
	export let selected = '';
	/** the page region (outlined when it is a municipality) */
	export let region: Region | null = null;
	export let label = '';

	// Class breaks in %, and their colours (ColorBrewer blues / greens from the Tailwind theme).
	// Five classes with clearly distinct, saturated steps – the palest blues read as gray on the
	// dark background.
	// Below 100 % four blues with evenly spaced lightness (ColorBrewer Blues 800/–/500/300), the
	// palest closest to the midpoint; above it a light yellow-green and a strong green
	// (ColorBrewer RdYlGn), so 75–100 % and 100–125 % differ in hue, not only in lightness
	const BREAKS = [25, 50, 75, 100, 125];
	const COLORS = ['#08519C', '#3182BD', '#6BAED6', '#C6DBEF', '#A6D96A', '#1A9641'];
	// Dark mode: the same hues pulled slightly towards the page background, so the light classes
	// don't glare
	const DARK_COLORS = COLORS.map((c) => interpolateLab(c, '#18181B')(0.1));
	const classOf = (share: number) => BREAKS.filter((b) => share >= b).length;
	const pct = (v: number) => formatPercent(v, 0);
	const CLASS_LABELS = [
		`unter ${pct(25)}`,
		`${pct(25)} – ${pct(50)}`,
		`${pct(50)} – ${pct(75)}`,
		`${pct(75)} – ${pct(100)}`,
		`${pct(100)} – ${pct(125)}`,
		`ab ${pct(125)}`
	];
	const NO_DATA = '#A1A1AA';
	const CITY_LABELS = 4;
	const CITY_SPACING = 70; // px between city labels

	let width = 0;
	let isDark = false;
	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let mapLoaded = false;
	let marker: maplibregl.Marker | null = null;
	let cityMarkers: maplibregl.Marker[] = [];
	let hoverCode: string | null = null;
	let tooltip: { x: number; y: number; row: ShareRow } | null = null;
	let darkObserver: MutationObserver | null = null;

	$: height = width && width < 500 ? 380 : 460;
	$: ranked = [...rows].sort((a, b) => b.share - a.share);
	$: rankOf = (row: ShareRow) => ranked.indexOf(row) + 1;
	$: byCode = new Map(rows.filter((r) => r.code).map((r) => [String(r.code), r]));
	$: missingCodes = missing.map((m) => String(m.code ?? '')).filter(Boolean);
	$: emphasised = rows.find((r) => r.id === selected);
	$: municipalityCode =
		region?.layer === 'municipality' ? String(region.codeShort || region.code || '') : '';

	/** "Nürnberg" from "Nürnberg", "Bayreuth" from "Bayreuth (Kreisfreie Stadt)" */
	const shortName = (name: string) => name.replace(/\s*\(.*\)$/, '');

	// Note on the district with the highest share
	$: top = ranked[0];
	$: note = top ? describeTop(top) : null;
	$: annotationText = note ? `${note.name} ${note.text}` : '';

	function describeTop(row: ShareRow): { name: string; text: string } {
		const name = row.name.includes('(')
			? row.name
			: row.layerLabel === 'Kreisfreie Stadt'
				? `Stadt ${row.name}`
				: row.layerLabel
					? `${row.layerLabel} ${row.name}`
					: row.name;
		if (row.share >= 150)
			return {
				name,
				text: `erzeugt ${formatNumber(row.share / 100, 1)}-mal so viel erneuerbaren Strom, wie es verbraucht`
			};
		if (row.share >= 100)
			return {
				name,
				text: `erzeugt mehr erneuerbaren Strom, als es verbraucht (${pct(row.share)})`
			};
		return { name, text: `höchster Anteil: ${pct(row.share)}` };
	}

	// Note in the top strip the map keeps free (NOTE_SPACE), on the district's side; arrow from
	// the note down to the district's centre
	let noteW = 0;
	let noteH = 0;
	let target: { x: number; y: number } | null = null;
	const PAD = 8;
	const NOTE_SPACE = 84; // note (~3 lines) + margin
	$: corner = { top: true, left: !target || target.x < width / 2 };

	function placeNote() {
		const c = top?.center?.map(Number);
		target =
			map && top && c?.every(Number.isFinite) ? map.project(c as [number, number]) : null;
	}

	$: arrow = target && noteW ? arrowPath(target, corner, noteW, noteH) : '';
	function arrowPath(
		t: { x: number; y: number },
		k: { top: boolean; left: boolean },
		w: number,
		h: number
	): string {
		// Start under/over the note, a little in from its inner edge
		// Note's horizontal extent (top-right note sits left of the zoom buttons: right-12 = 48 px)
		const right = k.top ? 48 : PAD;
		const x0 = k.left ? PAD : width - right - w;
		// Start on the note's lower edge, as close above the district as the note allows, so the
		// arrow is short and nearly vertical
		const sx = Math.min(Math.max(t.x, x0 + 14), x0 + w - 14);
		const sy = k.top ? PAD + h + 4 : height - PAD - h - 4;
		// Gentle bend: control point straight below the start, part of the way down
		const cx = sx;
		const cy = sy + (t.y - sy) * 0.5;
		const len = Math.hypot(t.x - cx, t.y - cy) || 1;
		const ex = t.x - ((t.x - cx) / len) * 4;
		const ey = t.y - ((t.y - cy) / len) * 4;
		const angle = Math.atan2(ey - cy, ex - cx);
		const head = (a: number) =>
			`${ex - 7 * Math.cos(angle + a)},${ey - 7 * Math.sin(angle + a)}`;
		return `M${sx},${sy} Q${cx},${cy} ${ex},${ey} M${head(0.45)} L${ex},${ey} L${head(-0.45)}`;
	}

	$: legendItems = [
		...(isDark ? DARK_COLORS : COLORS).map((color, i) => ({
			key: String(i),
			color,
			label: `${CLASS_LABELS[i]} (${rows.filter((r) => classOf(r.share) === i).length})`
		})),
		...(missing.length
			? [
					{
						key: 'missing',
						color: NO_DATA,
						label: `keine Daten (${missing.map((m) => shortName(m.name)).join(', ')})`
					}
				]
			: [])
	];

	const pageIsDark = () =>
		document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');

	/** Frame: the districts' centres plus a margin for their extent */
	function bounds(): [[number, number], [number, number]] | null {
		const pts = [...rows, ...missing]
			.map((r) => r.center?.map(Number))
			.filter((c): c is number[] => !!c && c.every(Number.isFinite));
		if (!pts.length) return null;
		const lons = pts.map((p) => p[0]);
		const lats = pts.map((p) => p[1]);
		return [
			[Math.min(...lons) - 0.3, Math.min(...lats) - 0.2],
			[Math.max(...lons) + 0.3, Math.max(...lats) + 0.2]
		];
	}

	/** Diagonal hatching for members without data */
	function hatch(color: string): ImageData {
		const size = 8;
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = size;
		const ctx = canvas.getContext('2d')!;
		ctx.strokeStyle = color;
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		for (const o of [-size, 0, size]) {
			ctx.moveTo(o, size);
			ctx.lineTo(o + size, 0);
		}
		ctx.stroke();
		return ctx.getImageData(0, 0, size, size);
	}

	function initMap() {
		if (map || !mapContainer) return;
		isDark = pageIsDark();
		const frame = bounds();
		map = new maplibregl.Map({
			container: mapContainer,
			style: { version: 8, sources: {}, layers: [] },
			...(frame
				? {
						bounds: frame,
						fitBoundsOptions: { padding: { top: NOTE_SPACE, right: 16, bottom: 16, left: 16 } }
					}
				: { center: [11.4, 48.9] as [number, number], zoom: 6 }),
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

		map.on('load', () => {
			if (!map) return;
			const tiles = (layer: string) => ({
				type: 'vector' as const,
				tiles: [`https://tiles.klimadashboard.org/data/${layer}-de/{z}/{x}/{y}.pbf`],
				minzoom: 4,
				maxzoom: 12,
				promoteId: { [layer]: 'AGS' }
			});
			map.addSource('districts', tiles('districts'));
			const none = ['==', ['get', 'AGS'], ''];
			const add = (id: string, type: any, paint: any, extra: any = {}) =>
				map!.addLayer({
					id,
					type,
					source: 'districts',
					'source-layer': 'districts',
					paint,
					...extra
				});
			// Neutral context without borders; the compared area stands out by its colours, its
			// districts separated by clean gaps in the background colour
			add('context', 'fill', {});
			add('fill', 'fill', {}, { filter: none });
			add('missing', 'fill', {}, { filter: none });
			add('border', 'line', { 'line-width': 0.8 }, { filter: none, layout: { 'line-join': 'round' } });
			add('hover', 'line', {
				'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 0]
			});
			add('emphasis-casing', 'line', { 'line-width': 5 }, { filter: none });
			add('emphasis', 'line', { 'line-width': 2.5 }, { filter: none });
			if (municipalityCode) {
				map.addSource('municipalities', tiles('municipalities'));
				map.addLayer({
					id: 'municipality',
					type: 'line',
					source: 'municipalities',
					'source-layer': 'municipalities',
					filter: ['==', ['get', 'AGS'], municipalityCode],
					paint: { 'line-width': 1.5, 'line-dasharray': [2, 1.5] }
				});
			}

			map.on('mousemove', 'fill', (e: any) => {
				const f = e.features?.[0];
				const row = f && byCode.get(String(f.id));
				setHover(row ? String(f.id) : null);
				if (map) map.getCanvas().style.cursor = row ? 'pointer' : '';
				tooltip = row ? { x: e.point.x, y: e.point.y, row } : null;
			});
			map.on('mouseleave', 'fill', () => {
				if (map) map.getCanvas().style.cursor = '';
				setHover(null);
				tooltip = null;
			});
			// Select only, no toggling: a double-click zoom must not drop the emphasis
			map.on('click', 'fill', (e: any) => {
				const row = byCode.get(String(e.features?.[0]?.id));
				if (row) selected = row.id;
			});
			map.on('move', placeNote);
			map.on('zoomend', placeCities);

			mapLoaded = true;
			paint();
		});

		darkObserver = new MutationObserver(() => (isDark = pageIsDark()));
		for (const el of [document.documentElement, document.body])
			darkObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
	}

	function setHover(ags: string | null) {
		if (!map || !mapLoaded) return;
		const target = (id: string) => ({ source: 'districts', sourceLayer: 'districts', id });
		if (hoverCode && hoverCode !== ags) map.setFeatureState(target(hoverCode), { hover: false });
		if (ags) map.setFeatureState(target(ags), { hover: true });
		hoverCode = ags;
	}

	/** Labels of the largest cities, largest first, skipping ones too close to a placed label */
	function placeCities() {
		for (const m of cityMarkers) m.remove();
		cityMarkers = [];
		if (!map || !mapLoaded) return;
		const placed: { x: number; y: number }[] = [];
		const cities = rows
			.filter((r) => r.layerLabel === 'Kreisfreie Stadt' && r !== top && r !== emphasised)
			.sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
		for (const city of cities) {
			if (placed.length >= CITY_LABELS) break;
			const c = city.center?.map(Number);
			if (!c?.every(Number.isFinite)) continue;
			const p = map.project(c as [number, number]);
			if (placed.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < CITY_SPACING)) continue;
			placed.push(p);
			const el = document.createElement('div');
			el.className =
				// Small pill: readable on every class colour, light or dark
				'pointer-events-none rounded px-1 py-0.5 text-[11px] leading-none whitespace-nowrap shadow-sm bg-white/90 text-gray-900 dark:bg-gray-900/85 dark:text-gray-100';
			el.innerHTML = '<span></span> <span class="font-semibold tabular-nums"></span>';
			el.children[0].textContent = shortName(city.name);
			el.children[1].textContent = pct(city.share);
			el.setAttribute('aria-hidden', 'true');
			// Just above the city, so its own (small) area stays visible
			cityMarkers.push(
				new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, -7] })
					.setLngLat(c as [number, number])
					.addTo(map)
			);
		}
	}

	// Arguments only make the reactive call below re-run when they change
	function paint(..._deps: unknown[]) {
		if (!map || !mapLoaded) return;
		const line = isDark ? '#18181B' : '#FFFFFF';
		const strong = isDark ? '#FFFFFF' : '#18181B';
		const palette = isDark ? DARK_COLORS : COLORS;
		const codes = [...byCode.keys()];
		const inArea = ['in', ['get', 'AGS'], ['literal', [...codes, ...missingCodes]]];

		// Context: calm neutral outside the compared area, no borders
		map.setPaintProperty('context', 'fill-color', isDark ? '#232327' : '#EDEDEF');
		map.setFilter('border', inArea as any);

		const fill: any[] = ['match', ['get', 'AGS']];
		for (const [code, row] of byCode) fill.push(code, palette[classOf(row.share)]);
		fill.push('transparent');
		map.setFilter('fill', ['in', ['get', 'AGS'], ['literal', codes]] as any);
		if (byCode.size) map.setPaintProperty('fill', 'fill-color', fill);

		// Members without data: hatched
		const image = isDark ? 'hatch-dark' : 'hatch-light';
		if (!map.hasImage(image)) map.addImage(image, hatch(isDark ? '#71717A' : NO_DATA));
		map.setFilter('missing', ['in', ['get', 'AGS'], ['literal', missingCodes]] as any);
		map.setPaintProperty('missing', 'fill-pattern', image);

		map.setPaintProperty('border', 'line-color', line);
		map.setPaintProperty('hover', 'line-color', strong);
		const own = ['==', ['get', 'AGS'], String(emphasised?.code ?? '')];
		map.setFilter('emphasis-casing', own as any);
		map.setFilter('emphasis', own as any);
		map.setPaintProperty('emphasis-casing', 'line-color', line);
		map.setPaintProperty('emphasis', 'line-color', strong);
		if (map.getLayer('municipality')) map.setPaintProperty('municipality', 'line-color', strong);

		// Label of the emphasised district
		marker?.remove();
		marker = null;
		const c = emphasised?.center?.map(Number);
		if (emphasised && emphasised !== top && c?.every(Number.isFinite)) {
			const el = document.createElement('div');
			el.className =
				'pointer-events-none rounded bg-white/90 px-1.5 py-0.5 text-xs text-gray-900 shadow dark:bg-gray-900/90 dark:text-white whitespace-nowrap';
			el.innerHTML = `<span class="font-semibold"></span> <span class="tabular-nums"></span>`;
			el.children[0].textContent = emphasised.name;
			el.children[1].textContent = `${formatPercent(emphasised.share, 1)} · Platz ${rankOf(emphasised)}`;
			el.setAttribute('aria-hidden', 'true');
			// Above the centre, so the outlined district itself stays visible
			marker = new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, -12] })
				.setLngLat(c as [number, number])
				.addTo(map);
		}
		placeCities();
		placeNote();
	}

	$: paint(byCode, missingCodes, emphasised, isDark, mapLoaded);
	$: if (width && mapContainer && !map) initMap();
	$: if (map && height) {
		map.resize();
		placeNote();
	}

	onDestroy(() => {
		darkObserver?.disconnect();
		marker?.remove();
		for (const m of cityMarkers) m.remove();
		map?.remove();
		map = null;
	});

	// Tooltip: 15rem wide, kept inside the map; below the cursor near the top edge
	$: tooltipLeft = tooltip ? Math.min(Math.max(tooltip.x, 124), width - 124) : 0;
	$: tooltipBelow = tooltip ? tooltip.y < 170 : false;

	const gwh = (mwh: number) => `${formatNumber(mwh / 1000, mwh < 10000 ? 1 : 0)} GWh`;

	/** One sentence on what the share means */
	function meaning(share: number): string {
		if (share >= 200) return `erzeugt ${formatNumber(share / 100, 1)}-mal so viel erneuerbaren Strom, wie es verbraucht`;
		if (share >= 100) return `erzeugt ${pct(share - 100)} mehr erneuerbaren Strom, als es verbraucht`;
		return `deckt ${pct(share)} seines Verbrauchs rechnerisch mit erneuerbarem Strom aus der Region`;
	}

	$: tip = tooltip
		? {
				row: tooltip.row,
				color: (isDark ? DARK_COLORS : COLORS)[classOf(tooltip.row.share)],
				className: CLASS_LABELS[classOf(tooltip.row.share)],
				consumption: tooltip.row.consumption,
				production:
					tooltip.row.consumption != null
						? (tooltip.row.share / 100) * tooltip.row.consumption
						: null
			}
		: null;
</script>

<div class="relative" bind:clientWidth={width}>
	<div class="relative">
		<div
			bind:this={mapContainer}
			class="w-full rounded overflow-hidden"
			style:height="{height}px"
			role="img"
			aria-label="Karte: {label}. {emphasised
				? `${emphasised.name} ${formatPercent(emphasised.share, 1)}, Platz ${rankOf(emphasised)} von ${rows.length}.`
				: ''} {annotationText}. Alle Werte in der Tabelle."
		></div>

		<!-- Note on the highest share: in the corner nearest to the district, arrow to it -->
		{#if note && target}
			<svg
				class="absolute inset-0 pointer-events-none overflow-visible"
				{width}
				{height}
				aria-hidden="true"
			>
				<path
					d={arrow}
					fill="none"
					stroke-width="4"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="stroke-white dark:stroke-gray-900"
				/>
				<path
					d={arrow}
					fill="none"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="stroke-gray-900 dark:stroke-gray-100"
				/>
			</svg>
			<div
				class="absolute pointer-events-none max-w-[13rem] rounded bg-white/90 dark:bg-gray-900/90 px-2 py-1 text-xs leading-snug text-gray-700 dark:text-gray-300 shadow-sm {corner.top
					? 'top-2'
					: 'bottom-2'} {corner.left ? 'left-2' : corner.top ? 'right-12' : 'right-2'}"
				bind:clientWidth={noteW}
				bind:clientHeight={noteH}
				aria-hidden="true"
			>
				<div class="font-semibold text-gray-900 dark:text-gray-100">{note.name}</div>
				{note.text}
			</div>
		{/if}
	</div>

	{#if tooltip && tip}
		<div
			class="absolute z-10 pointer-events-none w-60 -translate-x-1/2 {tooltipBelow
				? ''
				: '-translate-y-full'} rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg px-3 py-2 text-xs text-gray-700 dark:text-gray-300"
			style:left="{tooltipLeft}px"
			style:top="{tooltipBelow ? tooltip.y + 16 : tooltip.y - 12}px"
		>
			<div class="flex items-baseline justify-between gap-2">
				<span class="font-semibold text-gray-900 dark:text-gray-100">{tip.row.name}</span>
				<span class="shrink-0 text-gray-500 dark:text-gray-400 tabular-nums"
					>Platz {rankOf(tip.row)} / {rows.length}</span
				>
			</div>
			<div class="mt-1 flex items-center gap-2">
				<span
					class="inline-block size-3 shrink-0 rounded-sm ring-1 ring-black/10 dark:ring-white/20"
					style:background={tip.color}
					aria-hidden="true"
				></span>
				<span class="text-base font-semibold text-gray-900 dark:text-gray-100 tabular-nums"
					>{formatPercent(tip.row.share, 1)}</span
				>
				<span class="text-gray-500 dark:text-gray-400">({tip.className})</span>
			</div>
			<p class="mt-1 leading-snug">{shortName(tip.row.name)} {meaning(tip.row.share)}.</p>
			{#if tip.consumption != null || tip.row.population}
				<dl
					class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 tabular-nums"
				>
					{#if tip.production != null}
						<dt>Erneuerbare Erzeugung</dt>
						<dd class="text-right text-gray-900 dark:text-gray-100">{gwh(tip.production)}</dd>
					{/if}
					{#if tip.consumption != null}
						<dt>Stromverbrauch</dt>
						<dd class="text-right text-gray-900 dark:text-gray-100">{gwh(tip.consumption)}</dd>
					{/if}
					{#if tip.row.population}
						<dt>Einwohner</dt>
						<dd class="text-right text-gray-900 dark:text-gray-100">
							{formatNumber(tip.row.population, 0)}
						</dd>
					{/if}
				</dl>
			{/if}
		</div>
	{/if}

	<div class="mt-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
		<Legend items={legendItems} />
		<p>
			Anteil erneuerbarer Strom am Stromverbrauch je Kreis; ab {pct(100)} wird mehr erzeugt als verbraucht.
			Kreis anklicken oder auswählen, um ihn hervorzuheben.
		</p>
	</div>
</div>
