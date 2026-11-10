<!-- $lib/components/charts/custom/renewablesChart/CumulativeLineView.svelte -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { getRegionContext, growthCode, type ContextRegion } from '$lib/utils/regionContext';
	import { loadComparisonData } from './comparison';
	import Chart from '$lib/components/charts/primitives/Chart.svelte';
	import AxisX from '$lib/components/charts/primitives/axes/AxisX.svelte';
	import AxisY from '$lib/components/charts/primitives/axes/AxisY.svelte';
	import Line from '$lib/components/charts/primitives/marks/Line.svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import {
		buildChartData,
		getColors,
		comparisonPalette,
		formatPower,
		formatNumber,
		type EnergyType,
		type MetricMode,
		type RenewablesRawData,
		type RenewableGoal,
		type ComparisonSeries
	} from './config';

	// Props
	export let selectedEnergy: EnergyType = 'solar';
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// Shared data props (from parent)
	export let data: RenewablesRawData[] = [];
	export let goal: RenewableGoal | null = null;
	export let updateDate: string = '';
	export let gridOperatorCheckedRatio: number | null = null;
	export let dataLoading: boolean = true;
	export let metricMode: MetricMode = 'power';

	// Chart-wide comparison (picker in index.svelte, kept across views)
	export let comparisons: ContextRegion[] = [];
	export let selectedUnit: 'absolute' | 'perArea' = 'absolute';
	export let onRemoveComparison: ((id: string) => void) | undefined = undefined;

	// Optional: pre-provided regions list (if empty, will fetch from API)
	export let regions: Array<{
		code: string;
		code_short?: string;
		name: string;
		center?: [number, number] | [string, string];
		area?: number;
		layer?: string;
		layer_label?: string;
		visible?: boolean;
		parents?: Array<{ id: string; layer: string }>;
	}> = [];

	type Series = ComparisonSeries & { id?: string; area?: number | null };

	// State
	let mainData: RenewablesRawData[] = [];
	let comparisonSeries: Series[] = [];
	let initialLoading = true;
	let comparisonLoading = false;
	let error: string | null = null;
	let containerEl: HTMLElement;
	let hoveredSeries: string | null = null;

	// Comparison palette without red/green next to each other (a11y), solar yellow is the main line.
	// Biomass has a green main line, so the green comparison colour is left out there.
	const PALETTE_ORDER = [1, 3, 0, 5, 6, 7, 2, 4];
	$: palette = PALETTE_ORDER.filter((i) => !(selectedEnergy === 'biomass' && i === 2))
		.map((i) => comparisonPalette[i])
		.filter(Boolean);

	// Derived
	$: params = { energy: selectedEnergy };
	$: colors = getColors(selectedEnergy);
	// Page regions don't always carry the area: fall back to the region record
	let contextArea: number | null = null;
	$: getRegionContext(region).then((c) => (contextArea = c?.self.area ?? null));
	$: regionArea = region?.area_km2 || (region as { area?: number } | null)?.area || contextArea || null;

	// Check if we should show the goal line (only when main region is the only selected region)
	$: mainRegionCode = region?.code || region?.codeShort || 'DE';
	$: showGoal = comparisonSeries.length === 1 && comparisonSeries[0]?.code === mainRegionCode;

	// Prepare chart data with unit conversion
	$: chartData = prepareChartData(
		comparisonSeries,
		mainData,
		selectedUnit,
		regionArea,
		goal,
		showGoal,
		metricMode
	);

	function prepareChartData(
		series: Series[],
		main: RenewablesRawData[],
		unit: string,
		area: number | null,
		goalData: RenewableGoal | null,
		shouldShowGoal: boolean,
		metric: MetricMode
	) {
		const result: Array<{
			name: string;
			code?: string;
			id?: string;
			color: string;
			isDashed?: boolean;
			isGoal?: boolean;
			data: Array<{ year: number; value: number }>;
		}> = [];

		// Add comparison series (pro km² needs the area: series without one are left out)
		for (const s of series) {
			const seriesArea = s.id === region?.id ? area : (s.area ?? null);
			if (metric !== 'units' && unit === 'perArea' && !seriesArea) continue;
			result.push({
				name: s.name,
				code: s.code,
				id: s.id,
				color: s.color,
				data: s.data.map((point) => ({
					year: point.year,
					value:
						metric === 'units'
							? point.cumulative_units || 0
							: unit === 'perArea' && seriesArea
								? point.cumulative_power_kw / seriesArea
								: point.cumulative_power_kw
				}))
			});
		}

		// Add goal line (only for absolute power view and when main region is the only selection)
		if (goalData && main.length > 0 && unit === 'absolute' && shouldShowGoal && metric === 'power') {
			const currentYear = new Date().getFullYear();
			const lastDataYear = main[main.length - 1]?.year || currentYear;
			const lastCumulative = main[main.length - 1]?.cumulative_power_kw || 0;

			// Create goal line - use goal_path if available, otherwise straight line
			const goalLineData: Array<{ year: number; value: number }> = [];

			if (goalData.goal_path && goalData.goal_path.length > 0) {
				// Use custom goal path - include all points from current year onwards
				// This shows the goal value even for years that have actual data
				for (const point of goalData.goal_path) {
					if (point.year >= lastDataYear) {
						goalLineData.push({ year: point.year, value: point.cumulative_power_kw });
					}
				}

				// Ensure the final target is included if not already in path
				const lastPathYear = goalLineData[goalLineData.length - 1]?.year;
				if (lastPathYear !== goalData.target_year) {
					goalLineData.push({ year: goalData.target_year, value: goalData.target_power_kw });
				}

				// If no goal path points start at or after lastDataYear, fall back to connecting from actual
				if (goalLineData.length === 0) {
					goalLineData.push({ year: lastDataYear, value: lastCumulative });
					goalLineData.push({ year: goalData.target_year, value: goalData.target_power_kw });
				}
			} else {
				// Fallback: straight line from last data point to target
				goalLineData.push({ year: lastDataYear, value: lastCumulative });
				goalLineData.push({ year: goalData.target_year, value: goalData.target_power_kw });
			}

			result.push({
				name: `Ziel ${goalData.target_year} (${formatPower(goalData.target_power_kw, selectedEnergy)})`,
				color: '#999',
				isDashed: true,
				isGoal: true,
				data: goalLineData
			});
		}

		return result;
	}

	// Flatten data for Chart component - include ALL unique years from all series (including goal)
	$: allLineData = (() => {
		const yearMap = new Map<number, any>();
		for (const series of chartData) {
			for (const point of series.data) {
				if (!yearMap.has(point.year)) {
					yearMap.set(point.year, { year: point.year });
				}
			}
		}
		return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
	})();
	$: allValues = chartData.flatMap((s) => s.data.map((d) => d.value));
	$: maxValue = Math.max(...allValues, 1);

	// Unit label
	$: unitLabel = (() => {
		if (metricMode === 'units') {
			if (maxValue >= 1_000_000) return 'Mio. Anlagen';
			if (maxValue >= 1_000) return 'Tsd. Anlagen';
			return 'Anlagen';
		}
		const suffix = selectedEnergy === 'solar' ? 'p' : '';
		if (selectedUnit === 'perArea') return `kW${suffix}/km²`;
		if (maxValue >= 1_000_000) return `GW${suffix}`;
		if (maxValue >= 1_000) return `MW${suffix}`;
		return `kW${suffix}`;
	})();

	// Divisor for display
	$: divisor =
		metricMode === 'units'
			? maxValue >= 1_000_000
				? 1_000_000
				: maxValue >= 1_000
					? 1_000
					: 1
			: selectedUnit === 'perArea'
				? 1
				: maxValue >= 1_000_000
					? 1_000_000
					: maxValue >= 1_000
						? 1_000
						: 1;

	// Y-axis formatter
	$: yFormat = (v: number) => formatNumber(v, v % 1 !== 0 ? 1 : 0);

	// Initialize from shared data when it changes
	$: if (!dataLoading && data.length > 0) {
		initializeFromSharedData();
	}

	async function initializeFromSharedData() {
		initialLoading = true;
		error = null;

		try {
			// Use shared data
			mainData = data;

			// Initialize comparison series with main region
			comparisonSeries = [
				{
					id: region?.id,
					area: regionArea,
					code: region?.code || region?.codeShort || 'DE',
					name: region?.name || 'Deutschland',
					data: mainData,
					color: colors.dark
				}
			];

			const builtChartData = buildChartData(
				mainData,
				updateDate,
				region,
				params,
				'cumulative',
				goal,
				gridOperatorCheckedRatio
			);
			onChartData?.(builtChartData);
		} catch (e) {
			console.error('[CumulativeLineView] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			mainData = [];
			onChartData?.(null);
		} finally {
			initialLoading = false;
		}
	}

	// Keep the comparison lines in sync with the chart-wide selection
	let syncToken = 0;
	$: if (!initialLoading && mainData.length) syncComparisons(comparisons, selectedEnergy);

	async function syncComparisons(list: ContextRegion[], energy: EnergyType) {
		const token = ++syncToken;
		const wanted = new Set(list.map((r) => r.id));
		const keep = (all: Series[]) => all.filter((s) => s.id === region?.id || wanted.has(s.id ?? ''));
		comparisonSeries = keep(comparisonSeries);
		const missing = list.filter((r) => !comparisonSeries.some((s) => s.id === r.id));
		if (!missing.length) return;
		comparisonLoading = true;
		try {
			const results = await Promise.all(missing.map((r) => loadComparisonData(r, energy).catch(() => [])));
			if (token !== syncToken) return; // a newer selection takes over (data is cached)
			let next = keep(comparisonSeries);
			missing.forEach((r, i) => {
				if (!results[i].length || next.some((s) => s.id === r.id)) return;
				const used = new Set(next.map((s) => s.color));
				const color = palette.find((c) => !used.has(c)) ?? palette[next.length % palette.length];
				next = [
					...next,
					{ id: r.id, code: growthCode(r) ?? 'DE', name: r.name, area: r.area ?? null, data: results[i], color }
				];
			});
			// Region itself first, then in the order picked
			const main = next.filter((s) => s.id === region?.id);
			comparisonSeries = [...main, ...list.map((r) => next.find((s) => s.id === r.id)).filter((s): s is Series => !!s)];
		} catch (e) {
			console.error('[CumulativeLineView] Failed to fetch comparison data:', e);
		} finally {
			if (token === syncToken) comparisonLoading = false;
		}
	}

	function handleLegendClick(series: { id?: string; isGoal?: boolean }) {
		if (series.isGoal || !series.id || series.id === region?.id) return;
		onRemoveComparison?.(series.id);
	}
</script>

{#snippet removeIcon()}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<circle cx="12" cy="12" r="10" />
		<path d="m15 9-6 6" />
		<path d="m9 9 6 6" />
	</svg>
{/snippet}

<div bind:this={containerEl} class="cumulative-line-view">
	{#if initialLoading || regionLoading || dataLoading}
		<div class="h-96 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-96 flex items-center justify-center text-red-500">{error}</div>
	{:else if mainData.length === 0}
		<div class="h-96 flex items-center justify-center text-gray-500">Keine Daten verfügbar</div>
	{:else}
		<!-- Chart -->
		<div class="relative">
			{#if comparisonLoading}
				<div
					class="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded"
				>
					<Loader />
				</div>
			{/if}

			<Chart
				data={allLineData}
				x="year"
				y="value"
				xType="linear"
				height={280}
				yMax={maxValue / divisor}
				margin={{ top: 10, right: 20, bottom: 40, left: 32 }}
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
					{@const lastDataYear = mainData.length > 0 ? mainData[mainData.length - 1].year : null}
					{@const goalSeries = chartData.find((s) => s.isGoal)}
					{@const firstGoalYear = goalSeries?.data[0]?.year}
					{@const ticksToForce = [
						// Only show lastDataYear if it's not within 1 year of the first goal year
						...(lastDataYear && (!firstGoalYear || Math.abs(firstGoalYear - lastDataYear) > 1)
							? [lastDataYear]
							: []),
						// Show first goal year if it exists (this is where the goal line starts)
						...(firstGoalYear ? [firstGoalYear] : []),
						// Always show target year
						...(goal && showGoal ? [goal.target_year] : [])
					]}
					<AxisX
						{xScale}
						xDomain={[]}
						{innerWidth}
						{innerHeight}
						format={(v) => String(Math.round(v))}
						tickCount={10}
						forceTicks={ticksToForce}
					/>

					{@const currentYear = new Date().getFullYear()}
					{#each chartData as series, i}
						{@const seriesData = series.data.map((d) => ({
							year: d.year,
							value: d.value / divisor
						}))}
						{@const isMainSeries = i === 0 && series.color === colors.dark}
						{@const hasCurrentYearData = !series.isGoal && seriesData.some((d) => d.year === currentYear)}
						{@const solidData = hasCurrentYearData
							? seriesData.filter((d) => d.year < currentYear)
							: seriesData}
						{@const dashedData = hasCurrentYearData
							? seriesData.filter((d) => d.year >= currentYear - 1 && d.year <= currentYear)
							: []}
						<g
							class="cursor-pointer"
							role="presentation"
							on:mouseenter={() => (hoveredSeries = series.name)}
							on:mouseleave={() => (hoveredSeries = null)}
						>
							<!-- Solid line for completed years -->
							<Line
								data={solidData}
								x="year"
								y="value"
								{xScale}
								{yScale}
								stroke={series.color}
								strokeWidth={hoveredSeries === series.name || !hoveredSeries ? 2 : 1}
								strokeDasharray={series.isDashed ? '5,5' : null}
								fillGradient={isMainSeries}
								fillOpacity={0.5}
								{hover}
							/>
							<!-- Dashed line for current (incomplete) year -->
							{#if dashedData.length > 1}
								<Line
									data={dashedData}
									x="year"
									y="value"
									{xScale}
									{yScale}
									stroke={series.color}
									strokeWidth={hoveredSeries === series.name || !hoveredSeries ? 2 : 1}
									strokeDasharray="5,5"
									{hover}
								/>
							{/if}
						</g>
					{/each}
				</svelte:fragment>

				<svelte:fragment slot="tooltip" let:hover>
					{#if hover.x !== null}
						{@const year = Math.round(hover.x)}
						{@const items = chartData
							.map((s) => {
								const point = s.data.find((d) => d.year === year);
								if (!point) return null;

								// For goal line, show simpler label like "Ziel 2030" instead of full name
								const label = s.isGoal ? `Ziel ${year}` : s.name;

								return {
									label,
									value:
										metricMode === 'units'
											? formatNumber(point.value, 0)
											: selectedUnit === 'perArea'
												? `${formatNumber(point.value, 1)} ${unitLabel}`
												: formatPower(point.value, selectedEnergy),
									color: s.color
								};
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
		<div class="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm">
			{#each chartData as series}
				{@const canRemove = !series.isGoal && !!series.id && series.id !== region?.id}
				<button
					class="flex items-center gap-2 transition-opacity {canRemove ? 'hover:opacity-70' : ''}"
					on:mouseenter={() => (hoveredSeries = series.name)}
					on:mouseleave={() => (hoveredSeries = null)}
					on:click={() => handleLegendClick(series)}
					disabled={!canRemove}
					aria-label={canRemove ? `${series.name} aus dem Vergleich entfernen` : undefined}
				>
					<div
						class="w-5 h-0.5"
						style="background: {series.color}; {series.isDashed
							? `background-image: repeating-linear-gradient(to right, ${series.color} 0, ${series.color} 5px, transparent 5px, transparent 10px);`
							: ''}"
					></div>
					<span class:font-bold={hoveredSeries === series.name}>{series.name}</span>
					{#if canRemove}
						<span class="text-gray-400 hover:text-red-500 transition-colors">
							{@render removeIcon()}
						</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
