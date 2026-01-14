<!-- $lib/components/charts/custom/renewableCapacity/index.svelte -->
<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { area as d3Area, line as d3Line, curveLinear } from 'd3-shape';
	import { onMount } from 'svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import {
		fetchData,
		buildChartData,
		processData,
		formatGWh,
		type RenewableDataPoint
	} from './config';

	// Props from Card slot
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// Chart configuration
	const height = 400;
	const margin = { top: 30, right: 15, bottom: 40, left: 70 };

	// Colors
	const colors = {
		pv: '#E0A906',
		wind: '#003B80',
		total: '#111827',
		projected: '#D1D5DB'
	};

	// State
	let containerEl: HTMLElement;
	let width = 0;
	let data: RenewableDataPoint[] = [];
	let loading = true;
	let error: string | null = null;

	// Hover state
	let hoveredYear: number | null = null;
	let hoverClientX = 0;
	let hoverClientY = 0;

	// Load data
	$: if (!regionLoading) {
		loadData();
	}

	async function loadData() {
		loading = true;
		error = null;

		try {
			const result = await fetchData(region, {});
			data = result.data;

			// Build and emit chart data for Card integration
			const builtChartData = buildChartData(data, result.updateDate, region);
			onChartData?.(builtChartData);
		} catch (e) {
			console.error('[RenewableCapacity] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			data = [];
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	// Derived data (converted to GWh)
	$: processedData = processData(data);
	$: actualDataGWh = processedData.actualDataGWh;
	$: goalRow = processedData.goalRow;
	$: goalValueGWh = processedData.goalValueGWh;
	$: lastActual = actualDataGWh.length > 0 ? actualDataGWh[actualDataGWh.length - 1] : null;
	$: lastYear = lastActual?.year ?? 0;
	$: lastTotal = lastActual?.total ?? 0;
	$: goalYear = goalRow?.year ?? 0;

	// Dimensions
	$: innerWidth = Math.max(0, width - margin.left - margin.right);
	$: innerHeight = Math.max(0, height - margin.top - margin.bottom);

	// Scales
	$: allYears = [...actualDataGWh.map((d) => d.year), goalYear].filter(Boolean);
	$: minYear = allYears.length > 0 ? Math.min(...allYears) : 2020;
	$: maxYear = allYears.length > 0 ? Math.max(...allYears) : 2035;
	$: maxValue = Math.max(...actualDataGWh.map((d) => d.total), goalValueGWh, 0) * 1.1;

	$: xScale = scaleLinear().domain([minYear, maxYear]).range([0, innerWidth]);
	$: yScale = scaleLinear()
		.domain([0, Math.max(220, maxValue)])
		.range([innerHeight, 0]);

	// Stacked area data (in GWh)
	$: stackedAreas = (() => {
		const windArea = actualDataGWh.map((d) => ({
			year: d.year,
			y0: 0,
			y1: d.wind
		}));

		const pvArea = actualDataGWh.map((d) => ({
			year: d.year,
			y0: d.wind,
			y1: d.wind + d.pv
		}));

		return { wind: windArea, pv: pvArea };
	})();

	// Area path generator
	$: areaGenerator = d3Area<{ year: number; y0: number; y1: number }>()
		.x((d) => xScale(d.year))
		.y0((d) => yScale(d.y0))
		.y1((d) => yScale(d.y1))
		.curve(curveLinear);

	// Line path generator
	$: lineGenerator = d3Line<{ year: number; value: number }>()
		.x((d) => xScale(d.year))
		.y((d) => yScale(d.value))
		.curve(curveLinear);

	// Total line data
	$: totalLineData = actualDataGWh.map((d) => ({
		year: d.year,
		value: d.total
	}));

	// Projected area and line
	$: projectedAreaData =
		lastActual && goalRow
			? [
					{ year: lastYear, y0: 0, y1: lastTotal },
					{ year: goalYear, y0: 0, y1: goalValueGWh }
				]
			: [];

	$: projectedLineData =
		lastActual && goalRow
			? [
					{ year: lastYear, value: lastTotal },
					{ year: goalYear, value: goalValueGWh }
				]
			: [];

	// Path strings
	$: windAreaPath = stackedAreas.wind.length > 0 ? areaGenerator(stackedAreas.wind) : '';
	$: pvAreaPath = stackedAreas.pv.length > 0 ? areaGenerator(stackedAreas.pv) : '';
	$: totalLinePath = totalLineData.length > 0 ? lineGenerator(totalLineData) : '';
	$: projectedAreaPath = projectedAreaData.length > 0 ? areaGenerator(projectedAreaData) : '';
	$: projectedLinePath = projectedLineData.length > 0 ? lineGenerator(projectedLineData) : '';

	// Tooltip data - include goal year
	$: tooltipData = (() => {
		if (hoveredYear === null) return null;

		// Check if it's the goal year
		if (hoveredYear === goalYear && goalRow) {
			return {
				title: `${hoveredYear} (Ziel)`,
				items: [{ label: 'Ziel', value: `${formatGWh(goalValueGWh)} GWh`, color: colors.total }]
			};
		}

		// Otherwise show actual data
		const yearData = actualDataGWh.find((d) => d.year === hoveredYear);
		if (!yearData) return null;

		return {
			title: `${hoveredYear}`,
			items: [
				{ label: 'Wind', value: `${formatGWh(yearData.wind)} GWh`, color: colors.wind },
				{ label: 'PV', value: `${formatGWh(yearData.pv)} GWh`, color: colors.pv },
				{ label: 'Gesamt', value: `${formatGWh(yearData.total)} GWh`, color: colors.total }
			]
		};
	})();

	// Mouse handlers
	function handleMouseMove(e: MouseEvent) {
		if (innerWidth <= 0) return;

		const rect = containerEl.getBoundingClientRect();
		const mouseX = e.clientX - rect.left - margin.left;
		const year = Math.round(xScale.invert(mouseX));

		// Allow hovering on actual data years or the goal year
		if (actualDataGWh.some((d) => d.year === year) || year === goalYear) {
			hoveredYear = year;
			hoverClientX = e.clientX;
			hoverClientY = e.clientY;
		} else {
			hoveredYear = null;
		}
	}

	function handleMouseLeave() {
		hoveredYear = null;
	}

	// Resize observer
	let ro: ResizeObserver | null = null;

	onMount(() => {
		ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const newWidth = entry.contentRect.width;
				if (newWidth > 0) {
					width = newWidth;
				}
			}
		});

		return () => {
			ro?.disconnect();
		};
	});

	$: if (containerEl && ro) {
		ro.observe(containerEl);
	}

	// Generate smart x-axis ticks with goal year always included
	$: xAxisTicks = (() => {
		const baseTicks = xScale.ticks(width > 600 ? 10 : 5);

		// Add goal year if it exists and isn't already in the ticks
		if (goalYear && !baseTicks.includes(goalYear)) {
			baseTicks.push(goalYear);
			baseTicks.sort((a, b) => a - b);
		}

		// Filter out ticks that are too close together (min 40px distance)
		const minPixelDistance = 40;
		const filteredTicks: number[] = [];

		for (let i = 0; i < baseTicks.length; i++) {
			const tick = baseTicks[i];
			const tickX = xScale(tick);
			const isGoalYear = tick === goalYear;

			// Always include goal year
			let shouldInclude = isGoalYear;

			if (!shouldInclude && filteredTicks.length === 0) {
				shouldInclude = true; // Always include first tick
			} else if (!shouldInclude) {
				const lastTick = filteredTicks[filteredTicks.length - 1];
				const lastTickX = xScale(lastTick);
				const distance = Math.abs(tickX - lastTickX);
				shouldInclude = distance >= minPixelDistance;
			}

			if (shouldInclude) {
				filteredTicks.push(tick);
			}
		}

		return filteredTicks;
	})();
