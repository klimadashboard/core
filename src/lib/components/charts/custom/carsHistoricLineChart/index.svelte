<!-- $lib/components/charts/custom/vehicleRegistrations/index.svelte -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Chart from '$lib/components/charts/primitives/Chart.svelte';
	import AxisX from '$lib/components/charts/primitives/axes/AxisX.svelte';
	import AxisY from '$lib/components/charts/primitives/axes/AxisY.svelte';
	import Line from '$lib/components/charts/primitives/marks/Line.svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import {
		fetchData,
		buildChartData,
		buildSeriesConfigs,
		type VehicleRawData,
		type SeriesConfig,
		type DataMode
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

	// Mode switch
	let activeMode: DataMode = 'neuzulassungen';
	const modeViews = [
		{ key: 'neuzulassungen', label: 'Neuzulassungen' },
		{ key: 'bestand', label: 'Bestand' }
	];

	// Derived
	$: params = { dataUrl, mode: activeMode };

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

	// End labels data with values
	$: labelData =
		data.length > 0
			? seriesConfigs.map((series) => {
					const validRows = data.filter((d) => d[series.key] != null);
					const lastRow = validRows[validRows.length - 1];
					const value = (lastRow?.[series.key] as number) || 0;
					return {
						key: series.key,
						label: series.label,
						color: series.color,
						x: lastRow?.date.getTime() || 0,
						y: value,
						displayValue: `${(value * 100).toFixed(1)}%`
					};
				})
			: [];

	// Resolve label positions to avoid overlaps
	function resolveOverlaps(
		labels: typeof labelData,
		yScale: (v: number) => number,
		minSpacing: number = 14
	): Array<(typeof labelData)[0] & { adjustedY: number }> {
		if (labels.length === 0) return [];

		// Sort by y position (descending value = ascending screen position)
		const sorted = [...labels]
			.map((l) => ({ ...l, adjustedY: yScale(l.y) }))
			.sort((a, b) => a.adjustedY - b.adjustedY);

		// Push overlapping labels apart
		for (let i = 1; i < sorted.length; i++) {
			const prev = sorted[i - 1];
			const curr = sorted[i];
			const overlap = prev.adjustedY + minSpacing - curr.adjustedY;
			if (overlap > 0) {
				curr.adjustedY = prev.adjustedY + minSpacing;
			}
		}

		// If labels went off the bottom, push everything up
		const maxY = Math.max(...sorted.map((l) => l.adjustedY));
		const chartBottom = yScale(0);
		if (maxY > chartBottom - 10) {
			const shift = maxY - (chartBottom - 10);
			sorted.forEach((l) => (l.adjustedY -= shift));
		}

		return sorted;
	}

	// Format functions
	function formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		// For Bestand (yearly), show just year; for Neuzulassungen (monthly), show month + year
		if (activeMode === 'bestand') {
			return date.getFullYear().toString();
		}
		return date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
	}

	function formatPercent(value: number): string {
		return `${(value * 100).toFixed(0)}%`;
	}

	// Load data when region or mode changes
	$: if (!regionLoading && activeMode) {
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

			const builtChartData = buildChartData(
				data,
				categories,
				result.updateDate,
				region,
				activeMode
			);
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
	<!-- Mode Switch -->
	<div class="mb-4">
		<Switch
			type="small"
			views={modeViews}
			activeView={activeMode}
			on:itemClick={(event) => {
				activeMode = event.detail;
			}}
		/>
	</div>

	{#if loading || regionLoading}
		<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
	{:else if data.length === 0}
		<div class="h-[300px] flex items-center justify-center text-gray-500">
			Keine Daten verfügbar
		</div>
	{:else}
		<Chart
			data={chartData}
			x="timestamp"
			y={categories}
			xType="linear"
			height={300}
			yMin={0}
			{yMax}
			margin={{ top: 20, right: 140, bottom: 40, left: 50 }}
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
					unit=""
					gridLines={true}
				/>
				<AxisX
					{xScale}
					xDomain={[xMin, xMax]}
					{innerWidth}
					{innerHeight}
					format={formatDate}
					tickCount={activeMode === 'bestand' ? Math.min(data.length, 6) : 6}
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

				<!-- End labels with values (resolved to avoid overlap) -->
				{@const resolvedLabels = resolveOverlaps(labelData, yScale)}
				{#each resolvedLabels as label}
					{@const labelX = xScale(label.x)}
					{@const originalY = yScale(label.y)}
					{#if labelX != null}
						<!-- Connector line if label was moved -->
						{#if Math.abs(label.adjustedY - originalY) > 2}
							<line
								x1={labelX}
								y1={originalY}
								x2={labelX + 6}
								y2={label.adjustedY}
								stroke={label.color}
								stroke-width="1"
								opacity={hoveredSeries === label.key || !hoveredSeries ? 0.5 : 0.15}
								class="transition-opacity"
							/>
						{/if}
						<!-- Dot at data point -->
						<circle
							cx={labelX}
							cy={originalY}
							r={hoveredSeries === label.key ? 4 : 3}
							fill={label.color}
							opacity={hoveredSeries === label.key || !hoveredSeries ? 1 : 0.3}
							class="transition-all"
						/>
						<!-- Label text -->
						<text
							x={labelX + 8}
							y={label.adjustedY}
							fill={label.color}
							font-size="11"
							font-weight={hoveredSeries === label.key ? '600' : '500'}
							dominant-baseline="middle"
							opacity={hoveredSeries === label.key || !hoveredSeries ? 1 : 0.3}
							class="transition-opacity pointer-events-none"
						>
							{label.label} ({label.displayValue})
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
												value: `${(value * 100).toFixed(1)}%`,
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
						title={activeMode === 'bestand'
							? date.getFullYear().toString()
							: date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
						{items}
						container={containerEl}
					/>
				{/if}
			</svelte:fragment>
		</Chart>
	{/if}
</div>
