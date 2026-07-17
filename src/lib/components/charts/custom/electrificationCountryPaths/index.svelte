<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Chart from '$lib/components/charts/primitives/Chart.svelte';
	import AxisX from '$lib/components/charts/primitives/axes/AxisX.svelte';
	import AxisY from '$lib/components/charts/primitives/axes/AxisY.svelte';
	import Line from '$lib/components/charts/primitives/marks/Line.svelte';
	import CountryPicker from '$lib/components/electrification/CountryPicker.svelte';
	import TargetToggles from '$lib/components/electrification/TargetToggles.svelte';
	import TargetSources from '$lib/components/electrification/TargetSources.svelte';
	import {
		fetchElectrificationDataset,
		seriesFor,
		latestValue,
		countryColor,
		TARGETS,
		REFERENCE_TARGETS,
		maxTargetYear,
		maxTargetValue,
		targetAnnotation,
		DISPLAY_START,
		EU_REGION_CODE,
		fmtPct,
		fmtSignedPP,
		type ElectrificationDataset
	} from '$lib/utils/electrification';
	import { buildChartData } from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	const END = TARGETS[TARGETS.length - 1].year; // 2040

	/** Contextual benchmarks, off by default. */
	let refIds: string[] = [];
	$: visibleRefs = REFERENCE_TARGETS.filter((r) => refIds.includes(r.id));
	$: refPoints = visibleRefs.flatMap((r) => r.points.map((p) => ({ ...p, ref: r })));
	// Benchmarks can reach past the EU's 2040 horizon (the Advisory Board's 2050 point), so the
	// x-domain follows the furthest visible target. Note this compresses the 2000-2024 history.
	$: domainEnd = maxTargetYear(visibleRefs);
	// yMax must clear the highest visible target plus room for its label, which is drawn 12px
	// above the dot. Chart applies .nice() on top of this.
	$: yMax = Math.max(58, Math.ceil((maxTargetValue(visibleRefs) + 5) / 5) * 5);
	$: forceTicks = [...new Set([DISPLAY_START, dataset?.latestYear ?? DISPLAY_START, END, domainEnd])];

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
			console.error('[electrificationCountryPaths] Error:', e);
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

	$: paths = dataset
		? selected.map((id) => {
				const d = dataset as ElectrificationDataset;
				const hist = seriesFor(d, id, 'total_economy');
				const current = latestValue(d, id, 'total_economy');
				const hasData = current != null && hist.length > 0;
				return {
					id,
					name: d.regions.find((r) => r.id === id)?.name ?? id,
					hist,
					current,
					hasData,
					color: countryColor(id, selected, euId)
				};
			})
		: [];

	$: anyData = paths.some((p) => p.hasData);

	$: flatData = [
		{ year: DISPLAY_START },
		{ year: domainEnd },
		...paths.flatMap((p) => p.hist.map(([year, value]) => ({ year, value })))
	];

	// Responsive margins: the only element that can overflow the plot area is the
	// last (rightmost) target label, which we right-anchor instead of center-anchor
	// so it doesn't need a large reserved margin.
	let containerWidth = 0;
	$: isMobile = containerWidth > 0 && containerWidth < 500;
	$: chartMargin = {
		top: 15,
		right: isMobile ? 16 : 16,
		bottom: isMobile ? 26 : 35,
		left: isMobile ? 34 : 44
	};

	$: single = paths.length === 1 ? paths[0] : null;
	$: singleStats =
		single && single.hasData && dataset
			? {
					gap2030: TARGETS[0].value - (single.current as number),
					gapEnd: TARGETS[TARGETS.length - 1].value - (single.current as number),
					reqPerYear: Math.max(
						0,
						(TARGETS[TARGETS.length - 1].value - (single.current as number)) /
							(END - dataset.latestYear)
					)
				}
			: null;
</script>

