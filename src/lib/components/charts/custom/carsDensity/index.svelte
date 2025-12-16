<!-- $lib/components/charts/custom/mobilityCarDensity/index.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { scaleLinear } from 'd3-scale';
	import { line as d3Line, curveMonotoneX } from 'd3-shape';
	import { min, max } from 'd3-array';
	import formatNumber from '$lib/stores/formatNumber';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import {
		fetchData,
		getPlaceholders,
		generateTitle,
		getLatestData,
		buildChartData,
		colors,
		type CarDensityData
	} from './config';

	// Props from Card slot
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// Chart configuration
	const lineChartHeight = 100;
	const barChartHeight = 48;
	const margin = { top: 20, right: 20, bottom: 30, left: 50 };

	// State
	let loading = true;
	let error: string | null = null;
	let data: CarDensityData | null = null;
	let lineChartWidth = 0;
	let lineChartEl: HTMLElement;
	let resizeObserver: ResizeObserver | null = null;

	// Hover state
	let hoveredPeriod: string | null = null;
	let hoverClientX = 0;
	let hoverClientY = 0;

	// Load data when region changes
	$: if (!regionLoading) {
		loadData();
	}

	async function loadData() {
		loading = true;
		error = null;

		try {
			data = await fetchData(fetch, region);

			if (onChartData && data) {
				onChartData(buildChartData(data, region));
			}
		} catch (e) {
			console.error('[CarDensity] Error loading data:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			data = null;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	// Derived data
	$: placeholders = data ? getPlaceholders(data) : null;
	$: title = placeholders ? generateTitle(placeholders) : '';
	$: latestData = data ? getLatestData(data.region, data.periods) : null;
	$: nationalLatest = data ? getLatestData(data.national, data.periods) : null;

	// Line chart data (total cars over time)
	$: lineData = data?.region.cars.filter((d) => d.value != null) ?? [];

	// Line chart dimensions
	$: innerWidth = Math.max(0, lineChartWidth - margin.left - margin.right);
	$: innerHeight = Math.max(0, lineChartHeight - margin.top - margin.bottom);

	// Line chart scales
	$: xScale =
		lineData.length > 0
			? scaleLinear()
					.domain([Number(lineData[0].period), Number(lineData[lineData.length - 1].period)])
					.range([0, innerWidth])
			: scaleLinear().domain([0, 1]).range([0, innerWidth]);

	$: yMin = lineData.length > 0 ? (min(lineData, (d) => d.value) ?? 0) : 0;
	$: yMax = lineData.length > 0 ? (max(lineData, (d) => d.value) ?? 100) : 100;
	$: yScale = scaleLinear()
		.domain([yMin * 0.95, yMax * 1.05])
		.range([innerHeight, 0]);

	// Line generator
	$: lineGenerator = d3Line<{ period: string; value: number | null }>()
		.x((d) => xScale(Number(d.period)))
		.y((d) => yScale(d.value ?? 0))
		.curve(curveMonotoneX);

	$: linePath = lineData.length > 0 ? lineGenerator(lineData as any) : '';

	// Tooltip data
	$: tooltipData = (() => {
		if (!hoveredPeriod || !data) return null;
		const point = lineData.find((d) => d.period === hoveredPeriod);
		if (!point || point.value == null) return null;
		return {
			title: hoveredPeriod,
			items: [{ label: 'Autos gesamt', value: formatNumber(point.value), color: colors.cars }]
		};
	})();

	// Mouse handlers for line chart
	function handleLineMouseMove(e: MouseEvent) {
		if (!lineChartEl || innerWidth <= 0 || lineData.length === 0) return;
		const rect = lineChartEl.getBoundingClientRect();
		const mouseX = e.clientX - rect.left - margin.left;
		const year = Math.round(xScale.invert(mouseX));
		const period = String(year);
		if (lineData.some((d) => d.period === period)) {
			hoveredPeriod = period;
			hoverClientX = e.clientX;
			hoverClientY = e.clientY;
		} else {
			hoveredPeriod = null;
		}
	}

	function handleMouseLeave() {
		hoveredPeriod = null;
	}

	// Setup resize observer when element is bound
	$: if (lineChartEl && !resizeObserver) {
		resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.contentRect.width > 0) {
					lineChartWidth = entry.contentRect.width;
				}
			}
		});
		resizeObserver.observe(lineChartEl);
		// Get initial width
		lineChartWidth = lineChartEl.clientWidth;
	}

	onMount(() => {
		return () => {
			resizeObserver?.disconnect();
		};
	});
</script>

