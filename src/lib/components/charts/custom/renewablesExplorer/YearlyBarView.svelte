<!-- $lib/components/charts/custom/renewablesChart/YearlyBarView.svelte -->
<script context="module" lang="ts">
	/** x key of the bar with the planned units without a (future) date, after all years */
	const PLANNED_KEY = 9999;
	let instanceCount = 0;
</script>

<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Chart from '$lib/components/charts/primitives/Chart.svelte';
	import AxisX from '$lib/components/charts/primitives/axes/AxisX.svelte';
	import AxisY from '$lib/components/charts/primitives/axes/AxisY.svelte';
	import RuleX from '$lib/components/charts/primitives/marks/RuleX.svelte';
	import RuleY from '$lib/components/charts/primitives/marks/RuleY.svelte';
	import BarY from '$lib/components/charts/primitives/marks/BarY.svelte';
	import Tooltip from '$lib/components/charts/primitives/Tooltip.svelte';
	import {
		buildChartData,
		plannedUndatedLabel,
		getColor,
		getColors,
		getYearlyValue,
		getCumulativeValue,
		formatPower,
		formatNumber,
		getPowerUnit,
		convertPowerUnit,
		type EnergyType,
		type MetricMode,
		type RenewablesRawData,
		type RenewableGoal,
		type PlannedData
	} from './config';

	// Props
	export let selectedEnergy: EnergyType = 'solar';
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// Shared data props (from parent)
	export let data: RenewablesRawData[] = [];
	export let goal: RenewableGoal | null = null;
	/** Units "In Planung" (null: not shown for this energy / region) */
	export let planned: PlannedData | null = null;
	export let updateDate: string = '';
	export let gridOperatorCheckedRatio: number | null = null;
	export let dataLoading: boolean = true;
	export let metricMode: MetricMode = 'power';

	// State
	let containerEl: HTMLElement;
	const hatchId = `planned-hatch-${++instanceCount}`;

	// Derived
	$: params = { energy: selectedEnergy };
	$: color = getColor(selectedEnergy);
	$: colors = getColors(selectedEnergy);

	// Calculate required yearly additions
	// If goal has goal_path, use variable yearly requirements; otherwise use even distribution
	// Goal targets are defined in kW, so they only apply to the power metric
	$: goalInfo = (() => {
		if (!goal || data.length === 0 || metricMode !== 'power') return null;

		const currentYear = new Date().getFullYear();
		const lastEntry = data[data.length - 1];
		const currentCumulative = lastEntry?.cumulative_power_kw || 0;

		// Calculate remaining capacity
		const remainingKw = goal.target_power_kw - currentCumulative;
		if (remainingKw <= 0) return null;

		// If goal_path exists, build a map of year -> required addition
		if (goal.goal_path && goal.goal_path.length > 0) {
			const yearlyRequiredMap = new Map<number, number>();
			const path = goal.goal_path;

			for (let i = 0; i < path.length; i++) {
				const current = path[i];
				// Include all years from current year up to and including target year
				if (current.year > goal.target_year) continue;
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
		// Last year of additions is the year BEFORE the target year
		const lastAdditionYear = goal.target_year - 1;
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

	// Units "In Planung" in the selected metric
	$: plannedByYear = new Map(
		(planned?.byYear ?? []).map((p) => [p.year, metricMode === 'power' ? p.power_kw : p.units])
	);
	$: undatedPlanned = planned && planned.undated.units > 0 ? planned.undated : null;
	$: undatedValue = undatedPlanned ? (metricMode === 'power' ? undatedPlanned.power_kw : undatedPlanned.units) : 0;

	type Row = RenewablesRawData & {
		value: number;
		cumulativeValue: number;
		isGoalYear: boolean;
		goalRequired: number;
		/** Planned for this year (or, in the PLANNED_KEY row, planned without a date) */
		plannedValue: number;
	};

	// Build combined data: actual years, goal years and years with planned units,
	// plus the PLANNED_KEY row for the planned units without a (future) date
	$: combinedData = (() => {
		const rows = new Map<number, Row>();
		const emptyRow = (year: number): Row => ({
			year,
			net_power_kw: 0,
			cumulative_power_kw: 0,
			value: 0,
			cumulativeValue: 0,
			isGoalYear: false,
			goalRequired: 0,
			plannedValue: 0
		});
		const rowFor = (year: number) => {
			if (!rows.has(year)) rows.set(year, emptyRow(year));
			return rows.get(year)!;
		};

		for (const d of data) {
			rows.set(d.year, {
				...d,
				value: getYearlyValue(d, metricMode),
				cumulativeValue: getCumulativeValue(d, metricMode),
				isGoalYear: false,
				goalRequired: 0,
				plannedValue: 0
			});
		}

		if (goalInfo) {
			// Goal years: existing years, and future years with a goal value
			for (let year = goalInfo.startYear; year <= goalInfo.endYear; year++) {
				const goalRequired = goalInfo.yearlyRequiredMap
					? goalInfo.yearlyRequiredMap.get(year) || 0
					: goalInfo.yearlyRequired;
				if (rows.has(year) || goalRequired > 0 || !goalInfo.hasCustomPath) {
					const row = rowFor(year);
					row.isGoalYear = true;
					row.goalRequired = goalRequired;
				}
			}
		}

		for (const [year, value] of plannedByYear) {
			if (value > 0) rowFor(year).plannedValue = value;
		}

		const result = [...rows.values()].sort((a, b) => a.year - b.year);
		if (undatedValue > 0) result.push({ ...emptyRow(PLANNED_KEY), plannedValue: undatedValue });
		return result;
	})();

	$: yearRows = combinedData.filter((d) => d.year !== PLANNED_KEY);
	$: undatedRow = combinedData.find((d) => d.year === PLANNED_KEY) ?? null;
	$: goalBars = yearRows.filter((d) => d.isGoalYear && d.goalRequired > 0);
	$: actualBars = yearRows.filter((d) => d.value !== 0);
	// Planned units with a planned year: stacked on that year's actual Zubau
	$: plannedSegments = yearRows
		.filter((d) => d.plannedValue > 0)
		.map((d) => ({ year: d.year, base: Math.max(d.value, 0), top: Math.max(d.value, 0) + d.plannedValue }));

	// X domain includes all years
	$: xDomain = combinedData.map((d) => d.year);

	// Highest bar of the years (actual + planned for that year, goal)
	$: yearsMax = Math.max(
		...yearRows.map((d) => Math.max(d.value, Math.max(d.value, 0) + d.plannedValue, d.goalRequired)),
		0
	);
	// The planned units without a date are no yearly rate: when they would dwarf the years,
	// their bar is cut (break mark, real value in the label) so the history stays readable
	$: breakPlanned = yearsMax > 0 && undatedValue > yearsMax * 1.5;

	// Max value considers actual data, goal and planned units
	$: maxAbs = Math.max(
		...combinedData.map((d) => Math.abs(d.value)),
		yearsMax,
		breakPlanned ? 0 : undatedValue,
		1
	);

	// Y-axis max: room above the cut planned bar for its label
	$: yMax = breakPlanned ? yearsMax * 1.2 : Math.max(yearsMax, undatedValue, 1);

	$: unitsDivisor = maxAbs >= 1_000_000 ? 1_000_000 : maxAbs >= 1_000 ? 1_000 : 1;
	$: unit =
		metricMode === 'power'
			? getPowerUnit(maxAbs, selectedEnergy)
			: unitsDivisor >= 1_000_000
				? 'Mio. Anlagen'
				: unitsDivisor >= 1_000
					? 'Tsd. Anlagen'
					: 'Anlagen';
	$: yFormat = (v: number) => {
		// Small regions (e.g. biomass in a city) have sub-unit ticks like 0.2 MW: keep one decimal
		const scaled = metricMode === 'power' ? convertPowerUnit(v, maxAbs) : v / unitsDivisor;
		return formatNumber(scaled, scaled % 1 !== 0 ? 1 : 0);
	};

	$: formatValue = (v: number) =>
		metricMode === 'power' ? formatPower(v, selectedEnergy) : formatNumber(v, 0);
	$: plannedTotal = planned ? (metricMode === 'power' ? planned.total.power_kw : planned.total.units) : 0;
	$: showLegend = !!(goal && goalInfo) || plannedTotal > 0;

	// Slot scales are typed loosely by <Chart>: geometry is computed here with explicit types
	type BandScale = ((v: number) => number | undefined) & { bandwidth(): number; step(): number };
	type LinearScale = ((v: number) => number) & { domain(): number[] };

	/** Rects of the planned units with a planned year, stacked on that year's Zubau */
	function plannedSegmentRects(segments: typeof plannedSegments, xScale: any, yScale: any) {
		const xs = xScale as BandScale | null;
		const ys = yScale as LinearScale | null;
		if (!xs || !ys) return [];
		return segments.map((seg) => ({
			year: seg.year,
			x: xs(seg.year) ?? 0,
			y: ys(seg.top),
			width: xs.bandwidth(),
			height: Math.max(0, ys(seg.base) - ys(seg.top))
		}));
	}

	/**
	 * Geometry of the bar with the planned units without a (future) date: hatched shape (with a
	 * break mark, two slanted cuts, when it's cut), divider before it, label position
	 */
	function undatedBarShape(row: Row | null, cut: boolean, xScale: any, yScale: any) {
		const xs = xScale as BandScale | null;
		const ys = yScale as LinearScale | null;
		const x = row && xs ? xs(PLANNED_KEY) : undefined;
		if (!row || !xs || !ys || x == null) return null;
		const w = xs.bandwidth();
		const bottom = ys(0);
		const top = ys(cut ? ys.domain()[1] * 0.9 : row.plannedValue);
		let paths = [`M${x},${bottom}V${top}H${x + w}V${bottom}Z`];
		if (cut) {
			const yb = top + (bottom - top) * 0.22;
			const s = Math.min(3, w / 3);
			const gap = 5;
			paths = [
				`M${x},${bottom}V${yb + s}L${x + w},${yb - s}V${bottom}Z`,
				`M${x},${top}H${x + w}V${yb - s - gap}L${x},${yb + s - gap}Z`
			];
		}
		return { paths, divider: x - (xs.step() - w) / 2, labelX: x + w, labelY: top - 5 };
	}

	// Update chart data when shared data changes
	$: if (!dataLoading && data.length > 0) {
		const chartData = buildChartData(
			data,
			updateDate,
			region,
			params,
			'yearly',
			goal,
			gridOperatorCheckedRatio,
			planned
		);
		onChartData?.(chartData);
	} else if (!dataLoading && data.length === 0) {
		onChartData?.(null);
	}
</script>

<div bind:this={containerEl} class="yearly-bar-view">
	{#if dataLoading || regionLoading}
		<div class="h-72 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if data.length === 0}
		<div class="h-72 flex items-center justify-center text-gray-500">Keine Daten verfügbar</div>
	{:else}
		<Chart
			data={combinedData}
			x="year"
			y="value"
			xType="band"
			{xDomain}
			{yMax}
			height={280}
			margin={{ top: 15, right: 15, bottom: 35, left: 32 }}
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
				<!-- Hatching of planned units; dark-mode colour via CSS variables -->
				<g style="--planned: {colors.dark}; --planned-dark: {colors.light}">
					<defs>
						<pattern
							id={hatchId}
							patternUnits="userSpaceOnUse"
							width="5"
							height="5"
							patternTransform="rotate(45)"
						>
							<line x1="0" y1="0" x2="0" y2="5" class="stroke-(--planned) dark:stroke-(--planned-dark)" stroke-width="2" />
						</pattern>
					</defs>
				</g>

				<AxisY {yScale} {innerWidth} {innerHeight} format={yFormat} {unit} />
				{@const lastYear = yearRows.length > 0 ? yearRows[yearRows.length - 1].year : null}
				<AxisX
					{xScale}
					{xDomain}
					{innerWidth}
					{innerHeight}
					format={(v) => (v === PLANNED_KEY ? 'geplant' : String(v))}
					tickCount={Math.ceil(xDomain.length / 3)}
					forceTicks={undatedRow ? [PLANNED_KEY] : lastYear ? [lastYear] : []}
				/>
				<RuleY y={0} {yScale} {innerWidth} />

				<!-- Goal bars (dashed outline) - rendered first so actual bars appear on top -->
				{#if goalBars.length}
					<BarY data={goalBars} x="year" y="goalRequired" {xScale} {yScale} color={colors.light} opacity={0.4} hoverDim={false} />
					<BarY
						data={goalBars}
						x="year"
						y="goalRequired"
						{xScale}
						{yScale}
						color="none"
						stroke={colors.dark}
						strokeWidth={1.5}
						strokeDasharray="4,2"
						opacity={0.8}
						hoverDim={false}
					/>
				{/if}

				<!-- Actual data bars -->
				<BarY
					data={actualBars}
					x="year"
					y="value"
					{xScale}
					{yScale}
					{color}
					{hover}
					opacity={0.85}
					hoverOpacity={1}
					hoverDim={false}
				/>

				<!-- Planned units with a planned year, stacked on that year's Zubau -->
				{#each plannedSegmentRects(plannedSegments, xScale, yScale) as seg (seg.year)}
					<rect
						x={seg.x}
						y={seg.y}
						width={seg.width}
						height={seg.height}
						fill="url(#{hatchId})"
						stroke-width="1"
						class="stroke-(--planned) dark:stroke-(--planned-dark)"
						style="--planned: {colors.dark}; --planned-dark: {colors.light}"
					/>
				{/each}

				<!-- Planned units without a (future) date: own bar after the years -->
				{@const shape = undatedBarShape(undatedRow, breakPlanned, xScale, yScale)}
				{#if undatedRow && shape}
					<g style="--planned: {colors.dark}; --planned-dark: {colors.light}">
						<line
							x1={shape.divider}
							x2={shape.divider}
							y1={0}
							y2={innerHeight}
							stroke-dasharray="2,3"
							class="stroke-gray-400 dark:stroke-gray-500"
						/>
						{#each shape.paths as d}
							<path
								{d}
								fill="url(#{hatchId})"
								stroke-width="1.25"
								class="stroke-(--planned) dark:stroke-(--planned-dark)"
							/>
						{/each}
						<text
							x={shape.labelX}
							y={shape.labelY}
							text-anchor="end"
							stroke-width="3"
							paint-order="stroke"
							class="text-[11px] font-semibold fill-gray-800 stroke-white dark:fill-gray-100 dark:stroke-gray-900"
						>
							{formatValue(undatedRow.plannedValue)}
						</text>
					</g>
				{/if}

				<RuleX {xScale} {innerHeight} {hover} />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{@const point = combinedData.find((d) => d.year === hover.x)}
				{@const isPlannedBar = hover.x === PLANNED_KEY}
				<Tooltip
					visible={hover.x !== null}
					x={hover.clientX}
					y={hover.clientY}
					title={isPlannedBar && planned ? plannedUndatedLabel(planned) : hover.x !== null ? String(hover.x) : ''}
					items={isPlannedBar && undatedPlanned
						? [
								{ label: 'Leistung', value: formatPower(undatedPlanned.power_kw, selectedEnergy), color: colors.dark },
								{ label: 'Anlagen', value: formatNumber(undatedPlanned.units, 0) },
								...(undatedPlanned.overdueUnits > 0
									? [{ label: 'davon Termin überschritten', value: formatNumber(undatedPlanned.overdueUnits, 0) }]
									: [])
							]
						: point
							? [
									...(point.value !== 0
										? [
												{
													label: metricMode === 'power' ? 'Zubau' : 'Neu installierte Anlagen',
													value: formatValue(point.value),
													color
												}
											]
										: []),
									...(point.cumulativeValue > 0
										? [{ label: 'Kumuliert', value: formatValue(point.cumulativeValue) }]
										: []),
									...(point.plannedValue > 0
										? [{ label: 'In Planung für dieses Jahr', value: formatValue(point.plannedValue), color: colors.dark }]
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
		{#if showLegend}
			<div class="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm">
				<div class="flex items-center gap-2">
					<div class="w-4 h-3 rounded-sm" style="background: {color}"></div>
					<span>Tatsächlicher Zubau</span>
				</div>
				{#if goal && goalInfo}
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
				{/if}
				{#if planned && plannedTotal > 0}
					<div class="flex items-center gap-2" style="--planned: {colors.dark}; --planned-dark: {colors.light}">
						<svg width="16" height="12" aria-hidden="true" class="shrink-0">
							<rect x="0.5" y="0.5" width="15" height="11" fill="url(#{hatchId})" stroke-width="1" class="stroke-(--planned) dark:stroke-(--planned-dark)" />
						</svg>
						<span>
							In Planung: {formatNumber(planned.total.units, 0)}
							{planned.total.units === 1 ? 'Anlage' : 'Anlagen'} mit {formatPower(planned.total.power_kw, selectedEnergy)}
						</span>
					</div>
				{/if}
			</div>
			{#if planned && plannedTotal > 0}
				<p class="mt-2 text-xs text-gray-600 dark:text-gray-400">
					„In Planung“ heißt: im Marktstammdatenregister als geplant gemeldet, noch nicht in Betrieb.
					{#if planned.hasDates}
						Anlagen mit geplantem Inbetriebnahmejahr stehen schraffiert auf diesem Jahr; ohne oder mit
						bereits überschrittenem Termin sind sie im Balken „geplant“ zusammengefasst.
					{:else}
						Ein geplantes Inbetriebnahmejahr liegt uns für diese Anlagen nicht vor, daher sind sie im
						Balken „geplant“ ganz rechts zusammengefasst.
					{/if}
					{#if breakPlanned}
						Dieser Balken ist gekürzt dargestellt (Bruchstelle), der Wert steht darüber.
					{/if}
				</p>
			{/if}
		{/if}
	{/if}
</div>
