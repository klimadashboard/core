<!-- $lib/components/charts/custom/renewablesCumulativeLine/index.svelte -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Chart from '$lib/components/charts/primitives/Chart.svelte';
	import AxisX from '$lib/components/charts/primitives/axes/AxisX.svelte';
	import AxisY from '$lib/components/charts/primitives/axes/AxisY.svelte';
	import Line from '$lib/components/charts/primitives/marks/Line.svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import { formatPower, formatNumber } from '$lib/utils/formatters';
	import {
		fetchData,
		fetchComparisonData,
		buildChartData,
		getColors,
		getDistance,
		comparisonPalette,
		type CumulativeRawData,
		type ComparisonSeries
	} from './config';

	// Props from Card slot
	export let selectedEnergy: 'solar' | 'wind' = 'solar';
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	export let regions: Array<{
		code: string;
		codeShort?: string;
		name: string;
		center?: [number, number];
		area_km2?: number;
		layer?: string;
		visible?: boolean;
	}> = [];

	// State
	let mainData: CumulativeRawData[] = [];
	let comparisonSeries: ComparisonSeries[] = [];
	let loading = true;
	let error: string | null = null;
	let containerEl: HTMLElement;
	let selectedUnit: 'absolute' | 'perArea' = 'absolute';
	let searchTerm = '';
	let hoveredSeries: string | null = null;

	// Derived
	$: params = { energy: selectedEnergy };
	$: colors = getColors(params);
	$: regionArea = region?.area_km2 || null;

	// Prepare chart data with unit conversion
	$: chartData = prepareChartData(comparisonSeries, mainData, selectedUnit, regionArea);

	function prepareChartData(
		series: ComparisonSeries[],
		main: CumulativeRawData[],
		unit: string,
		area: number | null
	) {
		const result: Array<{
			name: string;
			code?: string;
			color: string;
			isDashed?: boolean;
			data: Array<{ year: number; value: number }>;
		}> = [];

		// Add comparison series
		for (const s of series) {
			const regionInfo = regions.find((r) => r.code === s.code || r.codeShort === s.code);
			result.push({
				name: s.name,
				code: s.code,
				color: s.color,
				data: s.data.map((point) => ({
					year: point.year,
					value:
						unit === 'perArea' && regionInfo?.area_km2
							? point.cumulative_power_kw / regionInfo.area_km2
							: point.cumulative_power_kw
				}))
			});
		}

		// Add goal line (+50% by 2035)
		if (main.length > 0) {
			const baseValue = main.find((d) => d.year === 2024)?.cumulative_power_kw || 0;
			const goalValue = baseValue * 1.5;
			const currentYear = new Date().getFullYear();

			const goalData: Array<{ year: number; value: number }> = [];
			for (let year = currentYear; year <= 2035; year++) {
				const value = unit === 'perArea' && area ? goalValue / area : goalValue;
				goalData.push({ year, value });
			}

			result.push({
				name: 'Ziel (+50% bis 2035)',
				color: '#999',
				isDashed: true,
				data: goalData
			});
		}

		return result;
	}

	// Flatten data for Chart component
	$: allLineData = chartData.flatMap((s) => s.data);
	$: allValues = chartData.flatMap((s) => s.data.map((d) => d.value));
	$: maxValue = Math.max(...allValues, 1);

	// Unit label
	$: unitLabel = (() => {
		const suffix = selectedEnergy === 'solar' ? 'p' : '';
		if (selectedUnit === 'perArea') return `kW${suffix}/km²`;
		if (maxValue >= 1_000_000) return `GW${suffix}`;
		if (maxValue >= 1_000) return `MW${suffix}`;
		return `kW${suffix}`;
	})();

	// Divisor for display
	$: divisor =
		selectedUnit === 'perArea'
			? 1
			: maxValue >= 1_000_000
				? 1_000_000
				: maxValue >= 1_000
					? 1_000
					: 1;

	// Y-axis formatter
	$: yFormat = (v: number) => formatNumber(v, 0);

	// Searchable regions sorted by distance
	$: searchableRegions = regions
		.filter((r) => r.layer !== 'country' && r.visible !== false)
		.sort((a, b) => {
			if (!region?.center) return 0;
			return (
				getDistance(region.center, a.center || null) - getDistance(region.center, b.center || null)
			);
		});

	$: filteredSearchRegions = searchableRegions
		.filter((r) => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
		.slice(0, 10);

	// Load data
	$: if (!regionLoading) {
		loadData();
	}

	async function loadData() {
		loading = true;
		error = null;

		try {
			const result = await fetchData(region, params);
			mainData = result.data;

			// Initialize comparison series with main region
			comparisonSeries = [
				{
					code: region?.codeShort || 'DE',
					name: region?.name || 'Deutschland',
					data: mainData,
					color: colors.dark
				}
			];

			const builtChartData = buildChartData(mainData, result.updateDate, region, params);
			onChartData?.(builtChartData);
		} catch (e) {
			console.error('[CumulativeLine] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			mainData = [];
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	async function toggleRegion(toggledRegion: { code: string; codeShort?: string; name?: string }) {
		const codeToUse = toggledRegion.codeShort || toggledRegion.code;
		const isSelected = comparisonSeries.some((d) => d.code === codeToUse);

		if (isSelected && comparisonSeries.length > 1) {
			comparisonSeries = comparisonSeries.filter((d) => d.code !== codeToUse);
		} else if (!isSelected) {
			loading = true;
			const data = await fetchComparisonData(codeToUse, params);
			const colorIndex = comparisonSeries.length - 1;
			comparisonSeries = [
				...comparisonSeries,
				{
					code: codeToUse,
					name: toggledRegion.name || codeToUse,
					data,
					color: comparisonPalette[colorIndex % comparisonPalette.length]
				}
			];
			loading = false;
		}

		searchTerm = '';
	}
</script>

<div bind:this={containerEl} class="renewables-cumulative-line">
	{#if loading || regionLoading}
		<div class="h-96 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-96 flex items-center justify-center text-red-500">{error}</div>
	{:else if mainData.length === 0}
		<div class="h-96 flex items-center justify-center text-gray-500">Keine Daten</div>
	{:else}
		<!-- Controls -->
		<div class="flex items-center gap-2 flex-wrap mb-4">
			<!-- Region Search -->
			<div class="relative">
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Region hinzufügen..."
					class="bg-gray-100 dark:bg-gray-800 rounded-full py-2 px-4 text-sm"
				/>
				{#if searchTerm && filteredSearchRegions.length > 0}
					<div
						class="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto"
					>
						{#each filteredSearchRegions as searchRegion}
							<button
								class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
								on:click={() => toggleRegion(searchRegion)}
							>
								{searchRegion.name}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Unit Toggle -->
			<div class="bg-gray-100 dark:bg-gray-800 rounded-full p-2 px-3 text-sm inline-flex gap-2">
				<label class:font-bold={selectedUnit === 'absolute'}>
					<input type="radio" value="absolute" class="mr-1" bind:group={selectedUnit} />
					absolut
				</label>
				<label class:font-bold={selectedUnit === 'perArea'}>
					<input type="radio" value="perArea" class="mr-1" bind:group={selectedUnit} />
					pro km²
				</label>
			</div>
		</div>

		<!-- Chart -->
		<div class="relative">
			{#if loading}
				<div
					class="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center z-10"
				>
					<div
						class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"
					></div>
				</div>
			{/if}

			<Chart
				data={allLineData}
				x="year"
				y="value"
				xType="linear"
				height={280}
				yMax={maxValue / divisor}
				margin={{ top: 10, right: 20, bottom: 40, left: 70 }}
			>
				<svelte:fragment
					slot="default"
					let:xScale
					let:yScale
					let:innerWidth
					let:innerHeight
					let:hover
				>
					<AxisY {yScale} {innerWidth} {innerHeight} format={yFormat} unit={unitLabel} />
					<AxisX
						{xScale}
						xDomain={[]}
						{innerWidth}
						{innerHeight}
						format={(v) => String(Math.round(v))}
					/>

					{#each chartData as series}
						{@const seriesData = series.data.map((d) => ({
							year: d.year,
							value: d.value / divisor
						}))}
						<g
							class="cursor-pointer"
							on:mouseenter={() => (hoveredSeries = series.name)}
							on:mouseleave={() => (hoveredSeries = null)}
						>
							<Line
								data={seriesData}
								x="year"
								y="value"
								{xScale}
								{yScale}
								stroke={series.color}
								strokeWidth={hoveredSeries === series.name || !hoveredSeries ? 2 : 1}
								strokeDasharray={series.isDashed ? '5,5' : null}
								{hover}
							/>
						</g>
					{/each}
				</svelte:fragment>

				<svelte:fragment slot="tooltip" let:hover>
					{#if hover.x !== null}
						{@const year = Math.round(hover.x)}
						{@const items = chartData
							.map((s) => {
								const point = s.data.find((d) => d.year === year);
								return point
									? {
											label: s.name,
											value:
												selectedUnit === 'perArea'
													? `${formatNumber(point.value, 1)} kW/km²`
													: formatPower(point.value, selectedEnergy),
											color: s.color
										}
									: null;
							})
							.filter(Boolean)}
						<Tooltip
							visible={true}
							x={hover.clientX}
							y={hover.clientY}
							title={String(year)}
							{items}
							container={containerEl}
						/>
					{/if}
				</svelte:fragment>
			</Chart>
		</div>

		<!-- Legend -->
		<div class="flex flex-wrap gap-3 mt-4 text-sm">
			{#each chartData as series}
				<div
					class="flex items-center gap-2 cursor-pointer"
					on:mouseenter={() => (hoveredSeries = series.name)}
					on:mouseleave={() => (hoveredSeries = null)}
					role="button"
					tabindex="0"
				>
					<div
						class="w-5 h-0.5"
						style="background: {series.color}; {series.isDashed
							? `background-image: repeating-linear-gradient(to right, ${series.color} 0, ${series.color} 5px, transparent 5px, transparent 10px);`
							: ''}"
					></div>
					<span class:font-bold={hoveredSeries === series.name}>{series.name}</span>
					{#if !series.isDashed && series.code && comparisonSeries.length > 1}
						<button
							on:click|stopPropagation={() => toggleRegion({ code: series.code })}
							class="text-red-600 hover:text-red-700 ml-1"
							aria-label="Entfernen"
						>
							×
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
