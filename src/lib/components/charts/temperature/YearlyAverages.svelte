<script>
	import formatNumber from '$lib/stores/formatNumber';
	import { scaleLinear } from 'd3-scale';
	import dayjs from 'dayjs';
	import isLeapYear from 'dayjs/plugin/isLeapYear';

	dayjs.extend(isLeapYear);

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
	)
		.filter(([year, values]) => {
			const totalDays = dayjs(`${year}-12-31`).isLeapYear() ? 366 : 365;
			const missingDaysAllowed = 10; // Allow up to 5 missing days
			return (
				values.length >= totalDays - missingDaysAllowed && !values.some((value) => value === null)
			);
		})
		.map(([year, values]) => {
			const sum = values.reduce((sum, value) => sum + value, 0);
			const average = sum / values.length;
			return { year: parseInt(year), average: Math.round(average * 10) / 10 };
		});

	$: console.log(yearlyAverages);

	$: xScale = scaleLinear()
		.domain([yearlyAverages[0].year, yearlyAverages[yearlyAverages.length - 1].year])
		.range([40, chartWidth - 40]);
	$: yScale = scaleLinear().domain([0, 15]).range([chartHeight, 0]);

	const colors = ['#5774DB', '#C7495C']; // from green to blue

	$: getColor = function (value) {
		const colorScale = scaleLinear().range(colors).domain([0, 14]);
		return colorScale(value);
	};

	$: lastYear = yearlyAverages[yearlyAverages.length - 1];

	$: selectedYear = lastYear.year;
</script>

<h3 class="text-2xl mt-16 max-w-xl">
	Die Jahresdurchschnittstemperatur 2023 bei der Wetterstation {selectedStation.name} betrug {formatNumber(
		lastYear.average
	)}°C und war damit um {formatNumber(lastYear.average - yearlyAverages[0].average)}°C höher als zu
	Beginn der Messungen im Jahr {yearlyAverages[0].year} ({formatNumber(
		yearlyAverages[0].average
	)}°C).
</h3>

<div class="h-80 border-y mt-4" bind:clientHeight={chartHeight} bind:clientWidth={chartWidth}>
	{#if chartHeight && chartWidth && yearlyAverages}
		<svg width={'100%'} height={'100%'}>
			{#each yearlyAverages as year}
				<g
					transform="translate({xScale(year.year)}, {yScale(year.average)})"
					style="color: {getColor(year.average)}"
					on:mouseover={() => (selectedYear = year)}
				>
					<circle r={7.5} class="fill-current" />
					{#if selectedYear == year}
						<rect height={15} width={80} y={-7.5} class="fill-current" />
						<text class="text-sm fill-white font-bold" dominant-baseline="middle"
							>{year.year}: {year.average}°C</text
						>
					{/if}
				</g>
			{/each}
		</svg>
	{/if}
</div>
