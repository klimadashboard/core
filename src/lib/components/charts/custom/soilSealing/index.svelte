<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { Chart, AxisX, AxisY, BarY, RuleY, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { formatNumber, formatPercent } from '$lib/utils/formatters';
	import { fetchData, buildChartData, NATIONAL_TARGET_HA_PER_DAY, type SoilSealingRawData } from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	const BAR_COLOR = '#B7693D';
	const TARGET_COLOR = '#4880A8';

	let data: SoilSealingRawData | null = null;
	let loading = true;
	let error: string | null = null;
	let containerWidth = 0;

	$: isMobile = containerWidth < 500;
	$: bars = (data?.series ?? []).filter((d) => d.perDay != null);
	$: values = [...bars.map((d) => d.perDay as number), data?.target ?? 0];
	$: yMax = Math.max(0.1, ...values) * 1.15;
	$: yMin = Math.min(0, ...values);

	$: legendItems = [
		{ key: 'perDay', label: 'Zuwachs pro Tag', color: BAR_COLOR },
		...(data?.target != null
			? [{ key: 'target', label: `Anteil am 30-ha-Ziel (nach Einwohnern)`, color: TARGET_COLOR, dashed: true }]
			: [])
	];

	const ha = (v: number, decimals = 1) => `${formatNumber(v, decimals)} ha`;

	function tooltipItems(period: string | null) {
		const row = bars.find((d) => d.period === period);
		if (!row) return [];
		return [
			{ label: 'Zuwachs pro Tag', value: ha(row.perDay as number), color: BAR_COLOR },
			{ label: `Zuwachs im Jahr ${row.period}`, value: ha(row.added as number, 0) },
			...(data?.target != null
				? [{ label: 'Zielwert pro Tag', value: ha(data.target), color: TARGET_COLOR }]
				: [])
		];
	}

	async function loadData(r: Region | null) {
		loading = true;
		error = null;
		try {
			data = await fetchData(r);
			onChartData?.(data ? buildChartData(data, r) : null);
		} catch (e) {
			console.error('[SoilSealing] Error:', e);
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
			data = null;
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	$: loadData(region);
</script>

<div bind:clientWidth={containerWidth}>
	{#if loading}
		<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
	{:else if !data || !bars.length}
		<div class="h-[300px] flex items-center justify-center text-gray-500">Keine Daten verfügbar</div>
	{:else}
		<div class="grid grid-cols-2 gap-2 mb-4">
			<div class="rounded-xl bg-gray-50 dark:bg-gray-900 p-3">
				<p class="text-sm text-gray-600 dark:text-gray-400">Zuwachs pro Tag ({data.latest.period})</p>
				<p class="text-2xl font-bold text-gray-900 dark:text-white">
					{data.latest.perDay != null ? ha(data.latest.perDay) : '–'}
				</p>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Ø {data.firstYear}–{data.latest.period}: {ha(data.averagePerDay)}
				</p>
			</div>
			<div class="rounded-xl bg-gray-50 dark:bg-gray-900 p-3">
				<p class="text-sm text-gray-600 dark:text-gray-400">Zielwert pro Tag</p>
				<p class="text-2xl font-bold text-gray-900 dark:text-white">
					{data.target != null ? ha(data.target) : '–'}
				</p>
				{#if data.populationShare != null}
					<p class="text-sm text-gray-600 dark:text-gray-400">
						{formatPercent(data.populationShare * 100, 1)} der Einwohner:innen × {NATIONAL_TARGET_HA_PER_DAY} ha
					</p>
				{/if}
			</div>
			<div class="rounded-xl bg-gray-50 dark:bg-gray-900 p-3 col-span-2">
				<p class="text-sm text-gray-600 dark:text-gray-400">Siedlungs- und Verkehrsfläche ({data.latest.period})</p>
				<p class="text-2xl font-bold text-gray-900 dark:text-white">{ha(data.latest.suv, 0)}</p>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					{formatPercent(data.suvShare, 1)} der Gesamtfläche
				</p>
			</div>
		</div>

		<div class="mb-2">
			<Legend items={legendItems} />
		</div>

		<Chart
			data={bars}
			x="period"
			y="perDay"
			xType="band"
			height={260}
			{yMin}
			{yMax}
			padding={0.25}
			margin={{ top: 15, right: isMobile ? 10 : 20, bottom: 35, left: isMobile ? 40 : 50 }}
		>
			<svelte:fragment slot="default" let:xScale let:yScale let:xDomain let:innerWidth let:innerHeight let:hover>
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
				<BarY data={bars} x="period" y="perDay" {xScale} {yScale} {hover} color={BAR_COLOR} />
				{#if data.target != null}
					<RuleY y={data.target} {yScale} {innerWidth} stroke={TARGET_COLOR} strokeWidth={2} strokeDasharray="6 4" />
					<text
						x={innerWidth}
						y={(yScale?.(data.target) ?? 0) - 6}
						text-anchor="end"
						class="text-xs fill-gray-700 dark:fill-gray-300"
					>
						Ziel: {ha(data.target)}/Tag
					</text>
				{/if}
				<AxisY
					mode="labels"
					{yScale}
					{innerWidth}
					{innerHeight}
					format={(v) => formatNumber(v, 1)}
					unit="ha/Tag"
				/>
				<AxisX {xScale} {xDomain} {innerWidth} {innerHeight} format={String} tickCount={isMobile ? 4 : 12} />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				<Tooltip
					visible={hover.x !== null}
					x={hover.clientX}
					y={hover.clientY}
					title={`Jahr ${hover.x ?? ''}`}
					items={tooltipItems(hover.x)}
				/>
			</svelte:fragment>
		</Chart>
	{/if}
</div>
