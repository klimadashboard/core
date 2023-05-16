<script>
	import ChartAxes from './ChartAxes.svelte';
	import ChartLegend from './ChartLegend.svelte';

	import { scaleLinear } from 'd3-scale';
	export let selectedYear;
	export let sectorlyData;
	export let colorForKey;
	export let years;
	export let maxYear;
	// interactive
	export let ksgSelection;
	export let crfSelection;
	export let ksgHover;
	export let crfHover;

	let clientHeight = 1000;
	let clientWidth = 1000;
	$: chartHeight = clientHeight;
	$: chartWidth = clientWidth;
	$: baseline = chartHeight - 40;
	$: startline = 100;
	$: dx = (chartWidth - startline) / years.length;

	$: yAxisMax = years.reduce((max, y, yi) => Math.max(max, ksgSectorSum(0, yi)), 0);

	$: yScale = scaleLinear().domain([0, yAxisMax]).range([5, baseline-20]);

	$: mouse = null;

	$: ksgSectorSum = (s, yi) => {
		if (crfSelection != null) return sectorlyData[ksgSelection].sectors[crfSelection].absolute[yi];
		if (ksgSelection != null) return sectorlyData[ksgSelection].absolute[yi];
		const ksgSum = sectorlyData
			.slice(0, sectorlyData.length - s)
			.reduce((sum, entry) => sum + entry.absolute[yi], 0);
		return ksgSum;
	};

	$: highlightedYearIndex = null;
	$: legendCategories = ksgSelection == null ? sectorlyData : sectorlyData[ksgSelection].sectors;
</script>

{#if sectorlyData}
	<div
		class="basis-[500px] min-h-[400px] grow"
		style="background: rgba(0,0,0,0)"
		bind:clientWidth
		bind:clientHeight
	>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<svg
			class="w-full h-full"
			on:mouseleave={() => {
				ksgHover = null;
				crfHover = null;
			}}
		>
			<ChartAxes
				width={chartWidth}
				height={chartHeight}
				{baseline}
				{startline}
				{dx}
				xAxisInterval={5}
				unit={'Mt CO₂eq'}
				xAxisValues={years}
				yAxisMax={yAxisMax == 0 ? 1 : yAxisMax}
			/>

			{#each [...sectorlyData].reverse() as ksgSector, s}
				{#if ksgSelection == null || ksgSelection == sectorlyData.length - 1 - s}
					{@const path = ksgSector.absolute
						.filter((_, yi) => 1990 + yi <= maxYear)
						.map((year, yi) => {
							const sum = ksgSectorSum(s, yi);
							const x = startline + yi * dx;
							const y = yScale(sum);
							return [yi == 0 ? 'M' : 'L', x, baseline-5 - y];
						})
						.concat([
							'L',
							startline + (maxYear - 1990) * dx,
							baseline-5,
							'L',
							startline,
							baseline-5,
							'Z'
						])
						.flat()
						.join(' ')}
					{#if ksgSelection == null}
						<path
							d={path}
							fill={ksgHover == sectorlyData.length - s - 1
								? colorForKey(ksgSector.key).colorCodeHighlighted
								: colorForKey(ksgSector.key).colorCode}
							stroke="white"
							stroke-width="2"
							on:mousemove={(e) => {
								if (ksgSelection != null) return;
								ksgHover = sectorlyData.length - s - 1;
							}}
							on:mousedown={(e) => {
								ksgSelection = sectorlyData.length - s - 1;
							}}
							class="cursor-pointer"
						/>
					{/if}

					<!-- biggest CRF Lines? -->
					{#each [...ksgSector.sectors].reverse() as crfSector, c}
						{#if (ksgHover != null && ksgHover == sectorlyData.length - s - 1) || (ksgSelection != null && (crfSelection == null || crfSelection == ksgSector.sectors.length - c - 1))}
							{@const crfPath = crfSector.absolute
								.filter((_, yi) => 1990 + yi <= maxYear)
								.map((year, yi) => {
									const subSectorSum = ksgSector.sectors
									.slice(0, c)
									.reduce((subSum, entry) => subSum + entry.absolute[yi], 0)
									const sum =
										ksgSectorSum(s, yi) - (crfSelection != null ? 0 : subSectorSum);
									const x = startline + yi * dx;
									const y = sum == 0 ? 0 : yScale(sum);
									return [yi ? 'L' : 'M', x, baseline-5 - y];
								})
								.concat([
									'L',
									startline + (maxYear - 1990) * dx,
									baseline-5,
									'L',
									startline,
									baseline-5,
									'Z'
								])
								.flat()
								.join(' ')}
								<!-- {@const crfPath = computeCRFPath(c, crfSector, s, ksgSector)} -->
							<path
								d={crfPath}
								data-path="crf-{ksgSector.key}-{c}"
								fill={ksgHover == sectorlyData.length - s - 1 || crfHover == c
									? colorForKey(ksgSector.key).colorCodeHighlighted
									: colorForKey(ksgSector.key).colorCode}
								stroke={ksgHover == sectorlyData.length - s - 1 || ksgSelection != null
									? '#ffffffaa'
									: 'transparent'}
								stroke-width="1"
								class="{ksgSelection == null ? 'pointer-events-none' : ''} cursor-pointer"
								on:mousemove={(e) => {
									if (crfSelection != null) return;
									crfHover = c;
								}}
								on:mousedown={(e) => {
									crfSelection = c;
								}}
							/>
							<text x={chartWidth - 40} y={crfPath.split(' ')[crfPath.split(' ').length - 1] - 100}
								>{c}</text
							>
						{/if}
					{/each}
				{/if}

				<!-- Dots -->
				<!-- {#each ksgSector.absolute as year, yi}
						{@const sum = sectorlyData
							.slice(0, sectorlyData.length - s)
							.reduce((sum, entry) => sum + entry.absolute[yi], 0)}
						{@const x = startline + yi * dx}
						{@const y = yScale(sum)}
						<circle r="3" cx={x} cy={baseline - y} />
					{/each} -->
			{/each}

			{#if selectedYear != null}
				<line
					x1={startline + (selectedYear - 1990) * dx}
					x2={startline + (selectedYear - 1990) * dx}
					y1="3"
					y2={baseline}
					height={baseline}
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke="black"
				/>
			{/if}
		</svg>
	</div>
{/if}
