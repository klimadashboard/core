<!-- $lib/components/charts/custom/vehicleRegistrations/index.svelte -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Chart from '$lib/components/charts/primitives/Chart.svelte';
	import AxisX from '$lib/components/charts/primitives/axes/AxisX.svelte';
	import AxisY from '$lib/components/charts/primitives/axes/AxisY.svelte';
	import Line from '$lib/components/charts/primitives/marks/Line.svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import {
		fetchData,
		buildChartData,
		buildSeriesConfigs,
		type VehicleRawData,
		type SeriesConfig
	} from './config';

	// Props from Card slot
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	export let dataUrl: string = '/data_temp/neuzulassungen-test.tsv';

	// State
	let data: VehicleRawData[] = [];
	let categories: string[] = [];
	let seriesConfigs: SeriesConfig[] = [];
	let loading = true;
	let error: string | null = null;
	let containerEl: HTMLElement;
	let hoveredSeries: string | null = null;

	// Derived
	$: params = { dataUrl };

	// Transform data for Chart component (needs numeric x values)
	$: chartData = data.map((d) => ({
		...d,
		timestamp: d.date.getTime()
	}));

	// Y domain (0 to max value with some padding)
	$: allValues = data.flatMap((d) =>
		categories.map((cat) => d[cat]).filter((v): v is number => typeof v === 'number')
	);
	$: yMax = Math.max(...allValues, 0.1) * 1.1;

	// X domain
	$: xMin = data.length > 0 ? Math.min(...data.map((d) => d.date.getTime())) : Date.now();
	$: xMax = data.length > 0 ? Math.max(...data.map((d) => d.date.getTime())) : Date.now();

	// End labels data
	$: labelData =
		data.length > 0
			? seriesConfigs.map((series) => {
					const validRows = data.filter((d) => d[series.key] != null);
					const lastRow = validRows[validRows.length - 1];
					return {
						key: series.key,
						label: series.label,
						color: series.color,
						x: lastRow?.date.getTime() || 0,
						y: (lastRow?.[series.key] as number) || 0
					};
				})
			: [];

	// Format functions
	function formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
	}

	function formatPercent(value: number): string {
		return `${(value * 100).toFixed(1)}%`;
	}

	// Load data
	$: if (!regionLoading) {
		loadData();
	}

	async function loadData() {
		loading = true;
		error = null;

		try {
			const result = await fetchData(region, params);
			data = result.data;
			categories = result.categories;
			seriesConfigs = buildSeriesConfigs(categories);

			const builtChartData = buildChartData(data, categories, result.updateDate, region);
			onChartData?.(builtChartData);
		} catch (e) {
			console.error('[VehicleRegistrations] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			data = [];
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}
</script>

<div bind:this={containerEl} class="vehicle-registrations">
	{#if loading || regionLoading}
		<div class="h-[500px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-[500px] flex items-center justify-center text-red-500">{error}</div>
	{:else if data.length === 0}
		<div class="h-[500px] flex items-center justify-center text-gray-500">Keine Daten</div>
	{:else}
		<Chart
			data={chartData}
			x="timestamp"
			y={categories}
			xType="linear"
			height={300}
			yMin={0}
			{yMax}
			margin={{ top: 20, right: 120, bottom: 40, left: 50 }}
		>
			<svelte:fragment
				slot="default"
				let:xScale
				let:yScale
				let:innerWidth
				let:innerHeight
				let:hover
			>
				<!-- Grid and axes -->
				<AxisY
					{yScale}
					{innerWidth}
					{innerHeight}
					format={formatPercent}
					unit="%"
					gridLines={true}
				/>
				<AxisX
					{xScale}
					xDomain={[xMin, xMax]}
					{innerWidth}
					{innerHeight}
					format={formatDate}
					tickCount={6}
				/>

				<!-- Lines for each category -->
				{#each seriesConfigs as series}
					{@const seriesData = chartData
						.map((d) => ({
							timestamp: d.timestamp,
							value: d[series.key]
						}))
						.filter((d) => d.value != null)}

					<g
						class="cursor-pointer"
						on:mouseenter={() => (hoveredSeries = series.key)}
						on:mouseleave={() => (hoveredSeries = null)}
					>
						<Line
							data={seriesData}
							x="timestamp"
							y="value"
							{xScale}
							{yScale}
							stroke={series.color}
							strokeWidth={hoveredSeries === series.key || !hoveredSeries ? 2 : 1}
							curve="monotone"
							{hover}
						/>
					</g>
				{/each}

				<!-- End labels -->
				{#each labelData as label}
					{@const labelX = xScale(label.x)}
					{@const labelY = yScale(label.y)}
					{#if labelX != null && labelY != null}
						<text
							x={labelX + 8}
							y={labelY}
							fill={label.color}
							font-size="12"
							font-weight="500"
							dominant-baseline="middle"
							opacity={hoveredSeries === label.key || !hoveredSeries ? 1 : 0.3}
							class="transition-opacity pointer-events-none"
						>
							{label.label}
						</text>
					{/if}
				{/each}
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{#if hover.x !== null}
					{@const timestamp = hover.x}
					{@const date = new Date(timestamp)}
					{@const point = chartData.find((d) => d.timestamp === timestamp)}
					{@const items = point
						? seriesConfigs
								.map((s) => {
									const value = point[s.key];
									return typeof value === 'number'
										? {
												label: s.label,
												value: formatPercent(value),
												color: s.color
											}
										: null;
								})
								.filter(Boolean)
						: []}

					<Tooltip
						visible={true}
						x={hover.clientX}
						y={hover.clientY}
						title={date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
						{items}
						container={containerEl}
					/>
				{/if}
			</svelte:fragment>
		</Chart>

		<!-- Legend (optional, can be removed since we have end labels) -->
		<!--
		<div class="flex flex-wrap gap-4 mt-4 text-sm">
			{#each seriesConfigs as series}
				<div 
					class="flex items-center gap-2 cursor-pointer"
					on:mouseenter={() => hoveredSeries = series.key}
					on:mouseleave={() => hoveredSeries = null}
				>
					<span 
						class="w-4 h-0.5" 
						style="background-color: {series.color};"
					></span>
					<span class:font-bold={hoveredSeries === series.key}>{series.label}</span>
				</div>
			{/each}
		</div>
		-->
	{/if}
</div>
