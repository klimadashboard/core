<script lang="ts">
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { Chart, AxisX, AxisY, BarStack, Tooltip, Legend } from '$lib/components/charts/primitives';
	import { RadioGroup } from '$lib/components/ui';
	import { formatNumber, formatPower, formatDate } from '$lib/utils/formatters';
	import { fetchData, buildChartData, type ChargingRawData } from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	const SERIES = [
		{ key: 'normal', label: 'Normalladepunkte (bis 22 kW)', color: '#F5AF4A' },
		{ key: 'fast', label: 'Schnellladepunkte (über 22 kW)', color: '#373949' }
	];

	let data: ChargingRawData | null = null;
	let loading = true;
	let error: string | null = null;
	let metric: 'points' | 'power' = 'points';
	let containerEl: HTMLElement;
	let containerWidth = 0;

	$: isMobile = containerWidth < 500;
	$: field = metric === 'points' ? 'charging_points' : 'power_kw';

	$: stackedData = (data?.series ?? []).map((d) => {
		let y0 = 0;
		const segments = SERIES.map((s) => {
			const value = d[`${field}_${s.key}` as keyof typeof d] as number;
			const seg = { key: s.key, label: s.label, value, y0, y1: y0 + value, color: s.color };
			y0 += value;
			return seg;
		});
		return { period: d.period, total: y0, segments };
	});
	$: yMax = Math.max(1, ...stackedData.map((d) => d.total)) * 1.05;

	function formatValue(v: number) {
		return metric === 'points' ? formatNumber(v) : formatPower(v);
	}

	function formatAxis(v: number) {
		if (metric === 'power') return formatPower(v);
		return v >= 10_000 ? `${formatNumber(v / 1000)}k` : formatNumber(v);
	}

	function tooltipItems(period: string | null) {
		const bar = stackedData.find((d) => d.period === period);
		if (!bar) return [];
		return [
			...bar.segments.map((s) => ({ label: s.label, value: formatValue(s.value), color: s.color })),
			{ label: 'Gesamt', value: formatValue(bar.total) }
		];
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

	$: loadData(region);
</script>

<div bind:this={containerEl} bind:clientWidth={containerWidth}>
	{#if loading}
		<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else if error}
		<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
	{:else if !data || !data.series.length}
		<div class="h-[300px] flex items-center justify-center text-gray-500">Keine Daten verfügbar</div>
	{:else}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
			<div class="rounded-xl bg-gray-50 dark:bg-gray-900 p-3">
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Ladepunkte{data.updateDate ? ` (Stand ${formatDate(data.updateDate)})` : ''}
				</p>
				<p class="text-2xl font-bold text-gray-900 dark:text-white">
					{formatNumber(data.latest.charging_points)}
				</p>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					davon {formatNumber(data.latest.charging_points_fast)} Schnelllader
				</p>
			</div>
			<div class="rounded-xl bg-gray-50 dark:bg-gray-900 p-3">
				<p class="text-sm text-gray-600 dark:text-gray-400">Ladeleistung</p>
				<p class="text-2xl font-bold text-gray-900 dark:text-white">{formatPower(data.latest.power_kw)}</p>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					+{formatNumber(data.latest.added_charging_points)} Ladepunkte seit Jahresbeginn
				</p>
			</div>
			<div class="rounded-xl bg-gray-50 dark:bg-gray-900 p-3">
				<p class="text-sm text-gray-600 dark:text-gray-400">Ladepunkte je 1.000 Einw.</p>
				<p class="text-2xl font-bold text-gray-900 dark:text-white">
					{data.perThousand != null ? formatNumber(data.perThousand, 1) : '–'}
				</p>
				{#if data.comparisons.length}
					<p class="text-sm text-gray-600 dark:text-gray-400">
						{data.comparisons.map((c) => `${c.label}: ${formatNumber(c.perThousand, 1)}`).join(' · ')}
					</p>
				{/if}
			</div>
			<div class="rounded-xl bg-gray-50 dark:bg-gray-900 p-3">
				<p class="text-sm text-gray-600 dark:text-gray-400">E-Autos je Ladepunkt</p>
				<p class="text-2xl font-bold text-gray-900 dark:text-white">
					{data.evsPerPoint != null ? formatNumber(data.evsPerPoint, 1) : '–'}
				</p>
				{#if data.electricCars}
					<p class="text-sm text-gray-600 dark:text-gray-400">
						{formatNumber(data.electricCars.value)} E-Autos ({data.electricCars.period})
					</p>
				{/if}
			</div>
		</div>

		<div class="flex flex-wrap items-center justify-between gap-2 mb-2">
			<RadioGroup
				label="Kennzahl"
				hideLabel
				bind:value={metric}
				options={[
					{ value: 'points', label: 'Ladepunkte' },
					{ value: 'power', label: 'Ladeleistung' }
				]}
			/>
			<Legend items={SERIES} />
		</div>

		<Chart
			data={stackedData}
			x="period"
			y="total"
			xType="band"
			height={300}
			yMin={0}
			{yMax}
			padding={0.25}
			margin={{ top: 15, right: isMobile ? 10 : 20, bottom: 35, left: isMobile ? 45 : 60 }}
		>
			<svelte:fragment slot="default" let:xScale let:yScale let:xDomain let:innerWidth let:innerHeight let:hover>
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
				<BarStack data={stackedData} x="period" {xScale} {yScale} {hover} radius={2} />
				<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} format={formatAxis} />
				<AxisX {xScale} {xDomain} {innerWidth} {innerHeight} format={String} tickCount={isMobile ? 4 : 12} />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				<Tooltip
					visible={hover.x !== null}
					x={hover.clientX}
					y={hover.clientY}
					title={hover.x === data.latest.period && data.updateDate
						? `Bestand am ${formatDate(data.updateDate)}`
						: `Bestand Ende ${hover.x ?? ''}`}
					items={tooltipItems(hover.x)}
				/>
			</svelte:fragment>
		</Chart>
	{/if}
</div>
