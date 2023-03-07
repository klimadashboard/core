<script>
	import ChartAxes from './ChartAxes.svelte';

	import { scaleLinear } from 'd3-scale';
	export let explanations;
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

	$: yAxisScale = ksgSelection == null ? (total1990 * 1.5) / 1000000 : (total1990 * 0.5) / 1000000;

	$: yScale = scaleLinear().domain([0, yAxisScale]).range([0, chartHeight]);

	$: ksgTooltip = null;
	$: crfTooltip = null;
	$: mouse = null;
</script>

{#if sectorlyData}
	<div class="basis-1/2">
		<svg viewBox="0 0 {chartWidth} {chartHeight}" width={chartWidth} height={chartHeight}>
			<!-- <ChartAxes
				width={1000}
				{height}
				xAxisInterval={5}
				unit={'Mio t CO2eq'}
				xAxisValues={years}
				yAxisMax={100}
			/> -->
			{#each [...sectorlyData].reverse() as ksgSector, s}
				{@const path = ksgSector.absolute
					.map((year, yi) => {
						const sum = sectorlyData
							.slice(0, sectorlyData.length - s)
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
				<path
					d={path}
					fill={ksgSector.colorCode}
					on:mousemove={(e) => {
						if (ksgSelection != null) return;
						mouse = { x: e.layerX, y: e.layerY };
						ksgTooltip = ksgSector;
					}}
					on:mousedown|stopPropagation={() => {
						ksgSelection = s;
						ksgTooltip = null;
					}}
					opacity={ksgTooltip == ksgSector ? 0.8 : 1}
					class="transition-opacity"
				/>

				<!-- biggest CRF Lines? -->
				{#each ksgSector.sectors as crfSector, c}
					{@const crfPath = crfSector.absolute
						.map((year, yi) => {
							const sum =
								sectorlyData
									.slice(0, sectorlyData.length - s)
									.reduce((sum, entry) => sum + entry.absolute[yi], 0) -
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
				{/each}

				{#each ksgSector.absolute as year, yi}
					{@const sum = sectorlyData
						.slice(0, sectorlyData.length - s)
						.reduce((sum, entry) => sum + entry.absolute[yi], 0)}
					{@const x = 15 + yi * 30}
					{@const y = yScale(sum)}
					<circle r="3" cx={x} cy={baseline - y} />
				{/each}
			{/each}

			<!-- Axes -->

			<!-- {#each Object.entries(detailLayers) as [year, ksgSectors], y}
				{@const x = 15 + y * 30}
				{#each ksgSectors as ksgSector, s}
					{@const previousSum = ksgSectors.slice(0, s).reduce((sum, entry) => sum + entry.value, 0)}
					{@const selected = ksgSelection == s}
					{@const h = yScale(ksgSector.value)}
					{@const y = selected ? 0 : yScale(previousSum)}

					{#if ksgSelection == null || selected}
						<rect width={28} height={h} x={0 + x} y={200 - h - y} fill={ksgSector.colorCode} />
					{:else}
						{#each ksgSector.sectors as crfSector, c}
							<rect width={28} height={h} x={0 + x} y={200 - h - y} fill={ksgSector.colorCode} />
						{/each}
					{/if}
				{/each}

				{#if year == selectedYear}
					<line x1={x + 15} x2={x + 15} y1="0" y2="200" stroke="red" stroke-width="2" />
				{/if}

				<!-- x-Axis: Years -- >
				<text x={14 + x} y={chartHeight - 20} font-size="10" text-anchor="middle"
					><tspan>{year}</tspan></text
				>
			{/each} -->
		</svg>
		{#if ksgTooltip}
			<div class="absolute bg-white rounded p-4" style="top: {mouse.y}px; left: {mouse.x}px;">
				<h4><strong>{ksgTooltip.label}</strong></h4>
			</div>
		{/if}
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
