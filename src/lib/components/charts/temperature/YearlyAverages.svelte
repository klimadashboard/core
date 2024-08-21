<script>
	import formatNumber from '$lib/stores/formatNumber';
	import { scaleLinear } from 'd3-scale';
	import dayjs from 'dayjs';

	export let data;
	export let selectedStation;

	let chartHeight;
	let chartWidth;

	let yearlyAverages = Object.entries(
		[...data].reduce((acc, curr) => {
			const year = dayjs(curr.date).year();
			if (!acc[year]) {
				acc[year] = [];
			}
			acc[year].push(curr.tl_mittel);
			return acc;
		}, {})
	).map(([year, values]) => {
		const sum = values.reduce((sum, value) => sum + value, 0);
		const average = sum / values.length;
		return { year: parseInt(year), average: Math.round(average * 10) / 10 };
	});

	$: xScale = scaleLinear()
		.domain([yearlyAverages[0].year, yearlyAverages[yearlyAverages.length - 1].year])
		.range(0, chartWidth);
	$: yScale = scaleLinear().domain([0, 15]).range(chartHeight, 0);
</script>

<h3 class="text-2xl mt-16 max-w-xl">
	Die Jahresdurchschnittstemperatur 2023 bei der Wetterstation {selectedStation.name} betrug {formatNumber(
		yearlyAverages[yearlyAverages.length - 1].average
	)}°C und war damit um {formatNumber(
		yearlyAverages[yearlyAverages.length - 1].average - yearlyAverages[0].average
	)}°C höher als zu Beginn der Messungen im Jahr {yearlyAverages[0].year} ({formatNumber(
		yearlyAverages[0].average
	)}°C).
</h3>

<div class="h-80 border-y" bind:clientHeight={chartHeight} bind:clientWidth={chartWidth}>
	{#if chartHeight && chartWidth && yearlyAverages}
		<svg width={'100%'} height={'100%'}>
			{#each yearlyAverages as year}
				<circle cx={xScale(year.year)} cy={yScale(year.average)} r={5} class="fill-black" />
			{/each}
		</svg>
	{/if}
</div>
