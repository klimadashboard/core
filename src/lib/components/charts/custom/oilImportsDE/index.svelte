<script lang="ts">
	import { Chart, AxisX, AxisY, Line, Tooltip } from '$lib/components/charts/primitives';
	import { formatNumber } from '$lib/utils/formatters';
	import type { ChartData } from '$lib/components/charts/types';
	import type { Region } from '$lib/utils/getRegion';
	import Papa from 'papaparse';

	export let region: Region | null = null;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	let rawData;
	let containerWidth = 0;

	function formatTonnen(v: number): string {
		if (v >= 1_000_000) return formatNumber(v / 1_000_000, 0) + ' Mio';
		if (v >= 1_000) return formatNumber(v / 1_000, 0) + ' Tsd';
		return formatNumber(v, 0);
	}

	Papa.parse('https://data.klimadashboard.org/de/energy/fossil/oil_imports-destatis.csv', {
		download: true,
		dynamicTyping: true,
		header: true,
		skipEmptyLines: true,
		complete(results) {
			if (!results?.data?.length) {
				onChartData?.(null);
				return;
			}
			rawData = results.data.sort((a, b) => a.Jahr - b.Jahr);
			const last = rawData[rawData.length - 1];
			const peak = rawData.reduce((max, d) => (d.Tonnen > max.Tonnen ? d : max), rawData[0]);
			onChartData?.({
				raw: rawData,
				table: {
					columns: [
						{ key: 'Jahr', label: 'Jahr', align: 'left' },
						{ key: 'Tonnen', label: 'Importe (t)', align: 'right', format: (v) => (typeof v === 'number' ? formatTonnen(v) : '–') }
					],
					rows: rawData,
					filename: 'oel_importe_de'
				},
				placeholders: {
					lastYear: String(last.Jahr),
					lastValue: formatTonnen(last.Tonnen),
					peakYear: String(peak.Jahr),
					peakValue: formatTonnen(peak.Tonnen)
				},
				meta: { source: 'Destatis', region }
			});
		}
	});

	$: data = rawData?.map((e, i) => ({ ...e, x: i, label: String(e.Jahr) })) ?? [];
	$: margin = { top: 10, right: 20, bottom: 35, left: containerWidth < 500 ? 50 : 65 };
</script>

<div bind:clientWidth={containerWidth} class="h-80">
	{#if !data.length}
		<div class="h-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
	{:else}
		<Chart {data} x="x" y="Tonnen" height={320} yMin={0} {margin}>
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
				<AxisX
					{xScale}
					{xDomain}
					{innerWidth}
					{innerHeight}
					format={(v) => data[Math.round(v)]?.label ?? ''}
					tickCount={6}
				/>
				<Line
					{data}
					x="x"
					y="Tonnen"
					{xScale}
					{yScale}
					stroke="#575C75"
					strokeWidth={2}
					{hover}
				/>
				<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} format={formatTonnen} unit="t" />
			</svelte:fragment>

			<svelte:fragment slot="tooltip" let:hover>
				{#if hover.x !== null}
					{@const pt = data.find((d) => d.x === hover.x)}
					{#if pt}
						<Tooltip
							visible
							x={hover.clientX}
							y={hover.clientY}
							title={pt.label}
							items={[{ label: 'Importe', value: formatTonnen(pt.Tonnen) + ' t', color: '#575C75' }]}
						/>
					{/if}
				{/if}
			</svelte:fragment>
		</Chart>
	{/if}
</div>
