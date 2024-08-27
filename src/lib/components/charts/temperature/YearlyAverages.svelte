<script>
	import formatNumber from '$lib/stores/formatNumber';
	import { scaleLinear } from 'd3-scale';
	import { min, max } from 'd3-array';
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

	$: xScale = scaleLinear()
		.domain([yearlyAverages[0].year, yearlyAverages[yearlyAverages.length - 1].year])
		.range([40, chartWidth - 40]);
	$: yScale = scaleLinear()
		.domain([min(yearlyAverages, (d) => d.average) - 1, max(yearlyAverages, (d) => d.average) + 1])
		.range([chartHeight, 0]);

	const colors = ['#2489B8', '#7148CF', '#CE4358']; // from green to blue

	$: getColor = function (value) {
		const colorScale = scaleLinear().range(colors).domain([0, 7, 14]);
		return colorScale(value);
	};

	$: lastYear = yearlyAverages[yearlyAverages.length - 1];

	$: selectedYear = lastYear;
</script>

<h3 class="text-2xl mt-16 max-w-xl">
	Die Jahresdurchschnittstemperatur 2023 bei der Wetterstation {selectedStation.name} betrug {formatNumber(
		lastYear.average
	)}°C und war damit um {formatNumber(lastYear.average - yearlyAverages[0].average)}°C {lastYear.average -
		yearlyAverages[0].average >
	0
		? 'höher'
		: 'niedriger'} als zu Beginn der Messungen im Jahr {yearlyAverages[0].year} ({formatNumber(
		yearlyAverages[0].average
	)}°C).
</h3>

<div
	class="h-80 border-y mt-4 bg-gray-50"
	bind:clientHeight={chartHeight}
	bind:clientWidth={chartWidth}
>
	{#if chartHeight && chartWidth && yearlyAverages}
		<svg width={'100%'} height={'100%'}>
			<rect
				width={chartWidth}
				height={chartHeight}
				on:mouseover={() => (selectedYear = false)}
				fill="none"
			/>
			<g>
				{#each yearlyAverages as year}
					<g
						transform="translate({xScale(year.year)}, {yScale(year.average)})"
						style="color: {getColor(year.average)}"
					>
						<circle r={6} class="fill-current" />
					</g>
				{/each}
			</g>
			<g>
				{#each yearlyAverages as year}
					<rect
						x={xScale(year.year)}
						width={chartWidth / yearlyAverages.length}
						height={chartHeight}
						on:mouseover={() => (selectedYear = year)}
						on:focus={() => (selectedYear = year)}
						class="fill-white opacity-0"
					/>
				{/each}
			</g>
			{#if selectedYear}
				<g transform="translate({xScale(selectedYear.year)},0)">
					<line x1={0} x2={0} y1={20} y2={chartHeight} class="stroke-gray-400" />
					<text
						y={5}
						class="text-xs fill-gray-400 font-bold"
						dominant-baseline="hanging"
						text-anchor="middle">{selectedYear.year}: {selectedYear.average}°C</text
					>
				</g>
			{/if}
			<g>
				{#each yScale.ticks(3) as tick}
					<g transform="translate(0,{yScale(tick)})">
						<line x1={0} x2={5} y1={0} y2={0} class="stroke-gray-200" />
						<text x={7} class="text-sm fill-gray-400" dominant-baseline="middle">{tick}°C</text>
					</g>
				{/each}
			</g>
			<g>
				{#each xScale.ticks(5) as tick}
					<g transform="translate({xScale(tick)},{chartHeight})">
						<line x1={0} x2={0} y1={-10} y2={0} class="stroke-gray-400" />
						<text
							y={-20}
							class="text-xs fill-gray-400"
							text-anchor="middle"
							dominant-baseline="middle">{tick}</text
						>
					</g>
				{/each}
			</g>
		</svg>
	{/if}
</div>
