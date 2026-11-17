<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import RegionSwitcher from '$lib/components/charts/RegionSwitcher.svelte';
	import { IconBuildingFactory2, IconHome, IconCategory } from '@tabler/icons-svelte-runes';
	import { formatNumber } from '$lib/utils/formatters';
	import {
		fetchData,
		buildChartData,
		USES,
		PART_LABELS,
		FOOTBALL_PITCH_HA,
		type LandUseMosaicData
	} from './config';
	import { layoutMosaic, type MosaicCell, type MosaicWedge, type Point } from './layout';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	const R = 300; // mosaic radius in layout units
	const TARGET_COLOR = '#5C9A6C';
	const TONES = [0.82, 1.0, 1.12, 0.92, 1.2, 1.05, 0.96, 1.16];
	const COLOR = Object.fromEntries(USES.map((u) => [u.key, u.color]));
	const ICON = {
		industry: IconBuildingFactory2,
		residential: IconHome,
		other: IconCategory
	} as const;

	let data: LandUseMosaicData | null = null;
	let loading = true;
	let error: string | null = null;
	let width = 0;
	let tip: { wedge: MosaicWedge; cell: MosaicCell; x: number; y: number } | null = null;
	let figEl: HTMLDivElement;

	// --- Region switcher, as in the other regional charts
	let switchedRegion: Region | null = null;
	let switcherId: string | null = null;
	let switcherFor: string | null = null;
	$: if (region?.id !== switcherFor) {
		switcherFor = region?.id ?? null;
		switchedRegion = null;
		switcherId = region?.id ?? null;
	}
	$: activeRegion = switchedRegion ?? region;

	// --- Layout
	$: wedges = data
		? layoutMosaic(
				USES.map((u) => ({
					key: u.key,
					name: u.name,
					parts: data!.parts.map((p) => ({ id: p.id, name: p.name, value: p[u.key] }))
				})),
				R
			)
		: [];
	$: gross = wedges.reduce((a, w) => a + w.value, 0);
	$: partsLabel = PART_LABELS[data?.parts[0]?.layer ?? ''] ?? 'Teilregionen';
	// Target circle: same scale as the mosaic, so its area compares directly
	$: r2 = data?.target2030 && gross ? R * Math.sqrt(Math.min(1, data.target2030 / gross)) : 0;

	// Wide: target circle to the right, group names around the circle. Narrow: target below.
	$: wide = width >= 900; // below that the side labels would not fit at a readable size
	$: LABEL = wide ? 320 : 24; // room around the circle for the labels on their leader lines
	$: GAP = wide ? 250 : 150; // between the two rings
	$: W = wide ? LABEL + 2 * R + GAP + 2 * r2 + 40 : 2 * (LABEL + R);
	// SVG units per screen pixel, so text keeps a readable size at any card width
	$: k = width ? W / width : 1;
	$: px = (n: number) => n * k;
	// Headline above each circle: actual increase on the left, the target on the right
	$: HEAD = px(wide ? 96 : 76);
	$: c1 = [LABEL + R, R + 18 + HEAD + 12] as Point;
	$: c2 = (wide ? [c1[0] + R + GAP + r2, c1[1]] : [c1[0], c1[1] + R + GAP + r2]) as Point;
	$: H = wide ? c1[1] + R + 90 : c2[1] + (r2 || 0) + 18 + px(76);

	/**
	 * Polygon with rounded corners: each corner is cut at `radius` along both edges (at most a
	 * third of the edge, so the many short edges along the circle stay smooth) and joined by a curve.
	 */
	function roundedPath(p: Point[], radius: number) {
		const n = p.length;
		const cut = (a: Point, b: Point, d: number): Point => {
			const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
			const t = Math.min(d, len / 3) / len;
			return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
		};
		let d = '';
		for (let i = 0; i < n; i++) {
			const prev = p[(i - 1 + n) % n],
				cur = p[i],
				next = p[(i + 1) % n];
			const a = cut(cur, prev, radius),
				b = cut(cur, next, radius);
			d += `${i ? 'L' : 'M'}${a[0]},${a[1]}Q${cur[0]},${cur[1]} ${b[0]},${b[1]}`;
		}
		return d + 'Z';
	}
	// Helpers that read reactive values (c1, wide, px, gross) are `$:` so the template re-runs them
	$: polar = (r: number, a: number): Point => [c1[0] + r * Math.cos(a), c1[1] + r * Math.sin(a)];
	const ha = (v: number) => `${formatNumber(v)} ha`;
	/** A yearly amount per day of that year: one decimal below 10, whole numbers above */
	$: perDay = (v: number) => {
		const d = v / (data?.days || 365);
		return formatNumber(d, d < 10 ? 1 : 0);
	};
	const pct = (v: number, of: number) => `${formatNumber((v / of) * 100, 1)} %`;

	// Band between the rings: S-curves, drawn along the axis c1 → c2 and rotated into place
	$: band = (() => {
		if (!r2) return null;
		const dist = Math.hypot(c2[0] - c1[0], c2[1] - c1[1]);
		const angle = (Math.atan2(c2[1] - c1[1], c2[0] - c1[0]) * 180) / Math.PI;
		const R1 = R + 30,
			R2 = r2 + 30,
			a = Math.PI / 3;
		const sx = c1[0] + R1 * Math.cos(a),
			sy = R1 * Math.sin(a),
			ex = c1[0] + dist,
			ey = R2,
			mx = (sx + ex) / 2,
			cy = c1[1];
		const d =
			`M${sx},${cy - sy} C${mx},${cy - sy} ${mx},${cy - ey} ${ex},${cy - ey}` +
			` A${R2},${R2} 0 0 0 ${ex},${cy + ey}` +
			` C${mx},${cy + ey} ${mx},${cy + sy} ${sx},${cy + sy}` +
			` A${R1},${R1} 0 0 0 ${sx},${cy - sy}Z`;
		// Midway between the two rings, for the "x-mal" text
		const m = (R + 18 + dist - r2 - 18) / 2;
		const mid: Point = wide ? [c1[0] + m, cy] : [c1[0], c1[1] + m];
		return { d, angle, mid, gradTo: dist - r2 };
	})();

	// Group label direction: the wedge's middle, unless that falls into the band (wide layout, the
	// band leaves the circle at ±60°): then just below or above it, whichever the wedge reaches
	$: labelAngle = (w: MosaicWedge) => {
		const a = (w.a0 + w.a1) / 2,
			edge = Math.PI / 3 + 0.3;
		if (!wide || !r2 || Math.abs(a) >= Math.PI / 3 + 0.15) return a;
		if (w.a1 > edge) return Math.min(w.a1 - 0.15, edge);
		if (w.a0 < -edge) return Math.max(w.a0 + 0.15, -edge);
		return a;
	};

	function inside([x, y]: Point, poly: Point[]) {
		let hit = false;
		for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
			const [xi, yi] = poly[i],
				[xj, yj] = poly[j];
			if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
		}
		return hit;
	}

	/** Label lines and size for a cell, or null when the text block would not fit inside it */
	$: cellLabel = (c: MosaicCell) => {
		const lines = cellLines(c.name);
		const value = `${ha(c.value)} (${pct(c.value, gross)})`;
		for (const size of [14, 11]) {
			const fs = px(size);
			const w =
				Math.max(...lines.map((l) => l.length * fs * 0.56), value.length * fs * 0.85 * 0.52) +
				px(6);
			const h = (lines.length + 1) * fs * 1.1 + px(4);
			const [cx, cy] = c.centroid;
			const corners: Point[] = [
				[cx - w / 2, cy - h / 2],
				[cx + w / 2, cy - h / 2],
				[cx - w / 2, cy + h / 2],
				[cx + w / 2, cy + h / 2]
			];
			if (corners.every((p) => inside(p, c.polygon))) return { lines, fs, value };
		}
		return null;
	};

	function cellLines(name: string) {
		const words = name.split(/(?<=[\s-])/);
		const lines: string[] = [];
		let cur = '';
		for (const w of words) {
			if ((cur + w).length > 15 && cur) {
				lines.push(cur.trim());
				cur = w;
			} else cur += w;
		}
		lines.push(cur.trim());
		return lines;
	}

	function showTip(wedge: MosaicWedge, cell: MosaicCell, clientX: number, clientY: number) {
		const r = figEl.getBoundingClientRect();
		tip = { wedge, cell, x: clientX - r.left, y: clientY - r.top };
	}
	function focusTip(e: FocusEvent, wedge: MosaicWedge, cell: MosaicCell) {
		const el = e.currentTarget as SVGGraphicsElement;
		const m = el.getScreenCTM();
		if (!m) return;
		const pt = new DOMPoint(cell.centroid[0], cell.centroid[1]).matrixTransform(m);
		showTip(wedge, cell, pt.x, pt.y);
	}

	async function loadData(r: Region | null) {
		loading = true;
		error = null;
		tip = null;
		try {
			data = await fetchData(r);
			onChartData?.(data ? buildChartData(data, r) : null);
		} catch (e) {
			console.error('[LandUseMosaic] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			data = null;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	$: loadData(activeRegion);
</script>

<svelte:window
	on:pointerdown={(e) => {
		if (!(e.target as Element)?.closest?.('[data-cell]')) tip = null;
	}}
/>

<div bind:clientWidth={width}>
	<!-- Outside the loading state so focus stays on the dropdown while the data reloads -->
	{#if region}
		<div class="mb-4">
			<RegionSwitcher
				{region}
				bind:selectedId={switcherId}
				on:change={(e) => (switchedRegion = e.detail.id === region?.id ? null : e.detail)}
			/>
		</div>
	{/if}

	{#if loading}
		<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
	{:else if !data || !wedges.length}
		<div class="h-[300px] flex items-center justify-center text-gray-500">
			Keine Daten verfügbar
		</div>
	{:else}
		<div class="relative" bind:this={figEl}>
			<svg
				viewBox="0 0 {W} {H}"
				class="block w-full h-auto"
				role="img"
				aria-label="Zuwachs der Siedlungs- und Verkehrsfläche {data.year} in {data.regionName} nach Nutzung, aufgeteilt auf {partsLabel}"
			>
				{#if band}
					<defs>
						<linearGradient
							id="land-use-band"
							gradientUnits="userSpaceOnUse"
							x1={c1[0] + R}
							y1="0"
							x2={c1[0] + band.gradTo}
							y2="0"
						>
							<stop offset="0" stop-color={TARGET_COLOR} stop-opacity="0.04" />
							<stop offset="1" stop-color={TARGET_COLOR} stop-opacity="0.32" />
						</linearGradient>
					</defs>
					<path
						d={band.d}
						fill="url(#land-use-band)"
						transform="rotate({band.angle} {c1[0]} {c1[1]})"
					/>
				{/if}

				<!-- Mosaic -->
				<g transform="translate({c1[0] - R},{c1[1] - R})">
					{#each wedges as w (w.key)}
						{#each w.cells as c (c.id)}
							<!-- Focusable on purpose: keyboard users reach each cell's tooltip with Tab -->
							<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
							<path
								d={roundedPath(c.polygon, px(10))}
								fill={COLOR[w.key]}
								style="filter: brightness({c.rank === 1 ? 0.82 : TONES[c.rank % TONES.length]})"
								class="stroke-white dark:stroke-gray-900 outline-none hover:opacity-80 focus:opacity-80 cursor-default"
								stroke-width={px(3)}
								stroke-linejoin="round"
								tabindex="0"
								role="graphics-symbol"
								aria-label="{w.name}: {c.name}, plus {formatNumber(c.value)} Hektar"
								data-cell
								on:pointerenter={(e) => showTip(w, c, e.clientX, e.clientY)}
								on:pointermove={(e) => showTip(w, c, e.clientX, e.clientY)}
								on:pointerleave={(e) => {
									if (e.pointerType === 'mouse') tip = null;
								}}
								on:focus={(e) => focusTip(e, w, c)}
								on:blur={() => (tip = null)}
							/>
						{/each}
					{/each}

					<!-- Cell labels only where the whole text block fits inside the cell -->
					{#each wedges as w (w.key)}
						{#each w.cells as c (c.id)}
							{@const label = Math.sqrt(c.area) / k >= 60 ? cellLabel(c) : null}
							{#if label}
								{@const fs = label.fs}
								{@const top = c.centroid[1] - ((label.lines.length + 1) * fs * 1.1) / 2 + fs * 0.8}
								<g class="pointer-events-none fill-white" text-anchor="middle">
									{#each label.lines as line, i}
										<text x={c.centroid[0]} y={top + i * fs * 1.1} font-size={fs} font-weight="600"
											>{line}</text
										>
									{/each}
									<text
										x={c.centroid[0]}
										y={top + label.lines.length * fs * 1.1}
										font-size={fs * 0.85}
										opacity="0.9">{label.value}</text
									>
								</g>
							{/if}
						{/each}
					{/each}
				</g>

				<!-- Wedge borders -->
				{#each wedges as w (w.key)}
					{@const p = polar(R, w.a0)}
					<line
						x1={c1[0]}
						y1={c1[1]}
						x2={p[0]}
						y2={p[1]}
						class="stroke-white dark:stroke-gray-900"
						stroke-width={px(3)}
					/>
				{/each}

				<!-- Arcs outside the circle, and in the wide layout the group names next to them -->
				{#each wedges as w (w.key)}
					{@const pad = 0.025}
					{@const ra = R + 18}
					{@const s = polar(ra, w.a0 + pad)}
					{@const e = polar(ra, w.a1 - pad)}
					<path
						d="M{s[0]},{s[1]} A{ra},{ra} 0 {w.a1 - w.a0 - 2 * pad > Math.PI
							? 1
							: 0} 1 {e[0]},{e[1]}"
						fill="none"
						stroke={COLOR[w.key]}
						stroke-width={px(4)}
						stroke-linecap="round"
					/>
					{#if wide}
						<!-- Leader line from the arc: a short diagonal, then a horizontal rule with the
						     name and share sitting on it, as in "Preventable causes of death | 44 %" -->
						{@const a = labelAngle(w)}
						{@const dir = Math.cos(a) >= 0 ? 1 : -1}
						{@const start = polar(R + 22, a)}
						{@const elbow = polar(R + 52, a)}
						{@const share = pct(w.value, gross)}
						{@const textW = px(w.name.length * 9.6 + share.length * 7)}
						{@const iconSize = px(20)}
						{@const len = textW + iconSize + px(34)}
						{@const end = [
							dir > 0 ? Math.min(W - px(8), elbow[0] + len) : Math.max(px(8), elbow[0] - len),
							elbow[1]
						]}
						<path
							d="M{start[0]},{start[1]} L{elbow[0]},{elbow[1]} L{end[0]},{end[1]}"
							fill="none"
							stroke={COLOR[w.key]}
							stroke-width={px(3)}
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						{@const Icon = ICON[w.key as keyof typeof ICON]}
						<Icon
							x={dir > 0 ? end[0] - textW - iconSize - px(8) : end[0]}
							y={elbow[1] - px(8) - iconSize + px(3)}
							size={iconSize}
							stroke={1.8}
							color={COLOR[w.key]}
						/>
						<text
							x={dir > 0 ? end[0] : end[0] + iconSize + px(8)}
							y={elbow[1] - px(8)}
							text-anchor={dir > 0 ? 'end' : 'start'}
							font-size={px(18)}
						>
							<tspan font-weight="600" class="fill-gray-900 dark:fill-gray-100">{w.name}</tspan>
							<tspan font-size={px(14)} class="fill-gray-500 dark:fill-gray-400"> | {share}</tspan>
						</text>
					{/if}
				{/each}

				<!-- Headline over the mosaic: what was actually added in the latest year -->
				<text
					x={c1[0]}
					y={c1[1] - R - 18 - HEAD + px(22)}
					text-anchor="middle"
					font-size={px(22)}
					font-weight="600"
					class="fill-gray-900 dark:fill-gray-100"
				>
					{data.year}: {perDay(data.net)} Hektar pro Tag
				</text>
				<text
					x={c1[0]}
					y={c1[1] - R - 18 - HEAD + px(42)}
					text-anchor="middle"
					font-size={px(14)}
					class="fill-gray-600 dark:fill-gray-400"
				>
					≈ {perDay(data.net / FOOTBALL_PITCH_HA)} Fußballfelder pro Tag
				</text>
				<text
					x={c1[0]}
					y={c1[1] - R - 18 - HEAD + px(62)}
					text-anchor="middle"
					font-size={px(14)}
					class="fill-gray-600 dark:fill-gray-400"
				>
					Gesamt: {formatNumber(data.net)} Hektar
				</text>

				<!-- Target circle, same scale, same design: disc, ring, label -->
				{#if r2 && data.target2030}
					<circle cx={c2[0]} cy={c2[1]} r={r2} fill={TARGET_COLOR} />
					<circle
						cx={c2[0]}
						cy={c2[1]}
						r={r2 + 18}
						fill="none"
						stroke={TARGET_COLOR}
						stroke-width={px(4)}
					/>
					<text
						x={c2[0]}
						y={c2[1] + px(7)}
						text-anchor="middle"
						font-size={px(20)}
						font-weight="600"
						class="fill-white">2030-Ziel</text
					>
					<!-- Wide: above the target circle, as far from its ring as the left title from the mosaic's. Narrow: below it. -->
					{@const ty = wide ? c2[1] - r2 - 18 - HEAD + px(22) : c2[1] + r2 + 18 + px(26)}
					<text
						x={c2[0]}
						y={ty}
						text-anchor="middle"
						font-size={px(22)}
						font-weight="600"
						class="fill-gray-900 dark:fill-gray-100"
					>
						Ziel: {perDay(data.target2030)} Hektar pro Tag
					</text>
					<text
						x={c2[0]}
						y={ty + px(20)}
						text-anchor="middle"
						font-size={px(14)}
						class="fill-gray-600 dark:fill-gray-400"
					>
						≈ {perDay(data.target2030 / FOOTBALL_PITCH_HA)} Fußballfelder pro Tag
					</text>
					<text
						x={c2[0]}
						y={ty + px(40)}
						text-anchor="middle"
						font-size={px(14)}
						class="fill-gray-600 dark:fill-gray-400"
					>
						Gesamt: {formatNumber(data.target2030)} Hektar
					</text>
					{#if band}
						<text
							x={band.mid[0]}
							y={band.mid[1] - px(2)}
							text-anchor="middle"
							font-size={px(24)}
							font-weight="600"
							class="fill-gray-900 dark:fill-gray-100"
						>
							{formatNumber(data.net / data.target2030, 1)}-mal
						</text>
						<text
							x={band.mid[0]}
							y={band.mid[1] + px(16)}
							text-anchor="middle"
							font-size={px(12)}
							class="fill-gray-600 dark:fill-gray-400">so viel wie das Ziel</text
						>
					{/if}
				{/if}
			</svg>

			{#if tip}
				{@const right = tip.x > (figEl?.clientWidth ?? 0) - 290}
				{@const TipIcon = ICON[tip.wedge.key as keyof typeof ICON]}
				<div
					class="absolute z-10 pointer-events-none w-[17rem] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-3 text-sm text-gray-900 dark:text-gray-100"
					style="left: {right ? tip.x - 288 : tip.x + 16}px; top: {tip.y + 16}px"
					role="tooltip"
				>
					<div class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
						<TipIcon size={16} stroke={1.8} color={COLOR[tip.wedge.key]} />
						{tip.wedge.name}
					</div>
					<div class="mt-0.5 font-semibold text-base">{tip.cell.name}</div>
					<div class="mt-1 text-2xl font-semibold leading-none">+{ha(tip.cell.value)}</div>
					<div class="text-gray-600 dark:text-gray-400">
						≈ {formatNumber(tip.cell.value / FOOTBALL_PITCH_HA)} Fußballfelder
					</div>
					<div
						class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 grid gap-0.5 tabular-nums"
					>
						<span class="flex justify-between gap-3"
							>Anteil an {tip.wedge.name}<b class="font-semibold whitespace-nowrap"
								>{pct(tip.cell.value, tip.wedge.value)}</b
							></span
						>
						<span class="flex justify-between gap-3"
							>Anteil an gesamter Flächeninanspruchnahme<b class="font-semibold whitespace-nowrap"
								>{pct(tip.cell.value, gross)}</b
							></span
						>
					</div>
				</div>
			{/if}
		</div>

		<!-- Legend below the figure, in both layouts -->
		<div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
			{#each wedges as w (w.key)}
				{@const LegendIcon = ICON[w.key as keyof typeof ICON]}
				<span class="inline-flex items-center gap-1.5">
					<LegendIcon size={18} stroke={1.8} color={COLOR[w.key]} />
					{w.name}: {ha(w.value)} ({pct(w.value, gross)})
				</span>
			{/each}
		</div>

		<p class="mt-3 text-xs text-gray-600 dark:text-gray-400">
			Zuwachs {data.year} gegenüber {data.previousYear} je {partsLabel === 'Bundesländer'
				? 'Bundesland'
				: partsLabel === 'Kreise'
					? 'Kreis'
					: 'Gemeinde'}; Rückgänge einzelner {partsLabel} in einer Nutzung sind nicht dargestellt, netto
			ergibt sich ein Zuwachs von {ha(data.net)}. Ohne Bergbau und Tagebau; Verkehrsflächen zählen
			zu den übrigen Nutzungen.
			{#each data.notes as note}{' '}{note}{/each}
		</p>
	{/if}
</div>
