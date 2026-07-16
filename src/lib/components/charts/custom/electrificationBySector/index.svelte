<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Chart from '$lib/components/charts/primitives/Chart.svelte';
	import AxisY from '$lib/components/charts/primitives/axes/AxisY.svelte';
	import AxisX from '$lib/components/charts/primitives/axes/AxisX.svelte';
	import Line from '$lib/components/charts/primitives/marks/Line.svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import { RadioGroup } from '$lib/components/ui';
	import CountryPicker from '$lib/components/electrification/CountryPicker.svelte';
	import {
		fetchElectrificationDataset,
		seriesFor,
		valueAt,
		countryColor,
		SECTORS,
		DISPLAY_START,
		EU_REGION_CODE,
		fmtPct,
		type ElectrificationDataset
	} from '$lib/utils/electrification';
	import { buildChartData } from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	let dataset: ElectrificationDataset | null = null;
	let loading = true;
	let error: string | null = null;
	let selected: string[] = [];
	let initialized = false;

	async function loadData() {
		loading = true;
		error = null;
		try {
			const result = await fetchElectrificationDataset(fetch);
			dataset = result;
			if (!initialized) {
				const euId = result.regions.find((r) => r.code === EU_REGION_CODE)?.id;
				const regionMatch = region ? result.regions.find((r) => r.id === region.id) : null;
				selected = regionMatch ? [regionMatch.id] : euId ? [euId] : [];
				initialized = true;
			}
		} catch (e) {
			console.error('[electrificationBySector] Error:', e);
			error = e instanceof Error ? e.message : 'Failed to load data';
			dataset = null;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	loadData();

	// Re-emit chart data (including the computed headline) whenever the selection changes.
	$: if (dataset && selected.length) {
		onChartData?.(buildChartData(dataset, selected));
	}

	$: euId = dataset?.regions.find((r) => r.code === EU_REGION_CODE)?.id;
	$: single = selected.length === 1;
	$: soloId = selected[0];
	$: soloName = dataset && soloId ? (dataset.regions.find((r) => r.id === soloId)?.name ?? '') : '';

	// Responsive margins: sector end-labels live in the right margin, so narrow
	// screens get a smaller reserved strip + smaller label text instead of
	// shrinking the whole chart via viewBox scale.
	let containerWidth = 0;
	$: isMobile = containerWidth > 0 && containerWidth < 500;
	$: singleMargin = {
		top: 16,
		right: isMobile ? 56 : 148,
		bottom: 30,
		left: isMobile ? 34 : 44
	};

	// ---- single-country mode: one chart, all sectors, legend toggles ----
	let hidden: Record<string, boolean> = {};
	function toggleSector(key: string) {
		hidden = { ...hidden, [key]: !hidden[key] };
	}
	$: visibleSectors = SECTORS.filter((s) => !hidden[s.key]);

	$: singleMax = (() => {
		if (!dataset || !single) return 55;
		const d = dataset as ElectrificationDataset;
		let mx = 50;
		for (const s of visibleSectors) {
			for (const [, v] of seriesFor(d, soloId, s.key)) mx = Math.max(mx, v);
		}
		return Math.max(55, Math.ceil((mx + 2) / 10) * 10);
	})();

	$: singleFlatData =
		dataset && single
			? [
					{ year: DISPLAY_START },
					{ year: (dataset as ElectrificationDataset).latestYear },
					...visibleSectors.flatMap((s) =>
						seriesFor(dataset as ElectrificationDataset, soloId, s.key).map(([year, value]) => ({
							year,
							value
						}))
					)
				]
			: [];

	function nudge<T extends { value: number }>(
		items: T[],
		yScale: (v: number) => number,
		minGap: number
	) {
		const sorted = [...items].sort((a, b) => b.value - a.value);
		let prev = -Infinity;
		return sorted.map((it) => {
			let py = yScale(it.value);
			if (py - prev < minGap) py = prev + minGap;
			prev = py;
			return { ...it, py };
		});
	}

	// ---- multi-country mode: one facet per sector, comparing countries ----
	let scaleMode: 'per' | 'shared' = 'per';
	const FW = 320;
	const FH = 220;
	const fm = { top: 10, right: 8, bottom: 22, left: 34 };
	$: fiw = FW - fm.left - fm.right;
	$: fih = FH - fm.top - fm.bottom;
	$: fx = scaleLinear()
		.domain([DISPLAY_START, dataset?.latestYear ?? DISPLAY_START])
		.range([0, fiw]);

	function facetMax(key: string, sel: string[], mode: 'per' | 'shared'): number {
		if (!dataset) return 10;
		if (mode === 'shared') return 55;
		const vals: number[] = [];
		for (const id of sel) for (const [, v] of seriesFor(dataset as ElectrificationDataset, id, key)) vals.push(v);
		const mx = vals.length ? Math.max(...vals) : 10;
		return Math.max(10, Math.ceil(mx / 10) * 10);
	}

	function facetHasData(key: string, sel: string[]): boolean {
		if (!dataset) return false;
		return sel.some((id) => seriesFor(dataset as ElectrificationDataset, id, key).length > 0);
	}

	let facetHover: { key: string; year: number } | null = null;
	function facetMove(ev: PointerEvent, key: string) {
		const target = ev.currentTarget as SVGRectElement;
		const rect = target.getBoundingClientRect();
		const frac = (ev.clientX - rect.left) / rect.width;
		const latest = dataset?.latestYear ?? DISPLAY_START;
		const yr = Math.min(latest, Math.max(DISPLAY_START, Math.round(DISPLAY_START + frac * (latest - DISPLAY_START))));
		facetHover = { key, year: yr };
	}

	$: subtitle = single
		? `Electricity share of ${soloName}'s final consumption by sector, ${DISPLAY_START}–${dataset?.latestYear}`
		: `Electricity share by sector, comparing ${selected.length} countries, ${DISPLAY_START}–${dataset?.latestYear}`;
</script>

{#if loading}
	<div class="h-[440px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[440px] flex items-center justify-center text-red-500">{error}</div>
{:else if !dataset}
	<div class="h-[440px] flex items-center justify-center text-gray-500">No data available</div>
{:else}
	<div bind:clientWidth={containerWidth}>
		<p class="text-sm text-gray-500 dark:text-gray-400 mb-3">{subtitle}</p>

		<div class="flex flex-wrap gap-4 items-center mb-3">
			<CountryPicker regions={dataset.regions} bind:selected fallbackId={euId} clearLabel="Clear all" />
			{#if !single}
				<RadioGroup
					label="Y-axis"
					bind:value={scaleMode}
					options={[
						{ value: 'per', label: 'Per-sector' },
						{ value: 'shared', label: 'Shared 0–55%' }
					]}
				/>
			{/if}
		</div>

		{#if single}
			<div class="flex flex-wrap gap-1.5 mb-3">
				{#each SECTORS as s (s.key)}
					<button
						type="button"
						aria-pressed={!hidden[s.key]}
						on:click={() => toggleSector(s.key)}
						class="inline-flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-gray-600
							bg-white dark:bg-gray-800 px-2.5 py-1 text-sm font-medium text-gray-900 dark:text-gray-100
							{hidden[s.key] ? 'opacity-40' : ''}"
					>
						<span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:{s.color}"></span>
						{s.short}
					</button>
				{/each}
			</div>

			<Chart
				data={singleFlatData}
				x="year"
				y="value"
				xType="linear"
				height={400}
				yMin={0}
				yMax={singleMax}
				margin={singleMargin}
			>
				<svelte:fragment slot="default" let:xScale let:yScale let:innerWidth let:innerHeight let:hover>
					<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
					<AxisX
						{xScale}
						xDomain={[DISPLAY_START, dataset.latestYear]}
						{innerWidth}
						{innerHeight}
						format={(v) => String(Math.round(v))}
						tickCount={6}
					/>

					{#if hover.x !== null}
						<line x1={xScale(hover.x)} x2={xScale(hover.x)} y1="0" y2={innerHeight} stroke="currentColor" class="text-gray-400 dark:text-gray-500" stroke-dasharray="3 3" />
					{/if}

					{#each visibleSectors as s (s.key)}
						{@const pts = seriesFor(dataset, soloId, s.key).map(([year, value]) => ({ year, value }))}
						<Line data={pts} x="year" y="value" {xScale} {yScale} stroke={s.color} strokeWidth={2.4} curve="monotone" />
						{@const lastPt = pts[pts.length - 1]}
						{#if lastPt}
							<circle cx={xScale(lastPt.year)} cy={yScale(lastPt.value)} r="5.5" fill={s.color} stroke="white" stroke-width="2.2" />
						{/if}
						{#if hover.x !== null}
							{@const hv = valueAt(dataset, soloId, s.key, hover.x)}
							{#if hv != null}
								<circle cx={xScale(hover.x)} cy={yScale(hv)} r="4" fill={s.color} stroke="white" stroke-width="1.6" />
							{/if}
						{/if}
					{/each}

					{@const sectorLabels = nudge(
						visibleSectors
							.map((s) => ({
								key: s.key,
								label: s.short,
								color: s.color,
								value: seriesFor(dataset, soloId, s.key).at(-1)?.[1] ?? null
							}))
							.filter((it) => it.value != null) as Array<{
							key: string;
							label: string;
							color: string;
							value: number;
						}>,
						yScale,
						isMobile ? 15 : 18
					)}
					{#each sectorLabels as el (el.key)}
						<text
							x={innerWidth + (isMobile ? 4 : 10)}
							y={el.py - 3}
							class={isMobile ? 'text-[10px] font-bold' : 'text-sm font-bold'}
							fill={el.color}
							stroke="white"
							stroke-width="3"
							stroke-linejoin="round"
							paint-order="stroke fill"
						>
							{el.label}
						</text>
						<text
							x={innerWidth + (isMobile ? 4 : 10)}
							y={el.py + (isMobile ? 10 : 12)}
							class={isMobile ? 'text-[9px] fill-gray-500 dark:fill-gray-400' : 'text-xs fill-gray-500 dark:fill-gray-400'}
							stroke="white"
							stroke-width="3"
							stroke-linejoin="round"
							paint-order="stroke fill"
						>
							{fmtPct(el.value)}
						</text>
					{/each}
				</svelte:fragment>

				<svelte:fragment slot="tooltip" let:hover>
					{#if hover.x !== null}
						<Tooltip
							visible={true}
							x={hover.clientX}
							y={hover.clientY}
							title={String(hover.x)}
							items={visibleSectors
								.map((s) => ({ s, v: valueAt(dataset, soloId, s.key, hover.x) }))
								.filter((r) => r.v != null)
								.sort((a, b) => (b.v as number) - (a.v as number))
								.map((r) => ({ label: r.s.short, value: fmtPct(r.v as number, 1), color: r.s.color }))}
						/>
					{/if}
				</svelte:fragment>
			</Chart>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
				{#each SECTORS as s (s.key)}
					{@const ymax = facetMax(s.key, selected, scaleMode)}
					{@const fy = scaleLinear().domain([0, ymax]).range([fih, 0])}
					{@const hasData = facetHasData(s.key, selected)}
					<figure class="m-0">
						<figcaption class="font-bold text-base mb-1" style="color:{s.color}">{s.label}</figcaption>
						<svg viewBox="0 0 {FW} {FH}" width="100%" role="img" aria-label={s.label}>
							<g transform="translate({fm.left},{fm.top})">
								{#each [0, ymax / 2, ymax] as ft}
									<line x1="0" x2={fiw} y1={fy(ft)} y2={fy(ft)} stroke="currentColor" class="text-gray-200 dark:text-gray-700" />
									<text x="-6" y={fy(ft)} dy="0.32em" text-anchor="end" class="text-[10px] fill-gray-500 dark:fill-gray-400">{fmtPct(ft)}</text>
								{/each}
								{#each [DISPLAY_START, dataset.latestYear] as xt}
									<text x={fx(xt)} y={fih + 16} text-anchor="middle" class="text-[10px] fill-gray-500 dark:fill-gray-400">{xt}</text>
								{/each}

								{#if !hasData}
									<text x={fiw / 2} y={fih / 2} text-anchor="middle" class="text-xs fill-gray-400">No data</text>
								{:else}
									{#if facetHover && facetHover.key === s.key}
										<line x1={fx(facetHover.year)} x2={fx(facetHover.year)} y1="0" y2={fih} stroke="currentColor" class="text-gray-400 dark:text-gray-500" stroke-dasharray="3 3" />
									{/if}

									{#each selected as id (id)}
										{@const c = countryColor(id, selected, euId)}
										{@const pts = seriesFor(dataset, id, s.key).map(([year, value]) => ({ year, value }))}
										<Line data={pts} x="year" y="value" xScale={fx} yScale={fy} stroke={c} strokeWidth={2} />
										{@const lastPt = pts[pts.length - 1]}
										{#if lastPt}
											<circle cx={fx(lastPt.year)} cy={fy(lastPt.value)} r="3.4" fill={c} stroke="white" stroke-width="1.4" />
										{/if}
									{/each}

									<rect
										x="0"
										y="0"
										width={fiw}
										height={fih}
										fill="transparent"
										role="presentation"
										on:pointermove={(e) => facetMove(e, s.key)}
										on:pointerleave={() => (facetHover = null)}
									/>
								{/if}
							</g>
						</svg>
					</figure>
				{/each}

				{#if facetHover}
					{@const rows = selected
						.map((id) => ({ id, v: valueAt(dataset, id, facetHover.key, facetHover.year) }))
						.filter((r) => r.v != null)
						.sort((a, b) => (b.v as number) - (a.v as number))}
					{#if rows.length}
						<div class="pointer-events-none absolute z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 text-sm" style="left: 50%; top: 0; transform: translateX(-50%);">
							<div class="font-bold mb-1">{SECTORS.find((s) => s.key === facetHover?.key)?.label} · {facetHover.year}</div>
							{#each rows as r (r.id)}
								<div class="flex items-center gap-2">
									<span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:{countryColor(r.id, selected, euId)}"></span>
									<span class="text-gray-500 dark:text-gray-400">{dataset.regions.find((rg) => rg.id === r.id)?.name}</span>
									<span class="ml-auto font-semibold tabular-nums">{fmtPct(r.v as number, 1)}</span>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
{/if}
