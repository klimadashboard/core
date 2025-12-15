<!-- $lib/components/charts/custom/renewableCapacity/index.svelte -->
<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { area as d3Area, line as d3Line, curveLinear } from 'd3-shape';
	import { onMount } from 'svelte';
	import formatNumber from '$lib/stores/formatNumber';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';

	// Props
	export let data: Array<{
		year: number;
		pv?: number;
		wind?: number;
		total?: number;
		goal?: number;
	}> = [
		{ year: 2023, pv: 172, wind: 169217, total: 169389 },
		{ year: 2024, pv: 12179, wind: 142175, total: 154354 },
		{ year: 2035, goal: 200000 }
	];

	// Chart configuration
	const height = 400;
	const margin = { top: 30, right: 60, bottom: 40, left: 60 };

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

	// Hover state
	let hoveredYear: number | null = null;
	let hoverClientX = 0;
	let hoverClientY = 0;

	// Derived data
	$: actualData = data.filter((d) => d.total != null);
	$: goalRow = data.find((d) => d.goal != null);
	$: lastActual = actualData.length > 0 ? actualData[actualData.length - 1] : null;
	$: lastYear = lastActual?.year ?? 0;
	$: lastTotal = lastActual?.total ?? 0;
	$: goalYear = goalRow?.year ?? 0;
	$: goalValue = goalRow?.goal ?? 0;

	// Dimensions
	$: innerWidth = Math.max(0, width - margin.left - margin.right);
	$: innerHeight = Math.max(0, height - margin.top - margin.bottom);

	// Scales
	$: allYears = [...actualData.map((d) => d.year), goalYear].filter(Boolean);
	$: minYear = allYears.length > 0 ? Math.min(...allYears) : 2020;
	$: maxYear = allYears.length > 0 ? Math.max(...allYears) : 2035;
	$: maxValue = Math.max(...actualData.map((d) => d.total ?? 0), goalValue, 0) * 1.1;

	$: xScale = scaleLinear().domain([minYear, maxYear]).range([0, innerWidth]);
	$: yScale = scaleLinear()
		.domain([0, Math.max(220, maxValue)])
		.range([innerHeight, 0]);

	// Stacked area data
	$: stackedAreas = (() => {
		// Wind on bottom, PV on top
		const windArea = actualData.map((d) => ({
			year: d.year,
			y0: 0,
			y1: d.wind ?? 0
		}));

		const pvArea = actualData.map((d) => ({
			year: d.year,
			y0: d.wind ?? 0,
			y1: (d.wind ?? 0) + (d.pv ?? 0)
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
	$: totalLineData = actualData.map((d) => ({
		year: d.year,
		value: d.total ?? 0
	}));

	// Projected area and line
	$: projectedAreaData =
		lastActual && goalRow
			? [
					{ year: lastYear, y0: 0, y1: lastTotal },
					{ year: goalYear, y0: 0, y1: goalValue }
				]
			: [];

	$: projectedLineData =
		lastActual && goalRow
			? [
					{ year: lastYear, value: lastTotal },
					{ year: goalYear, value: goalValue }
				]
			: [];

	// Path strings
	$: windAreaPath = stackedAreas.wind.length > 0 ? areaGenerator(stackedAreas.wind) : '';
	$: pvAreaPath = stackedAreas.pv.length > 0 ? areaGenerator(stackedAreas.pv) : '';
	$: totalLinePath = totalLineData.length > 0 ? lineGenerator(totalLineData) : '';
	$: projectedAreaPath = projectedAreaData.length > 0 ? areaGenerator(projectedAreaData) : '';
	$: projectedLinePath = projectedLineData.length > 0 ? lineGenerator(projectedLineData) : '';

	// Bar width for hover detection
	$: barWidth = innerWidth > 0 ? Math.max(10, innerWidth / (maxYear - minYear + 1)) : 20;

	// Tooltip data
	$: tooltipData = (() => {
		if (hoveredYear === null) return null;
		const yearData = actualData.find((d) => d.year === hoveredYear);
		if (!yearData) return null;

		return {
			title: `${hoveredYear}`,
			items: [
				{ label: 'Wind', value: `${formatNumber(yearData.wind ?? 0)} GW`, color: colors.wind },
				{ label: 'PV', value: `${formatNumber(yearData.pv ?? 0)} GW`, color: colors.pv },
				{ label: 'Total', value: `${formatNumber(yearData.total ?? 0)} GW`, color: colors.total }
			]
		};
	})();

	// Mouse handlers
	function handleMouseMove(e: MouseEvent) {
		if (innerWidth <= 0) return;

		const rect = containerEl.getBoundingClientRect();
		const mouseX = e.clientX - rect.left - margin.left;
		const year = Math.round(xScale.invert(mouseX));

		if (actualData.some((d) => d.year === year)) {
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
</script>

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
				{#each xScale.ticks(width > 600 ? 10 : 5) as tick}
					<g transform="translate({xScale(tick)}, 0)" class="text-xs">
						<line y2={5} class="stroke-current opacity-10" />
						<text y={20} text-anchor="middle" fill="currentColor" class="opacity-70">{tick}</text>
					</g>
				{/each}
				<!-- X axis label -->
				<text
					x={innerWidth / 2}
					y={35}
					text-anchor="middle"
					fill="currentColor"
					class="text-xs opacity-70"
				>
					Year
				</text>
			</g>

			<!-- Y axis -->
			<g transform="translate(0,{margin.top})">
				{#each yScale.ticks(6) as tick, i}
					<g transform="translate(0, {yScale(tick)})" class="text-xs">
						<line x1={margin.left} x2={width - margin.right} class="stroke-current opacity-10" />
						<text
							x={margin.left - 8}
							dominant-baseline="middle"
							text-anchor="end"
							fill="currentColor"
							class="opacity-70"
						>
							{tick}
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
				<!-- Projected area (gray fill under projected line) -->
				{#if projectedAreaPath}
					<path d={projectedAreaPath} fill={colors.projected} opacity={0.6} />
				{/if}

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
						cy={yScale(goalValue)}
						r={5}
						fill={colors.total}
						stroke="#FFFFFF"
						stroke-width={1.5}
					/>
					<!-- Goal annotation -->
					<text
						x={xScale(goalYear) + 8}
						y={yScale(goalValue) - 6}
						text-anchor="start"
						fill={colors.total}
						class="text-xs"
					>
						Ziel {goalYear}: {goalValue}
					</text>
				{/if}

				<!-- Hover indicator -->
				{#if hoveredYear !== null}
					{@const yearData = actualData.find((d) => d.year === hoveredYear)}
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
							cy={yScale(yearData.total ?? 0)}
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
	<div class="flex items-center gap-2 text-sm">
		<span class="w-4 h-0.5 border-t-2 border-dashed" style="border-color: {colors.total}"></span>
		<span>Zielpfad</span>
	</div>
</div>
