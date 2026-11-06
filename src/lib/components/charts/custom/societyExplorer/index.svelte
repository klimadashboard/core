<script lang="ts">
	import { Chart, AxisX, AxisY, Line } from '$lib/components/charts/primitives';
	import { formatNumber } from '$lib/utils/formatters';

	// Placeholder data – replace with real data loading
	const bars = [
		{ label: 'Klimakrise', value: 50, color: '#4880A8' },
		{ label: 'Sicherheit', value: 20, color: '#65987D' },
		{ label: 'Wohlbefinden', value: 30, color: '#BD3737' }
	];

	const series = [
		{ date: new Date('2025-01-01'), value: 50 },
		{ date: new Date('2025-01-02'), value: 20 },
		{ date: new Date('2025-01-03'), value: 30 }
	].map((d) => ({ ...d, timestamp: d.date.getTime() }));

	$: maxBar = Math.max(...bars.map((b) => b.value), 1);
	$: xMin = Math.min(...series.map((d) => d.timestamp));
	$: xMax = Math.max(...series.map((d) => d.timestamp));
	$: yMax = Math.max(...series.map((d) => d.value)) * 1.1;

	let selectedBar: (typeof bars)[number] | null = null;
</script>

<div class="flex flex-col gap-8">
	{#if !bars.length && !series.length}
		<div class="h-[300px] flex items-center justify-center text-gray-500">
			Keine Daten verfügbar
		</div>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each bars as bar}
				<li
					class="grid grid-cols-[8rem_1fr_3rem] items-center gap-2 text-sm text-gray-800 dark:text-gray-200"
					on:mouseenter={() => (selectedBar = bar)}
					on:mouseleave={() => (selectedBar = null)}
				>
					<span>{bar.label}</span>
					<span class="h-6 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
						<span
							class="block h-full rounded {selectedBar && selectedBar !== bar ? 'opacity-50' : ''}"
							style="width: {(bar.value / maxBar) * 100}%; background-color: {bar.color}"
						></span>
					</span>
					<span class="text-right tabular-nums">{formatNumber(bar.value, 0)}</span>
				</li>
			{/each}
		</ul>

		<Chart data={series} x="timestamp" y="value" xType="linear" height={300} yMin={0} {yMax}>
			<svelte:fragment slot="default" let:xScale let:yScale let:innerWidth let:innerHeight let:hover>
				<AxisY mode="grid" {yScale} {innerWidth} {innerHeight} />
				<AxisX
					{xScale}
					xDomain={[xMin, xMax]}
					{innerWidth}
					{innerHeight}
					format={(t) => new Date(t).toLocaleDateString('de-DE')}
					tickCount={0}
					forceTicks={series.map((d) => d.timestamp)}
				/>
				<Line
					data={series}
					x="timestamp"
					y="value"
					{xScale}
					{yScale}
					stroke="#4880A8"
					strokeWidth={2}
					{hover}
				/>
				<AxisY mode="labels" {yScale} {innerWidth} {innerHeight} />
			</svelte:fragment>
		</Chart>
	{/if}
</div>
