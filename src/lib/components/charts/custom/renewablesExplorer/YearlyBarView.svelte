<!-- $lib/components/charts/custom/renewablesChart/YearlyBarView.svelte -->
<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Chart from '$lib/components/charts/primitives/Chart.svelte';
	import AxisX from '$lib/components/charts/primitives/axes/AxisX.svelte';
	import AxisY from '$lib/components/charts/primitives/axes/AxisY.svelte';
	import RuleX from '$lib/components/charts/primitives/marks/RuleX.svelte';
	import RuleY from '$lib/components/charts/primitives/marks/RuleY.svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import {
		fetchData,
		fetchGoal,
		buildChartData,
		getColor,
		getColors,
		formatPower,
		formatNumber,
		getPowerUnit,
		convertPowerUnit,
		type EnergyType,
		type RenewablesRawData,
		type RenewableGoal
	} from './config';

	// Props
	export let selectedEnergy: EnergyType = 'solar';
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// State
	let data: RenewablesRawData[] = [];
	let goal: RenewableGoal | null = null;
	let loading = true;
	let error: string | null = null;
	let containerEl: HTMLElement;

	// Derived
	$: params = { energy: selectedEnergy };
	$: color = getColor(selectedEnergy);
	$: colors = getColors(selectedEnergy);

	// Calculate required yearly additions
	// If goal has goal_path, use variable yearly requirements; otherwise use even distribution
	$: goalInfo = (() => {
		if (!goal || data.length === 0) return null;

		const currentYear = new Date().getFullYear();
		const lastEntry = data[data.length - 1];
		const currentCumulative = lastEntry?.cumulative_power_kw || 0;

		// Calculate remaining capacity
		const remainingKw = goal.target_power_kw - currentCumulative;
		if (remainingKw <= 0) return null;

		// Last year of additions is the year BEFORE the target year
		const lastAdditionYear = goal.target_year - 1;

		// If goal_path exists, build a map of year -> required addition
		if (goal.goal_path && goal.goal_path.length > 0) {
			const yearlyRequiredMap = new Map<number, number>();
			const path = goal.goal_path;

			for (let i = 0; i < path.length; i++) {
				const current = path[i];
				// Skip the target year itself (goal should be reached BY that year)
				if (current.year > lastAdditionYear) continue;
				if (current.year < currentYear) continue;

				const previous = i > 0 ? path[i - 1] : null;
				const previousCumulative = previous?.cumulative_power_kw ?? currentCumulative;
				const required = current.cumulative_power_kw - previousCumulative;

				if (required > 0) {
					yearlyRequiredMap.set(current.year, required);
				}
			}

			if (yearlyRequiredMap.size === 0) return null;

			// Calculate average for legend display
			const totalRequired = Array.from(yearlyRequiredMap.values()).reduce((a, b) => a + b, 0);
			const avgYearlyRequired = totalRequired / yearlyRequiredMap.size;

			return {
				startYear: Math.min(...yearlyRequiredMap.keys()),
				endYear: Math.max(...yearlyRequiredMap.keys()),
				targetYear: goal.target_year,
				yearlyRequired: avgYearlyRequired, // Average for legend
				yearlyRequiredMap, // Per-year values for bars
				remainingKw,
				hasCustomPath: true
			};
		}

		// Fallback: even distribution (original behavior)
		const yearsRemaining = lastAdditionYear - currentYear + 1;
		if (yearsRemaining <= 0) return null;

		const yearlyRequired = remainingKw / yearsRemaining;

		return {
			startYear: currentYear,
			endYear: lastAdditionYear,
			targetYear: goal.target_year,
			yearlyRequired,
			yearlyRequiredMap: null,
			remainingKw,
			hasCustomPath: false
		};
	})();

	// Build combined data with goal bars
	$: combinedData = (() => {
		if (!goalInfo) return data.map((d) => ({ ...d, isGoalYear: false, goalRequired: 0 }));

		const result: Array<{
			year: number;
			net_power_kw: number;
			cumulative_power_kw: number;
			isGoalYear: boolean;
			goalRequired: number;
		}> = [];

		// Helper to get required value for a year
		const getGoalRequired = (year: number): number => {
			if (goalInfo.yearlyRequiredMap) {
				return goalInfo.yearlyRequiredMap.get(year) || 0;
			}
			return goalInfo.yearlyRequired;
		};

		// Add all historical data
		for (const d of data) {
			const isGoalYear = d.year >= goalInfo.startYear && d.year <= goalInfo.endYear;
			result.push({
				...d,
				isGoalYear,
				goalRequired: isGoalYear ? getGoalRequired(d.year) : 0
			});
		}

		// Add future years that don't have data yet (up to but NOT including target year)
		for (let year = goalInfo.startYear; year <= goalInfo.endYear; year++) {
			if (!result.find((d) => d.year === year)) {
				const goalRequired = getGoalRequired(year);
				// Only add if there's actually a goal value for this year
				if (goalRequired > 0 || !goalInfo.hasCustomPath) {
					result.push({
						year,
						net_power_kw: 0,
						cumulative_power_kw: 0,
						isGoalYear: true,
						goalRequired
					});
				}
			}
		}

		return result.sort((a, b) => a.year - b.year);
	})();

	// X domain includes all years
	$: xDomain = combinedData.map((d) => d.year);

	// Get max goal value (could be from map or single value)
	$: maxGoalRequired = (() => {
		if (!goalInfo) return 0;
		if (goalInfo.yearlyRequiredMap) {
			return Math.max(...goalInfo.yearlyRequiredMap.values(), 0);
		}
		return goalInfo.yearlyRequired;
	})();

	// Max value considers both actual data and goal
	$: maxAbs = Math.max(
		...combinedData.map((d) => Math.abs(d.net_power_kw)),
		maxGoalRequired,
		1
	);

	// Y-axis max needs to include goal bars
	$: yMax = Math.max(...combinedData.map((d) => d.net_power_kw), maxGoalRequired, 1);

	$: unit = getPowerUnit(maxAbs, selectedEnergy);
	$: yFormat = (v: number) => formatNumber(convertPowerUnit(v, maxAbs), 0);

	// Load data when region or energy changes
	$: if (!regionLoading) {
		loadData();
	}

	async function loadData() {
		loading = true;
		error = null;

		try {
			// Fetch main data and goal in parallel
			const [result, goalResult] = await Promise.all([
				fetchData(region, params),
				fetchGoal(region, params)
			]);

			data = result.data;
			goal = goalResult;

			console.log('[YearlyBarView] Data loaded:', data.length, 'records');
			console.log('[YearlyBarView] Goal:', goal);

			const chartData = buildChartData(data, result.updateDate, region, params, 'yearly', goal, result.gridOperatorCheckedRatio);
			onChartData?.(chartData);
		} catch (e) {
			console.error('[YearlyBarView] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			data = [];
			goal = null;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}
</script>

<div bind:this={containerEl} class="yearly-bar-view">
	{#if loading || regionLoading}
		<div class="h-72 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-72 flex items-center justify-center text-red-500">{error}</div>
	{:else if data.length === 0}
		<div class="h-72 flex items-center justify-center text-gray-500">Keine Daten verfügbar</div>
	{:else}
		<Chart
			data={combinedData}
			x="year"
			y="net_power_kw"
			xType="band"
			{xDomain}
			{yMax}
			height={280}
			margin={{ top: 15, right: 15, bottom: 35, left: 55 }}
		>
			<svelte:fragment
				slot="default"
				let:xScale
				let:yScale
				let:xDomain
				let:innerWidth
				let:innerHeight
				let:hover
			>
				<AxisY {yScale} {innerWidth} {innerHeight} format={yFormat} {unit} />
				<AxisX
					{xScale}
					{xDomain}
					{innerWidth}
					{innerHeight}
					format={String}
					tickCount={Math.ceil(xDomain.length / 3)}
				/>
				<RuleY y={0} {yScale} {innerWidth} />

				<!-- Goal bars (dashed outline) - rendered first so actual bars appear on top -->
				{#each combinedData as d}
					{#if d.isGoalYear && d.goalRequired > 0}
						{@const barX = xScale(d.year)}
						{@const barWidth = xScale.bandwidth ? xScale.bandwidth() : 20}
						{@const barY = yScale(d.goalRequired)}
						{@const zeroY = yScale(0)}
						{@const barHeight = Math.abs(zeroY - barY)}
						{#if barX !== undefined}
							<!-- Light fill background -->
							<rect
								x={barX}
								y={barY}
								width={barWidth}
								height={barHeight}
								fill={colors.light}
								opacity="0.4"
							/>
							<!-- Dashed outline -->
							<rect
								x={barX}
								y={barY}
								width={barWidth}
								height={barHeight}
								fill="none"
								stroke={colors.dark}
								stroke-width="1.5"
								stroke-dasharray="4,2"
								opacity="0.8"
							/>
						{/if}
					{/if}
				{/each}

				<!-- Actual data bars -->
				{#each combinedData as d}
					{#if d.net_power_kw !== 0}
						{@const barX = xScale(d.year)}
						{@const barWidth = xScale.bandwidth ? xScale.bandwidth() : 20}
						{@const value = d.net_power_kw}
						{@const barY = value >= 0 ? yScale(value) : yScale(0)}
						{@const zeroY = yScale(0)}
						{@const barHeight = Math.abs(zeroY - yScale(value))}
						{#if barX !== undefined}
							<rect
								x={barX}
								y={barY}
								width={barWidth}
								height={barHeight}
								fill={color}
								class="transition-opacity"
								opacity={hover.x === d.year ? 1 : 0.85}
							/>
						{/if}
					{/if}
				{/each}

				<RuleX {xScale} {innerHeight} {hover} />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{@const point = combinedData.find((d) => d.year === hover.x)}
				<Tooltip
					visible={hover.x !== null}
					x={hover.clientX}
					y={hover.clientY}
					title={hover.x !== null ? String(hover.x) : ''}
					items={point
						? [
								...(point.net_power_kw !== 0
									? [
											{
												label: 'Zubau',
												value: formatPower(point.net_power_kw, selectedEnergy),
												color
											}
										]
									: []),
								...(point.cumulative_power_kw > 0
									? [
											{
												label: 'Kumuliert',
												value: formatPower(point.cumulative_power_kw, selectedEnergy)
											}
										]
									: []),
								...(point.isGoalYear && point.goalRequired > 0
									? [
											{
												label: 'Benötigt für Ziel',
												value: formatPower(point.goalRequired, selectedEnergy),
												color: colors.dark
											}
										]
									: [])
							]
						: []}
					container={containerEl}
				/>
			</svelte:fragment>
		</Chart>

		<!-- Legend -->
		{#if goal && goalInfo}
			<div class="flex flex-wrap gap-4 mt-4 text-sm">
				<div class="flex items-center gap-2">
					<div class="w-4 h-3 rounded-sm" style="background: {color}"></div>
					<span>Tatsächlicher Zubau</span>
				</div>
				<div class="flex items-center gap-2">
					<div
						class="w-4 h-3 rounded-sm border-2 border-dashed"
						style="border-color: {colors.dark}; background: {colors.light}; opacity: 0.6"
					></div>
					<span>
						{#if goalInfo.hasCustomPath}
							Zielpfad bis {goalInfo.targetYear}
						{:else}
							Benötigt: {formatPower(goalInfo.yearlyRequired, selectedEnergy)}/Jahr bis {goalInfo.targetYear}
						{/if}
					</span>
				</div>
			</div>
		{/if}
	{/if}
</div>