{#if loading || regionLoading}
	<div class="h-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-64 flex items-center justify-center text-red-500">{error}</div>
{:else if !data || !latestData?.cars}
	<p class="text-lg leading-snug">
		Wähle eine Region auf der Karte, um mehr zur PKW-Dichte zu erfahren. Für manche Regionen sind
		aufgrund von Gemeindezusammenlegungen keine Daten verfügbar.
	</p>
{:else}
	<!-- Title -->
	<h2 class="text-2xl max-w-lg text-balance leading-tight mb-4">
		{title}
	</h2>

	<div class="grid md:grid-cols-2 gap-6">
		<!-- Left: Line chart showing total cars over time -->
		<div>
			<div
				bind:this={lineChartEl}
				class="relative select-none w-full"
				style="height: {lineChartHeight}px;"
				on:mousemove={handleLineMouseMove}
				on:mouseleave={handleMouseLeave}
				role="img"
				aria-label="Anzahl PKW über Zeit"
			>
				{#if lineChartWidth > 0 && lineData.length > 0}
					<svg width={lineChartWidth} height={lineChartHeight}>
						<!-- X axis -->
						<g transform="translate({margin.left},{margin.top + innerHeight})">
							{#each lineData as d}
								<g transform="translate({xScale(Number(d.period))}, 0)" class="text-xs">
									<line y2={5} class="stroke-current opacity-10" />
									<text y={18} text-anchor="middle" fill="currentColor" class="opacity-70">
										{d.period}
									</text>
								</g>
							{/each}
						</g>

						<!-- Y axis -->
						<g transform="translate(0,{margin.top})">
							{#each yScale.ticks(3) as tick}
								<g transform="translate(0, {yScale(tick)})" class="text-xs">
									<line
										x1={margin.left}
										x2={lineChartWidth - margin.right}
										class="stroke-current opacity-10"
									/>
									<text
										x={margin.left - 8}
										dominant-baseline="middle"
										text-anchor="end"
										fill="currentColor"
										class="opacity-70"
									>
										{(tick / 1000).toFixed(0)}k
									</text>
								</g>
							{/each}
						</g>

						<!-- Line -->
						<g transform="translate({margin.left},{margin.top})">
							{#if linePath}
								<path d={linePath} fill="none" stroke={colors.cars} stroke-width={2.5} />
							{/if}

							<!-- Data points -->
							{#each lineData as d}
								{#if d.value != null}
									<circle
										cx={xScale(Number(d.period))}
										cy={yScale(d.value)}
										r={d.period === hoveredPeriod ? 5 : 3}
										fill={colors.cars}
										class="transition-all"
									/>
								{/if}
							{/each}

							<!-- Hover indicator -->
							{#if hoveredPeriod}
								{@const point = lineData.find((d) => d.period === hoveredPeriod)}
								{#if point?.value != null}
									<line
										x1={xScale(Number(hoveredPeriod))}
										y1={0}
										x2={xScale(Number(hoveredPeriod))}
										y2={innerHeight}
										stroke="currentColor"
										stroke-width={1}
										opacity={0.3}
									/>
								{/if}
							{/if}
						</g>
					</svg>

					{#if tooltipData}
						<Tooltip
							visible={true}
							x={hoverClientX}
							y={hoverClientY}
							title={tooltipData.title}
							items={tooltipData.items}
						/>
					{/if}
				{:else if lineData.length === 0}
					<div class="h-full flex items-center justify-center text-sm text-gray-500">
						Keine historischen Daten verfügbar.
					</div>
				{/if}
			</div>
		</div>

		<!-- Right: Comparison numbers -->
		<div class="border-l border-current/20 pl-4">
			<div class="flex gap-1 items-end" style="color: {colors.cars}">
				<!-- Region value -->
				<p class="text-5xl font-light tabular-nums">
					{latestData.carsPer1000}
				</p>
				<p class="text-sm leading-tight">
					Autos pro 1000 Einwohner:innen in {data.region.name}
				</p>
			</div>

			<p class="opacity-80 mt-4 pt-2 border-t border-current/20 text-sm leading-tight">
				{nationalLatest?.carsPer1000 ?? '–'} pro 1000 Einwohner:innen in {data.country.name}
			</p>
		</div>
	</div>

	<!-- Bar chart: Private vs Company -->
	<div class="mt-4 border-t border-current/20 pt-4">
		<div class="relative w-full" style="height: {barChartHeight}px;">
			{#if latestData.privateShare != null && latestData.companyShare != null}
				<svg width="100%" height={barChartHeight}>
					<!-- Private share (left, green) -->
					<rect
						x="0"
						y="0"
						width="{latestData.privateShare}%"
						height={barChartHeight}
						fill={colors.private}
						class="transition-all"
					/>
					<!-- Company share (right, amber) -->
					<rect
						x="{latestData.privateShare}%"
						y="0"
						width="{latestData.companyShare}%"
						height={barChartHeight}
						fill={colors.company}
						class="transition-all"
					/>

					<!-- Labels -->
					<text
						x="8"
						y={barChartHeight / 2}
						dominant-baseline="middle"
						fill="white"
						class="text-sm font-medium"
					>
						Privat: {latestData.privateShare.toFixed(1)}%
					</text>
					<text
						x="100%"
						dx="-8"
						y={barChartHeight / 2}
						dominant-baseline="middle"
						text-anchor="end"
						fill="white"
						class="text-sm font-medium"
					>
						Firmen: {latestData.companyShare.toFixed(1)}%
					</text>
				</svg>
			{:else}
				<p class="text-sm text-gray-500">Keine Daten zur Aufteilung verfügbar.</p>
			{/if}
		</div>

		<!-- Legend -->
		<div class="flex justify-between">
			<div
				class="flex items-center gap-2 text-sm border-l border-current pl-2 pt-1"
				style="color: {colors.private}"
			>
				<span>Privat</span>
			</div>
			<div
				class="flex items-center gap-2 text-sm border-r border-current pr-2 pt-1"
				style="color: {colors.company}"
			>
				<span>Firmen</span>
			</div>
		</div>
	</div>
{/if}
