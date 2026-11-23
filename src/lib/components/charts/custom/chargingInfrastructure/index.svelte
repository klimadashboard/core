<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { Chart, AxisX, AxisY, BarStack, Tooltip, Legend } from '$lib/components/charts/primitives';
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
	// The 2030 goal path is shown by default; the checkbox hides it
	let showGoal = true;

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
	{#if goal || drillable}
		<ChartSettings>
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
			{#if drillable}
				<!-- Region: drill down to a Kreis of the card's region (own row, after the chart's controls) -->
				<div class="order-last flex w-full flex-wrap items-center gap-x-4 gap-y-2">
					<RegionDrilldown {region} activeId={activeRegion?.id ?? null} onSelect={selectRegion} depth="districts" />
				</div>
			{/if}
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

		<!-- Legend: the goal swatch repeats the bar style (fill + dashed outline), so it never relies on colour alone -->
		<div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
			<Legend items={[...SERIES]} />
			{#if goal && showGoal}
				<span class="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
					<svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true" class="flex-shrink-0">
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