</script>

{#if loading || regionLoading}
	<div class="h-[400px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[400px] flex items-center justify-center text-red-500">{error}</div>
{:else if data.length === 0}
	<div class="h-[400px] flex items-center justify-center text-gray-500">Keine Daten verfügbar</div>
{:else}
	<div
		bind:this={containerEl}
		class="relative select-none w-full"
		style="height: {height}px;"
		on:mousemove={handleMouseMove}
		on:mouseleave={handleMouseLeave}
		role="img"
		aria-label="Renewable production chart"
	>
		{#if width > 0}
			<svg {width} {height}>
				<!-- X axis -->
				<g transform="translate({margin.left},{margin.top + innerHeight})">
					{#each xAxisTicks as tick}
						<g transform="translate({xScale(tick)}, 0)" class="text-xs">
							<line y2={5} class="stroke-current opacity-10" />
							<text y={20} text-anchor="middle" fill="currentColor" class="opacity-70">{tick}</text>
						</g>
					{/each}
				</g>

				<!-- Y axis -->
				<g transform="translate(0,{margin.top})">
					{#each yScale.ticks(6) as tick}
						<g transform="translate(0, {yScale(tick)})" class="text-xs">
							<line x1={margin.left} x2={width - margin.right} class="stroke-current opacity-10" />
							<text
								x={margin.left - 8}
								dominant-baseline="middle"
								text-anchor="end"
								fill="currentColor"
								class="opacity-70"
							>
								{formatGWh(tick)}
							</text>
						</g>
					{/each}
					<!-- Y axis label -->
					<text
						transform="rotate(-90)"
						x={-innerHeight / 2}
						y={15}
						text-anchor="middle"
						fill="currentColor"
						class="text-xs opacity-70"
					>
						Produktion (GWh)
					</text>
				</g>

				<!-- Chart area -->
				<g transform="translate({margin.left},{margin.top})">
					<!-- Stacked areas -->
					{#if windAreaPath}
						<path d={windAreaPath} fill={colors.wind} opacity={0.85} />
					{/if}
					{#if pvAreaPath}
						<path d={pvAreaPath} fill={colors.pv} opacity={0.85} />
					{/if}

					<!-- Total line (actuals) -->
					{#if totalLinePath}
						<path d={totalLinePath} fill="none" stroke={colors.total} stroke-width={2.5} />
					{/if}

					<!-- Projected line (dotted) -->
					{#if projectedLinePath}
						<path
							d={projectedLinePath}
							fill="none"
							stroke={colors.total}
							stroke-width={2}
							stroke-dasharray="4 4"
						/>
					{/if}

					<!-- Goal point -->
					{#if goalRow}
						<circle
							cx={xScale(goalYear)}
							cy={yScale(goalValueGWh)}
							r={5}
							fill={colors.total}
							stroke="#FFFFFF"
							stroke-width={1.5}
						/>
						<!-- Goal annotation -->
						<text
							x={xScale(goalYear) - 8}
							y={yScale(goalValueGWh) - 10}
							text-anchor="end"
							fill={colors.total}
							class="text-xs"
						>
							Ziel {goalYear}: {formatGWh(goalValueGWh)} GWh
						</text>
					{/if}

					<!-- Hover indicator -->
					{#if hoveredYear !== null}
						{@const yearData = actualDataGWh.find((d) => d.year === hoveredYear)}
						{#if yearData}
							<line
								x1={xScale(hoveredYear)}
								y1={0}
								x2={xScale(hoveredYear)}
								y2={innerHeight}
								stroke="currentColor"
								stroke-width={1}
								opacity={0.3}
							/>
							<circle
								cx={xScale(hoveredYear)}
								cy={yScale(yearData.total)}
								r={4}
								fill={colors.total}
								stroke="#FFFFFF"
								stroke-width={1.5}
							/>
						{/if}
					{/if}
				</g>
			</svg>

			<!-- Tooltip -->
			{#if tooltipData}
				<Tooltip
					visible={true}
					x={hoverClientX}
					y={hoverClientY}
					title={tooltipData.title}
					items={tooltipData.items}
				/>
			{/if}
		{:else}
			<div class="h-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
		{/if}
	</div>

	<!-- Legend -->
	<div class="flex flex-wrap gap-4 mt-4">
		<div class="flex items-center gap-2 text-sm">
			<span class="w-3 h-3 rounded-sm" style="background-color: {colors.wind}"></span>
			<span>Wind</span>
		</div>
		<div class="flex items-center gap-2 text-sm">
			<span class="w-3 h-3 rounded-sm" style="background-color: {colors.pv}"></span>
			<span>PV</span>
		</div>
		<div class="flex items-center gap-2 text-sm">
			<span class="w-4 h-0.5" style="background-color: {colors.total}"></span>
			<span>Gesamt</span>
		</div>
		{#if goalRow}
			<div class="flex items-center gap-2 text-sm">
				<span class="w-4 h-0.5 border-t-2 border-dashed" style="border-color: {colors.total}"
				></span>
				<span>Zielpfad</span>
			</div>
		{/if}
	</div>
{/if}
