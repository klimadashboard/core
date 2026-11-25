<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import {
		Chart,
		AxisX,
		AxisY,
		Area,
		BarStack,
		Line,
		Tooltip,
		Legend
	} from '$lib/components/charts/primitives';
	import Switch from '$lib/components/Switch.svelte';
	import { IconTargetArrow } from '@tabler/icons-svelte-runes';
	import { formatNumber, formatDate } from '$lib/utils/formatters';
	import ChartSettings from '$lib/components/charts/ChartSettings.svelte';
	import RegionDrilldown from '$lib/components/charts/RegionDrilldown.svelte';
	import { fetchRegion } from '$lib/utils/getRegion';
	import type { ContextRegion } from '$lib/utils/regionContext';
	import { hasDrilldown } from '$lib/utils/regionTree';
	import {
		fetchData,
		buildChartData,
		buildChargingGoal,
		CHARGING_CLASSES,
		GOAL_COLOR,
		GOAL_FILL_OPACITY,
		TARGET_PER_1000,
		type ChargingRawData
	} from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// Stacked bottom → top: NLP, SLP, HPC (power per charging point)
	const SERIES = CHARGING_CLASSES;

	let data: ChargingRawData | null = null;
	let loading = true;
	let error: string | null = null;
	let containerWidth = 0;
	// The 2030 goal path is hidden by default; the checkbox shows it
	let showGoal = false;

	// Yearly Zubau (bars) or the running total built from it (stacked areas, as in the storage charts)
	let view: 'yearly' | 'cumulative' = 'yearly';
	const viewOptions = [
		{
			key: 'yearly',
			label: 'Jährlicher Zubau',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`
		},
		{
			key: 'cumulative',
			label: 'Kumulativ',
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`
		}
	];

	$: isMobile = containerWidth < 500;

	// Region shown in the chart: the card's region, or a member picked in the RegionDrilldown
	// (the switcher only appears for aggregate regions such as a Metropolregion)
	let switchedRegion: Region | null = null;
	let switcherFor: string | null = null;
	$: if (region?.id !== switcherFor) {
		switcherFor = region?.id ?? null;
		switchedRegion = null;
	}
	$: activeRegion = switchedRegion ?? region;

	// Only offer the dropdown (and its settings row) where there is something to drill into
	let drillable = false;
	$: hasDrilldown(region, 'districts').then((v) => (drillable = v));

	async function selectRegion(r: ContextRegion) {
		if (r.id === region?.id) switchedRegion = null;
		else switchedRegion = (await fetchRegion(r.id)) ?? switchedRegion;
	}

	// Charging points by year of commissioning and class, from the Ladesäulenregister
	$: zubau = data?.zubau ?? [];
	$: goal = data ? buildChargingGoal(data, activeRegion) : null;
	$: goalYears =
		goal && showGoal
			? Array.from({ length: goal.endYear - goal.startYear + 1 }, (_, i) => goal!.startYear + i)
			: [];

	$: stackedData = zubau.map((d) => {
		let y0 = 0;
		const segments = SERIES.map((s) => {
			const value = d[s.key];
			const seg = { key: s.key, label: s.label, value, y0, y1: y0 + value, color: s.color };
			y0 += value;
			return seg;
		});
		return { period: d.period, total: y0, segments };
	});
	// Goal years without Zubau yet still need an x band
	$: chartRows = [
		...stackedData,
		...goalYears
			.filter((y) => !stackedData.some((d) => d.period === y))
			.map((y) => ({ period: y, total: 0, segments: [] }))
	].sort((a, b) => a.period - b.period);
	$: yMax =
		Math.max(1, ...stackedData.map((d) => d.total), goalYears.length && goal ? goal.perYear : 0) * 1.05;
	$: unitDivisor = yMax >= 10_000 ? 1000 : 1;

	// Cumulative: running total per class (charging points commissioned so far and still in
	// operation), stacked bottom → top like the bars
	$: cumulativeRows = (() => {
		const sums: Record<string, number> = Object.fromEntries(SERIES.map((s) => [s.key, 0]));
		return zubau.map((d) => {
			for (const s of SERIES) sums[s.key] += d[s.key];
			return { year: d.period, ...sums };
		});
	})();
	$: cumulativeSeries = SERIES.map((s, i) => ({
		...s,
		points: cumulativeRows.map((r: any) => {
			const y0 = SERIES.slice(0, i).reduce((sum, b) => sum + r[b.key], 0);
			return { year: r.year as number, y0, y1: y0 + r[s.key], value: r[s.key] as number };
		})
	}));
	$: cumulativeTotals = cumulativeRows.map((r: any) => ({
		year: r.year as number,
		total: SERIES.reduce((sum, s) => sum + r[s.key], 0)
	}));
	// Goal as a stock path: from the stock at the end of startYear − 1 to the target
	$: goalLine =
		goal && showGoal
			? [
					{ year: goal.startYear - 1, value: goal.baseStock },
					{ year: goal.endYear, value: goal.target }
				]
			: [];
	$: cumYears = [...cumulativeTotals.map((d) => d.year), ...goalLine.map((d) => d.year)];
	$: cumYMax =
		Math.max(1, ...cumulativeTotals.map((d) => d.total), ...goalLine.map((d) => d.value)) * 1.05;
	$: cumDivisor = cumYMax >= 10_000 ? 1000 : 1;
	const closestIndex = (x: number) =>
		cumulativeTotals.reduce(
			(best, d, i) => (Math.abs(d.year - x) < Math.abs(cumulativeTotals[best].year - x) ? i : best),
			0
		);

	function cumulativeTooltipItems(x: number | null) {
		if (x == null || !cumulativeTotals.length) return [];
		const i = closestIndex(x);
		return [
			...[...cumulativeSeries]
				.reverse()
				.map((s) => ({ label: s.label, value: formatNumber(s.points[i].value), color: s.color })),
			{ label: 'Gesamt', value: formatNumber(cumulativeTotals[i].total) }
		];
	}

	function formatAxis(v: number) {
		return unitDivisor > 1 ? formatNumber(v / unitDivisor, v % unitDivisor ? 1 : 0) : formatNumber(v);
	}

	function tooltipTitle(period: number | null) {
		const row = zubau.find((d) => d.period === period);
		if (period == null) return '';
		if (row?.partial && data?.zubauUpdateDate)
			return `Zubau ${period} (bis ${formatDate(data.zubauUpdateDate)})`;
		return `Zubau ${period}`;
	}

	function tooltipItems(period: number | null) {
		const row = zubau.find((d) => d.period === period);
		const items: Array<{ label: string; value: string; color?: string }> = [];
		if (row) {
			for (const s of [...SERIES].reverse())
				items.push({ label: s.label, value: formatNumber(row[s.key]), color: s.color });
			items.push({ label: 'Gesamt', value: formatNumber(row.total) });
		}
		if (goal && period != null && goalYears.includes(period)) {
			items.push({ label: 'Jahresziel', value: formatNumber(Math.round(goal.perYear)), color: GOAL_COLOR });
			if (row && goal.perYear > 0) {
				const share = Math.max(0, row.total) / goal.perYear;
				items.push({
					label: 'Jahresziel erreicht',
					value: `${share > 0 && share < 0.01 ? '< 1' : formatNumber(Math.round(share * 100))} %`
				});
			}
		}
		return items;
	}

	async function loadData(r: Region | null) {
		loading = true;
		error = null;
		try {
			data = await fetchData(r);
			onChartData?.(data ? buildChartData(data, r) : null);
		} catch (e) {
			console.error('[ChargingInfrastructure] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			data = null;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	$: loadData(activeRegion);
</script>

<div bind:clientWidth={containerWidth}>
	<!-- Outside the loading state so focus stays on the controls while the data reloads -->
	{#if goal || drillable || zubau.length}
		<ChartSettings>
			{#if zubau.length}
				<Switch views={viewOptions} activeView={view} on:itemClick={(e) => (view = e.detail)} />
			{/if}
			<!-- One row: region drill-down (to a Kreis of the card's region), then the goal toggle -->
			<div class="order-last flex w-full flex-wrap items-center gap-x-4 gap-y-2">
				{#if drillable}
					<RegionDrilldown {region} activeId={activeRegion?.id ?? null} onSelect={selectRegion} depth="districts" />
				{/if}
				{#if goal}
					<label
						class="inline-flex items-center gap-1.5 cursor-pointer select-none text-sm text-gray-700 dark:text-gray-300"
					>
						<IconTargetArrow size={18} stroke={2} aria-hidden="true" class="shrink-0" />
						<span>{goal.targetYear}-Ziel</span>
						<input
							type="checkbox"
							bind:checked={showGoal}
							class="ml-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
						/>
					</label>
				{/if}
			</div>
		</ChartSettings>
	{/if}

	{#if loading}
		<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
	{:else if !data || !zubau.length}
		<div class="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
			Keine Daten verfügbar
		</div>
	{:else}
		{#if view === 'cumulative'}
		<!-- Running total as stacked areas, like the storage charts' cumulative view -->
		<Chart
			data={cumYears.map((year) => ({ year, value: 0 }))}
			x="year"
			y="value"
			xType="linear"
			height={300}
			yMin={0}
			yMax={cumYMax / cumDivisor}
			margin={{ top: 15, right: isMobile ? 10 : 20, bottom: 35, left: isMobile ? 40 : 55 }}
		>
			<svelte:fragment slot="default" let:xScale let:yScale let:innerWidth let:innerHeight let:hover>
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
				{#each cumulativeSeries as s (s.key)}
					<Area
						data={s.points.map((p) => ({ year: p.year, y0: p.y0 / cumDivisor, y1: p.y1 / cumDivisor }))}
						x="year"
						y0Field="y0"
						y1Field="y1"
						color={s.color}
						opacity={0.75}
						curve="linear"
						{xScale}
						{yScale}
					/>
				{/each}
				{#each cumulativeSeries as s (s.key)}
					{#if s.points.length > 1}
						<Line
							data={s.points.map((p) => ({ year: p.year, y1: p.y1 / cumDivisor }))}
							x="year"
							y="y1"
							stroke={s.color}
							strokeWidth={1.5}
							{xScale}
							{yScale}
						/>
					{/if}
				{/each}
				{#if goalLine.length}
					<Line
						data={goalLine.map((d) => ({ year: d.year, value: d.value / cumDivisor }))}
						x="year"
						y="value"
						stroke={GOAL_COLOR}
						strokeWidth={2}
						strokeDasharray="5,4"
						{xScale}
						{yScale}
					/>
				{/if}
				<!-- Hover: vertical line and the stacked edges of the closest year -->
				{#if hover.x !== null && cumulativeTotals.length}
					{@const i = closestIndex(hover.x)}
					{@const sx = (xScale as any)(cumulativeTotals[i].year)}
					<line
						x1={sx}
						x2={sx}
						y1={0}
						y2={innerHeight}
						stroke="currentColor"
						stroke-dasharray="4 2"
						opacity="0.4"
						class="pointer-events-none text-gray-500"
					/>
					{#each cumulativeSeries as s (s.key)}
						{#if s.points[i].value > 0}
							<circle
								cx={sx}
								cy={(yScale as any)(s.points[i].y1 / cumDivisor)}
								r="4"
								fill={s.color}
								stroke="white"
								stroke-width="1.5"
								class="pointer-events-none"
							/>
						{/if}
					{/each}
				{/if}
				<AxisY
					mode="labels"
					{yScale}
					{innerWidth}
					{innerHeight}
					format={(v) => formatNumber(v, v % 1 ? 1 : 0)}
					unit={cumDivisor > 1 ? 'Tsd' : ''}
				/>
				<AxisX
					{xScale}
					xDomain={[]}
					{innerWidth}
					{innerHeight}
					format={String}
					tickCount={0}
					forceTicks={cumYears.filter((y, i) => !isMobile || i % 2 === 0 || i === cumYears.length - 1)}
				/>
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				<Tooltip
					visible={hover.x !== null}
					x={hover.clientX}
					y={hover.clientY}
					title={hover.x !== null && cumulativeTotals.length
						? `Bestand ${cumulativeTotals[closestIndex(hover.x)].year}`
						: ''}
					items={cumulativeTooltipItems(hover.x)}
				/>
			</svelte:fragment>
		</Chart>
	{:else}
		<Chart
			data={chartRows}
			x="period"
			y="total"
			xType="band"
			height={300}
			yMin={0}
			{yMax}
			padding={0.25}
			margin={{ top: 15, right: isMobile ? 10 : 20, bottom: 35, left: isMobile ? 40 : 55 }}
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
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
				<!-- Goal path: drawn first so the actual Zubau of the current year sits on top -->
				{#if goal}
					{#each goalYears as year (year)}
						{@const gx = (xScale as any)(year)}
						{@const gw = (xScale as any).bandwidth?.() ?? 20}
						{@const top = (yScale as any)(goal.perYear)}
						{#if gx !== undefined}
							<rect
								x={gx}
								y={top}
								width={gw}
								height={(yScale as any)(0) - top}
								fill={GOAL_COLOR}
								fill-opacity={GOAL_FILL_OPACITY}
								stroke={GOAL_COLOR}
								stroke-width="1.5"
								stroke-dasharray="4,3"
								opacity={hover.x !== null && hover.x !== year ? 0.5 : 1}
							/>
						{/if}
					{/each}
				{/if}
				<BarStack data={stackedData} x="period" {xScale} {yScale} {hover} radius={2} />
				<AxisY
					mode="labels"
					{yScale}
					{innerWidth}
					{innerHeight}
					format={formatAxis}
					unit={unitDivisor > 1 ? 'Tsd' : ''}
				/>
				<AxisX
					{xScale}
					{xDomain}
					{innerWidth}
					{innerHeight}
					format={String}
					tickCount={isMobile ? Math.ceil(xDomain.length / 2) : xDomain.length}
				/>
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				<Tooltip
					visible={hover.x !== null}
					x={hover.clientX}
					y={hover.clientY}
					title={tooltipTitle(hover.x)}
					items={tooltipItems(hover.x)}
				/>
			</svelte:fragment>
		</Chart>
		{/if}

		<!-- Legend: the goal swatch repeats the mark (dashed bar or dashed line), so it never relies on colour alone -->
		<div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
			<Legend items={[...SERIES]} />
			{#if goal && showGoal}
				<span class="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
					<svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true" class="flex-shrink-0">
						{#if view === 'cumulative'}
							<line x1="0" y1="6" x2="16" y2="6" stroke={GOAL_COLOR} stroke-width="2" stroke-dasharray="5,3" />
						{:else}
							<rect
								x="0.75"
								y="0.75"
								width="14.5"
								height="10.5"
								rx="1.5"
								fill={GOAL_COLOR}
								fill-opacity={GOAL_FILL_OPACITY}
								stroke={GOAL_COLOR}
								stroke-width="1.5"
								stroke-dasharray="3,2"
							/>
						{/if}
					</svg>
					Zielpfad bis {goal.targetYear}
				</span>
			{/if}
		</div>

		{#if goal && showGoal}
			<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
				Die Bundesregierung strebt laut dem Masterplan Ladeinfrastruktur II bis {goal.targetYear} eine Million
				öffentliche Ladepunkte an.
				{#if goal.population}
					Auf {activeRegion?.name ?? 'die Region'} ({formatNumber(goal.population)} Einwohner:in) umgelegt, mit {formatNumber(
						TARGET_PER_1000,
						1
					)} Ladepunkten pro 1.000 Einwohner:in, ergibt das ein Ziel von {formatNumber(goal.target)} Ladepunkten.
				{/if}
				Der Zielpfad verteilt die ab dem 31.12.{goal.startYear - 1} fehlenden {formatNumber(goal.remaining)} Ladepunkte
				gleichmäßig auf {goal.startYear}–{goal.endYear} ({formatNumber(Math.round(goal.perYear))} pro Jahr).
			</p>
		{/if}
	{/if}
</div>
