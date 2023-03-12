<script>
	import ChartAxes from './ChartAxes.svelte';
	import ChartLegend from './ChartLegend.svelte';

	import { scaleLinear } from 'd3-scale';
	export let selectedYear;
	export let ksgSelection;
	export let crfSelection;
	export let years;
	export let sectorlyData;

	let chartHeight = 800;
	let chartWidth = 1000;
	$: baseline = chartHeight - 100;
	$: startline = 100;
	$: dx = (chartWidth - startline) / years.length;

	$: yAxisMax = years.reduce((max, y, yi) => Math.max(max, ksgSectorSum(0, yi)), 0);

	$: yScale = scaleLinear().domain([0, yAxisMax]).range([0, baseline]);

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

	$: highlightedYearIndex = null;
	$: legendCategories = ksgSelection == null ? sectorlyData : sectorlyData[ksgSelection].sectors;
</script>

{#if sectorlyData}
	<div class="basis-[400px] grow max-w-[70vh]" style="background: rgba(0,0,0,0)">
		<ChartLegend
			categories={legendCategories}
			{highlightedYearIndex}
			bind:ksgSelection
			bind:crfSelection
		/>

		<svg
			viewBox="0 0 {chartWidth} {chartHeight}"
			on:mousemove|capture={function (e) {
				mouse = {
					x: ((e.layerX - this.getBoundingClientRect().left) / this.clientWidth) * chartWidth,
					y: ((e.layerY - this.getBoundingClientRect().top) / this.clientHeight) * chartHeight
				};
				// console.log(e.layerX, 'offset', this.clientWidth, chartWidth);

				highlightedYearIndex = Math.min(
					years.length - 1,
					Math.max(0, Math.round((mouse.x - startline / 2) / dx))
				);
			}}
			on:mouseleave={(e) => {
				mouse = null;
				highlightedYearIndex = null;
			}}
		>
			{#each [...sectorlyData].reverse() as ksgSector, s}
				{#if ksgSelection == null || ksgSelection == sectorlyData.length - 1 - s}
					{@const path = ksgSector.absolute
						.map((year, yi) => {
							const sum = ksgSectorSum(s, yi);
							const x = startline + yi * dx;
							const y = yScale(sum);
							return [yi == 0 ? 'M' : 'L', x, baseline - y];
						})
						.concat([
							'L',
							startline + (ksgSector.absolute.length - 1) * dx,
							baseline,
							'L',
							startline,
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
									const x = startline + yi * dx;
									const y = yScale(sum);
									return [yi ? 'L' : 'M', x, baseline - y];
								})
								.concat([
									'L',
									startline + (ksgSector.absolute.length - 1) * dx,
									baseline,
									'L',
									startline,
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
						{@const x = startline + yi * dx}
						{@const y = yScale(sum)}
						<circle r="3" cx={x} cy={baseline - y} />
					{/each} -->
				{/if}
			{/each}

			<ChartAxes
				width={chartWidth}
				height={chartHeight}
				{baseline}
				{startline}
				{dx}
				xAxisInterval={5}
				unit={'Mio t CO2eq'}
				xAxisValues={years}
				{yAxisMax}
			/>

			{#if highlightedYearIndex != null}
				<line
					x1={startline + highlightedYearIndex * dx}
					x2={startline + highlightedYearIndex * dx}
					y1="0"
					y2={baseline}
					stroke="red"
					stroke-width="3"
				/>
			{/if}
			{#if selectedYear != null}
				<rect
					x={startline + (selectedYear - 1990) * dx - 10}
					y="0}"
					width="20"
					height={baseline}
					fill="none"
					stroke="black"
				/>
			{/if}
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
