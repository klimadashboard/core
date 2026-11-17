<script lang="ts">
	import { onMount } from 'svelte';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import { Chart, AxisX, AxisY, Tooltip } from '$lib/components/charts/primitives';
	import { formatNumber, formatPercent } from '$lib/utils/formatters';
	import { loadIncidents, buildShares, buildChartData, type YearShare } from './config';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	let loading = true;
	let error: string | null = null;
	let data: YearShare[] = [];
	let containerWidth = 0;

	const COLOR = '#2171b5';
	const CURRENT_YEAR = Number(
		new Intl.DateTimeFormat('en', { timeZone: 'Europe/Vienna', year: 'numeric' }).format(new Date())
	);

	$: isMobile = containerWidth > 0 && containerWidth < 500;
	$: margin = { top: 20, right: isMobile ? 8 : 20, bottom: 30, left: isMobile ? 40 : 55 };

	// Chart's slot props type the scales as a band/linear/null union; this chart
	// always uses a band x scale and a linear y scale.
	function px(scale: any, value: number): number {
		return scale(value);
	}

	onMount(async () => {
		try {
			data = buildShares(await loadIncidents(fetch));
			loading = false;
			onChartData?.(buildChartData(data));
		} catch (e) {
			console.error('tramParkingGeocoded error:', e);
			error = e instanceof Error ? e.message : String(e);
			loading = false;
			onChartData?.(null);
		}
	});
</script>

{#if loading}
	<div class="h-[300px] bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
{:else if error}
	<div class="h-[300px] flex items-center justify-center text-red-500">{error}</div>
{:else if !data.length}
	<div class="h-[300px] flex items-center justify-center text-gray-500">Keine Daten verfügbar</div>
{:else}
	<div bind:clientWidth={containerWidth}>
		<Chart {data} x="year" y="share" xType="band" height={300} {margin} yMin={0} yMax={100}>
			<svelte:fragment let:xScale let:yScale let:xDomain let:innerWidth let:innerHeight let:hover>
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />

				<!-- bars + value labels drawn here instead of <BarY>: BarY computes its x
				     position in a non-reactive helper and keeps stale positions on resize -->
				{#if xScale && yScale}
					{#each data as d}
						<rect
							x={px(xScale, d.year)}
							y={px(yScale, d.share)}
							width={(xScale as any).bandwidth()}
							height={px(yScale, 0) - px(yScale, d.share)}
							fill={COLOR}
							opacity={hover.x != null && hover.x !== d.year ? 0.4 : 1}
							class="transition-opacity duration-100"
						/>
						<text
							x={px(xScale, d.year) + (xScale as any).bandwidth() / 2}
							y={px(yScale, d.share) - 5}
							text-anchor="middle"
							class="text-[11px] sm:text-xs fill-gray-700 dark:fill-gray-300"
							>{formatNumber(d.share, 0)}{isMobile ? '' : ' %'}</text
						>
					{/each}
				{/if}

				<AxisX
					{xScale}
					{xDomain}
					{innerWidth}
					{innerHeight}
					tickCount={data.length}
					format={(v) => (v === CURRENT_YEAR ? `${v}*` : String(v))}
				/>
				<AxisY
					mode="labels"
					{yScale}
					{innerWidth}
					{innerHeight}
					format={(v) => formatNumber(v, 0)}
					unit="%"
				/>
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{@const d = data.find((r) => r.year === hover.x)}
				<Tooltip
					visible={!!d}
					x={hover.clientX}
					y={hover.clientY}
					title={d ? (d.year === CURRENT_YEAR ? `${d.year} (bis heute)` : String(d.year)) : ''}
					items={d
						? [
								{ label: 'Anteil verortet', value: formatPercent(d.share, 1), color: COLOR },
								{
									label: 'Verortet',
									value: `${formatNumber(d.geocoded, 0)} von ${formatNumber(d.total, 0)} Vorfällen`
								}
							]
						: []}
				/>
			</svelte:fragment>
		</Chart>
	</div>
	{#if data.some((d) => d.year === CURRENT_YEAR)}
		<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">* {CURRENT_YEAR}: laufendes Jahr</p>
	{/if}
{/if}
