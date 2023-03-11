<script>
	import ChartAxes from './ChartAxes.svelte';

	import { scaleLinear } from 'd3-scale';
	export let selectedYear;
	export let total1990;
	export let ksgSelection;
	export let crfSelection;
	export let years;
	export let sectorlyData;

	let chartHeight = 500;
	let chartWidth = 1000;
	$: baseline = chartHeight - 60;
	$: console.log(chartWidth, chartHeight);

	$: yAxisScale = ksgSelection == null ? (total1990 * 1.5) / 1000000 : (total1990 * 1.5) / 1000000;
	$: yAxisMax = years.reduce((max, y, yi) => Math.max(max, ksgSectorSum(0, yi)), 0);

	$: yScale = scaleLinear()
		.domain([0, yAxisMax * 1.3])
		.range([0, chartHeight]);

	$: ksgTooltip = null;
	$: crfTooltip = null;
	$: mouse = null;

	$: ksgSectorSum = (s, yi) => {
		if (crfSelection != null) return sectorlyData[ksgSelection].sectors[crfSelection].absolute[yi];
		if (ksgSelection != null) return sectorlyData[ksgSelection].absolute[yi];
		return sectorlyData
			.slice(0, sectorlyData.length - s)
			.reduce((sum, entry) => sum + entry.absolute[yi], 0);
	};
</script>

{#if sectorlyData}
	<div class="basis-[400px]" style="background: rgba(0,0,0,0.1)">
		<svg viewBox="0 0 {chartWidth} {chartHeight}">
			<!-- <ChartAxes
				width={1000}
				{height}
				xAxisInterval={5}
				unit={'Mio t CO2eq'}
				xAxisValues={years}
				yAxisMax={100}
			/> -->
			{#each [...sectorlyData].reverse() as ksgSector, s}
				{#if ksgSelection == null || ksgSelection == sectorlyData.length - 1 - s}
					{@const path = ksgSector.absolute
						.map((year, yi) => {
							const sum = ksgSectorSum(s, yi);
							const x = 15 + yi * 30;
							const y = yScale(sum);
							return [yi == 0 ? 'M' : 'L', x, baseline - y];
						})
						.concat([
							'L',
							15 + (ksgSector.absolute.length - 1) * 30,
							baseline,
							'L',
							15,
							baseline,
							'Z'
						])
						.flat()
						.join(' ')}
					<path
						d={path}
						style="transition: fill 0.3s ease-in-out; fill: {ksgTooltip == ksgSector
							? ksgSector.colorCodeHighlight
							: ksgSector.colorCode}"
						on:mousemove={(e) => {
							if (ksgSelection != null) return;
							mouse = { x: e.layerX, y: e.layerY };
							ksgTooltip = ksgSector;
						}}
						on:mousedown|stopPropagation={() => {
							ksgSelection = sectorlyData.length - 1 - s;
							ksgTooltip = null;
						}}
						class="cursor-pointer"
					/>

					<!-- biggest CRF Lines? -->
					{#each ksgSector.sectors as crfSector, c}
						{#if crfSelection == null || crfSelection == c}
							{@const crfPath = crfSector.absolute
								.map((year, yi) => {
									const sum =
										ksgSectorSum(s, yi) -
										ksgSector.sectors
											.slice(0, ksgSector.sectors.length - c - 1)
											.reduce((sum, entry) => sum + entry.absolute[yi], 0);
									const x = 15 + yi * 30;
									const y = yScale(sum);
									return [yi ? 'L' : 'M', x, baseline - y];
								})
								.concat([
									'L',
									15 + (ksgSector.absolute.length - 1) * 30,
									baseline,
									'L',
									15,
									baseline,
									'Z'
								])
								.flat()
								.join(' ')}
							<path d={crfPath} fill="none" stroke="#ffffff66" stroke-width="0.5" />
						{/if}
					{/each}

					<!-- Dots -->
					<!-- {#each ksgSector.absolute as year, yi}
						{@const sum = sectorlyData
							.slice(0, sectorlyData.length - s)
							.reduce((sum, entry) => sum + entry.absolute[yi], 0)}
						{@const x = 15 + yi * 30}
						{@const y = yScale(sum)}
						<circle r="3" cx={x} cy={baseline - y} />
					{/each} -->
				{/if}
			{/each}
		</svg>
		<!-- {#if ksgTooltip}
			<div class="absolute bg-white rounded p-4" style="top: {mouse.y}px; left: {mouse.x}px;">
				<h4><strong>{ksgTooltip.label}</strong></h4>
			</div>
		{/if} -->
		<!-- {#if crfTooltip}
			<div
				class="absolute bg-white rounded p-4 max-w-prose"
				style="top: {mouse.y}px; left: {mouse.x}px;"
			>
				<h4><strong>{crfTooltip.label}</strong></h4>
				<strong>{crfTooltip.absolute.toFixed(3).replace('.', ',')} Mt CO2eq</strong>
				<p>{crfTooltip.explanation}</p>
			</div>
		{/if} -->
	</div>
{/if}