{#if loading}
	<div class="h-[380px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[380px] flex items-center justify-center text-red-500">{error}</div>
{:else if !dataset}
	<div class="h-[380px] flex items-center justify-center text-gray-500">No data available</div>
{:else}
	<div bind:clientWidth={containerWidth}>
		<div class="mb-3 flex flex-wrap gap-4 items-center">
			<CountryPicker regions={dataset.regions} bind:selected fallbackId={euId} />
			<TargetToggles bind:selected={refIds} />
		</div>

		{#if single && singleStats}
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
				<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
					<div class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
						{dataset.latestYear} actual
					</div>
					<div class="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
						{fmtPct(single.current ?? 0, 1)}
					</div>
				</div>
				<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
					<div class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
						Gap to {TARGETS[0].year} ({fmtPct(TARGETS[0].value)})
					</div>
					<div
						class="text-2xl font-bold tabular-nums"
						class:text-economy={singleStats.gap2030 <= 0}
						class:text-gray-900={singleStats.gap2030 > 0}
						class:dark:text-white={singleStats.gap2030 > 0}
					>
						{fmtSignedPP(-singleStats.gap2030)}
					</div>
				</div>
				<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
					<div class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
						Gap to {END} ({fmtPct(TARGETS[TARGETS.length - 1].value)})
					</div>
					<div
						class="text-2xl font-bold tabular-nums"
						class:text-economy={singleStats.gapEnd <= 0}
						class:text-gray-900={singleStats.gapEnd > 0}
						class:dark:text-white={singleStats.gapEnd > 0}
					>
						{fmtSignedPP(-singleStats.gapEnd)}
					</div>
				</div>
				<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
					<div class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
						Needed to {END}
					</div>
					<div class="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
						{singleStats.reqPerYear > 0 ? `${singleStats.reqPerYear.toFixed(2)} pp/yr` : '—'}
					</div>
				</div>
			</div>
		{/if}

		<Chart
			data={flatData}
			x="year"
			y="value"
			xType="linear"
			height={380}
			yMin={0}
			{yMax}
			margin={chartMargin}
		>
			<svelte:fragment slot="default" let:xScale let:yScale let:innerWidth let:innerHeight>
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
				<AxisX
					{xScale}
					xDomain={[DISPLAY_START, domainEnd]}
					{innerWidth}
					{innerHeight}
					format={(v) => String(Math.round(v))}
					tickCount={5}
					{forceTicks}
				/>

				<!-- "now" divider -->
				<line
					x1={xScale(dataset.latestYear)}
					x2={xScale(dataset.latestYear)}
					y1="0"
					y2={innerHeight}
					stroke="currentColor"
					class="text-gray-300 dark:text-gray-600"
					stroke-dasharray="2 3"
				/>

				<!-- per-country lines + end dots (drawn first, so labels always sit on top) -->
				{#each paths as p (p.id)}
					{#if p.hasData}
						<Line
							data={p.hist.map(([year, value]) => ({ year, value }))}
							x="year"
							y="value"
							{xScale}
							{yScale}
							stroke={p.color}
							strokeWidth={2.6}
							curve="monotone"
						/>
						<circle
							cx={xScale(dataset.latestYear)}
							cy={yScale(p.current ?? 0)}
							r="6"
							fill={p.color}
							stroke="white"
							stroke-width="2.2"
						/>
					{/if}
				{/each}

				<!-- target dots -->
				{#each TARGETS as tg (tg.year)}
					{@const met = single ? (single.current ?? 0) >= tg.value : false}
					<circle
						cx={xScale(tg.year)}
						cy={yScale(tg.value)}
						r={met ? 4.5 : 6.5}
						fill={met ? '#64AE9C' : 'white'}
						stroke={met ? 'white' : '#F5AF4A'}
						stroke-width="2.2"
					/>
				{/each}

				<!-- benchmark markers: squares, so they're told apart from the EU target dots by
				     shape and not colour alone -->
				{#each refPoints as p (`${p.ref.id}-${p.year}`)}
					<rect
						x={xScale(p.year) - 5}
						y={yScale(p.value) - 5}
						width="10"
						height="10"
						fill="white"
						stroke={p.ref.color}
						stroke-width="2.2"
					/>
				{/each}

				<!-- all text labels last, on top of every line/dot, with a white halo for legibility.
				     A target sitting at the right edge of the plot is right-anchored (text flows
				     inward) instead of center-anchored — no extra right margin needed. Which target
				     that is depends on the visible benchmarks, so compare against domainEnd rather
				     than assuming it's the last EU target. -->
				{#each TARGETS as tg (tg.year)}
					{@const met = single ? (single.current ?? 0) >= tg.value : false}
					<text
						x={xScale(tg.year)}
						y={yScale(tg.value) - 12}
						text-anchor={tg.year === domainEnd ? 'end' : 'middle'}
						class="text-xs font-bold"
						fill={met ? '#64AE9C' : '#F5AF4A'}
						stroke="white"
						stroke-width="3"
						stroke-linejoin="round"
						paint-order="stroke fill"
					>
						{met
							? `${tg.year} met`
							: targetAnnotation(tg.year, tg.value, tg.sourceKey, isMobile)}
					</text>
				{/each}

				{#each refPoints as p (`${p.ref.id}-${p.year}`)}
					<text
						x={xScale(p.year)}
						y={yScale(p.value) - 12}
						text-anchor={p.year === domainEnd ? 'end' : 'middle'}
						class="text-xs font-bold"
						fill={p.ref.color}
						stroke="white"
						stroke-width="3"
						stroke-linejoin="round"
						paint-order="stroke fill"
					>
						{targetAnnotation(p.year, p.value, p.ref.sourceKey, isMobile)}
					</text>
				{/each}

				{#if paths.length > 1}
					{#each paths as p (p.id)}
						{#if p.hasData}
							<text
								x={xScale(dataset.latestYear) - 10}
								y={yScale(p.current ?? 0)}
								dy="0.32em"
								text-anchor="end"
								class="text-xs font-bold"
								fill={p.color}
								stroke="white"
								stroke-width="3"
								stroke-linejoin="round"
								paint-order="stroke fill"
							>
								{p.name}
							</text>
						{/if}
					{/each}
				{/if}

				{#if !anyData}
					<text
						x={innerWidth / 2}
						y={innerHeight / 2}
						text-anchor="middle"
						class="text-sm fill-gray-400"
					>
						No data
					</text>
				{/if}
			</svelte:fragment>
		</Chart>

		<TargetSources refs={visibleRefs} />
	</div>
{/if}
