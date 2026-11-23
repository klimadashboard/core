<!-- $lib/components/charts/custom/renewableShareRegions/ShareMap.svelte
	Map view: the compared districts (a Metropolregion's members, or all districts of the state)
	coloured by their renewable share, diverging at 100 %: blues below (darker = further from
	covering the consumption), greens from 100 % on. Same blue/green split as the distribution
	view. Districts outside the comparison stay neutral for orientation.

	The emphasised district (the page's own, or one picked in the dropdown or by clicking it) gets
	a strong outline and a label with value and rank; on a municipality's page the municipality is
	outlined too. An annotation with an arrow points at the district with the highest share
	(black text with a white halo, inverted in dark mode), placed towards the map's centre. Tooltips show value and rank, the legend counts the districts per class.
	Geometry from our own vector tiles (no basemap, no glyphs), framed on the districts' centres. -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import * as maplibregl from '$lib/utils/maplibre';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { formatNumber, formatPercent } from '$lib/utils/formatters';
	import { Legend } from '$lib/components/charts/primitives';
	import type { Region } from '$lib/utils/getRegion';
	import type { ShareRow } from './config';

	/** the compared districts */
	export let rows: ShareRow[];
	/** id of the emphasised district ('' = none) */
	export let selected = '';
	/** the page region (outlined when it is a municipality) */
	export let region: Region | null = null;
	export let label = '';

	// Class breaks in %, and their colours (ColorBrewer blues / greens from the Tailwind theme)
	const BREAKS = [25, 50, 75, 100, 150];
	const COLORS = ['#2171B5', '#6BAED6', '#9ECAE1', '#C6DBEF', '#74C476', '#238B45'];
	const classOf = (share: number) => BREAKS.filter((b) => share >= b).length;
	const pct = (v: number) => formatPercent(v, 0);
	const CLASS_LABELS = [
		`unter ${pct(25)}`,
		`${pct(25)} – ${pct(50)}`,
		`${pct(50)} – ${pct(75)}`,
		`${pct(75)} – ${pct(100)}`,
		`${pct(100)} – ${pct(150)}`,
		`ab ${pct(150)}`
	];

	let width = 0;
	let isDark = false;
	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let mapLoaded = false;
	let marker: maplibregl.Marker | null = null;
	let annotation: maplibregl.Marker | null = null;
	let hoverCode: string | null = null;
	let tooltip: { x: number; y: number; row: ShareRow } | null = null;
	let darkObserver: MutationObserver | null = null;

	$: height = width && width < 500 ? 380 : 460;
	$: ranked = [...rows].sort((a, b) => b.share - a.share);
	$: rankOf = (row: ShareRow) => ranked.indexOf(row) + 1;
	$: byCode = new Map(rows.filter((r) => r.code).map((r) => [String(r.code), r]));
	$: emphasised = rows.find((r) => r.id === selected);
	$: municipalityCode =
		region?.layer === 'municipality' ? String(region.codeShort || region.code || '') : '';

	// Annotation: the district with the highest share
	$: top = ranked[0];
	$: annotationText = top ? describeTop(top) : '';

	function describeTop(row: ShareRow): string {
		const name = row.name.includes('(')
			? row.name
			: row.layerLabel === 'Kreisfreie Stadt'
				? `Stadt ${row.name}`
				: row.layerLabel
					? `${row.layerLabel} ${row.name}`
					: row.name;
		const value = formatPercent(row.share, 0);
		if (row.share >= 150)
			return `${name} erzeugt ${formatNumber(row.share / 100, 1)}-mal so viel erneuerbaren Strom, wie dort verbraucht wird (${value})`;
		if (row.share >= 100)
			return `${name} erzeugt mehr erneuerbaren Strom, als dort verbraucht wird (${value})`;
		return `${name} deckt den größten Teil seines Verbrauchs mit erneuerbarem Strom (${value})`;
	}

	/** Greedy line wrap for the SVG text */
	function wrap(text: string, max: number): string[] {
		const lines: string[] = [];
		for (const word of text.split(' ')) {
			const last = lines.at(-1);
			if (last !== undefined && (last + ' ' + word).length <= max)
				lines[lines.length - 1] += ' ' + word;
			else lines.push(word);
		}
		return lines;
	}

	const SVG_NS = 'http://www.w3.org/2000/svg';
	const svgEl = (tag: string, attrs: Record<string, string | number>) => {
		const el = document.createElementNS(SVG_NS, tag);
		for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
		return el;
	};

	/** Arrow from the text to the district's centre; text on the side towards the map's centre */
	function drawAnnotation() {
		annotation?.remove();
		annotation = null;
		const c = top?.center?.map(Number);
		if (!map || !top || !c?.every(Number.isFinite)) return;
		const p = map.project(c as [number, number]);
		const { clientWidth: w, clientHeight: h } = map.getContainer();
		const left = p.x > w / 2;
		const above = p.y > h / 2;
		const dx = (left ? -1 : 1) * Math.min(80, w / 5);
		const dy = (above ? -1 : 1) * 56;
		const lines = wrap(annotationText, w < 500 ? 26 : 40);
		const LINE = 15;

		const svg = svgEl('svg', { width: 1, height: 1, overflow: 'visible', 'aria-hidden': 'true' });
		svg.setAttribute('class', 'block overflow-visible');
		// Arrow: quadratic curve from the text's corner to just short of the centre, with a head
		const sx = dx;
		const sy = dy + (above ? 6 : -6 - LINE + 4);
		const cx = 0;
		const cy = sy;
		const len = Math.hypot(cx, cy) || 1;
		const ex = (cx / len) * 7;
		const ey = (cy / len) * 7;
		const angle = Math.atan2(ey - cy, ex - cx);
		const head = (a: number) => `${ex - 7 * Math.cos(angle + a)},${ey - 7 * Math.sin(angle + a)}`;
		const d = `M${sx},${sy} Q${cx},${cy} ${ex},${ey} M${head(0.45)} L${ex},${ey} L${head(-0.45)}`;
		for (const casing of [true, false]) {
			const path = svgEl('path', {
				d,
				fill: 'none',
				'stroke-width': casing ? 4 : 1.5,
				'stroke-linecap': 'round',
				'stroke-linejoin': 'round'
			});
			path.setAttribute(
				'class',
				casing ? 'stroke-white dark:stroke-black' : 'stroke-gray-900 dark:stroke-gray-100'
			);
			svg.appendChild(path);
		}
		// Text: lines grow away from the arrow, black with a white halo (inverted in dark mode)
		const text = svgEl('text', {
			'text-anchor': left ? 'end' : 'start',
			'stroke-width': 3.5,
			'stroke-linejoin': 'round'
		});
		text.setAttribute(
			'class',
			'text-xs font-semibold fill-gray-900 stroke-white [paint-order:stroke] dark:fill-gray-100 dark:stroke-black'
		);
		const x = dx + (left ? 4 : -4);
		lines.forEach((line, i) => {
			const y = above ? dy - (lines.length - 1 - i) * LINE : dy + i * LINE;
			const span = svgEl('tspan', { x, y });
			span.textContent = line;
			text.appendChild(span);
		});
		svg.appendChild(text);

		const el = document.createElement('div');
		el.className = 'pointer-events-none';
		el.appendChild(svg);
		annotation = new maplibregl.Marker({ element: el, anchor: 'top-left' })
			.setLngLat(c as [number, number])
			.addTo(map);
	}

	$: legendItems = COLORS.map((color, i) => ({
		key: String(i),
		color,
		label: `${CLASS_LABELS[i]} (${rows.filter((r) => classOf(r.share) === i).length})`
	}));

	const pageIsDark = () =>
		document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');

	/** Frame: the districts' centres plus a margin for their extent */
	function bounds(): [[number, number], [number, number]] | null {
		const pts = rows
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

	function initMap() {
		if (map || !mapContainer) return;
		isDark = pageIsDark();
		const frame = bounds();
		map = new maplibregl.Map({
			container: mapContainer,
			style: { version: 8, sources: {}, layers: [] },
			...(frame
				? { bounds: frame, fitBoundsOptions: { padding: 8 } }
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
			const add = (id: string, type: any, paint: any, extra: any = {}) =>
				map!.addLayer({
					id,
					type,
					source: 'districts',
					'source-layer': 'districts',
					paint,
					...extra
				});
			add('fill', 'fill', {});
			add('border', 'line', { 'line-width': 0.6 });
			add('hover', 'line', {
				'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 0]
			});
			add('emphasis-casing', 'line', { 'line-width': 5 }, { filter: ['==', ['get', 'AGS'], ''] });
			add('emphasis', 'line', { 'line-width': 2.5 }, { filter: ['==', ['get', 'AGS'], ''] });
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

	// Arguments only make the reactive call below re-run when they change
	function paint(..._deps: unknown[]) {
		if (!map || !mapLoaded) return;
		const line = isDark ? '#18181B' : '#FFFFFF';
		const strong = isDark ? '#FFFFFF' : '#18181B';
		const fill: any[] = ['match', ['get', 'AGS']];
		for (const [code, row] of byCode) fill.push(code, COLORS[classOf(row.share)]);
		fill.push(isDark ? '#27272A' : '#F4F4F5');
		map.setPaintProperty('fill', 'fill-color', byCode.size ? fill : fill.at(-1));
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
		drawAnnotation();
	}

	$: paint(byCode, emphasised, isDark, mapLoaded);
	$: if (width && mapContainer && !map) initMap();
	$: if (map && height) map.resize();

	onDestroy(() => {
		darkObserver?.disconnect();
		marker?.remove();
		annotation?.remove();
		map?.remove();
		map = null;
	});

	$: tooltipLeft = tooltip ? Math.min(Math.max(tooltip.x, 90), width - 90) : 0;
</script>

<div class="relative" bind:clientWidth={width}>
	<div
		bind:this={mapContainer}
		class="w-full rounded overflow-hidden"
		style:height="{height}px"
		role="img"
		aria-label="Karte: {label}. {emphasised
			? `${emphasised.name} ${formatPercent(emphasised.share, 1)}, Platz ${rankOf(emphasised)} von ${rows.length}.`
			: ''} {annotationText}. Alle Werte in der Tabelle."
	></div>

	{#if tooltip}
		<div
			class="absolute z-10 pointer-events-none -translate-x-1/2 -translate-y-full rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow px-2 py-1 text-xs whitespace-nowrap"
			style:left="{tooltipLeft}px"
			style:top="{tooltip.y - 10}px"
		>
			<div class="font-semibold text-gray-900 dark:text-gray-100">{tooltip.row.name}</div>
			<div class="text-gray-700 dark:text-gray-300 tabular-nums">
				{formatPercent(tooltip.row.share, 1)} · Platz {rankOf(tooltip.row)} von {rows.length}
			</div>
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
