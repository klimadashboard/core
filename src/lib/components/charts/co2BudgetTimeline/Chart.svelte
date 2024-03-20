<script>
	import { fade, fly } from 'svelte/transition';
	import { scaleLinear } from 'd3-scale';
	import { onMount } from 'svelte';

	export let data;
	export let historicalData;
	export let blockValue;
	export let index;
	export let offset;
	export let progress;
	export let chartWidth;
	export let chartHeight;
	export let currentYear;

	let x;
	let y;

	let types = [
		{
			key: 'overused',
			classes: 'bg-energy'
		},
		{
			key: 'historical',
			classes: 'bg-industry'
		},
		{
			key: 'projection',
			classes: 'bg-none border-industry border-2'
		}
	];

	$: totalHistoricalEmissions = historicalData.reduce((a, b) => a + b.co2_Mt_incl_LULUCF, 0);
	$: totalBudget = 1000;
	$: startYear = index > 2 ? 2016 : 1880;
	$: endYear = index > 2 ? 2050 : 2024;
	$: maxValue = 1000;
	$: circleSize = 5;

	$: xScaleHistorical = scaleLinear().range([0, chartWidth]).domain([1880, 2024]);
	$: xScaleFuture = scaleLinear().range([0, chartWidth]).domain([2016, 2050]);
	$: yScale = scaleLinear()
		.range([chartHeight, chartHeight / 2])
		.domain([0, maxValue / blockValue]);

	const pointForRatio = (p1, p2, ratio) => [
		(p2[0] - p1[0]) * ratio + p1[0],
		(p2[1] - p1[1]) * ratio + p1[1]
	];

	$: randomPositions = [...historicalArray].map((d) => {
		return [Math.random() * chartWidth, chartHeight / 2 + (Math.random() * chartHeight) / 2];
	});

	let historicalArray = historicalData
		.map((e) => {
			const arr = Array.from(Array(Math.round(e.co2_Mt_incl_LULUCF / blockValue)).keys()).map(
				(d) => {
					return {
						year: e.year,
						index: d
					};
				}
			);
			return arr;
		})
		.flat();

	$: circles = [...historicalArray]
		.map((e, i) => {
			const p1 = randomPositions[i];
			const p2 = [xScaleHistorical(e.year), yScale(e.index)];
			const p3 = [xScaleFuture(e.year), yScale(e.index)];
			let position;
			if (index == 0) {
				position = p1;
			} else if (index == 1) {
				position = pointForRatio(p1, p2, Math.min(1, offset));
			} else if (index == 2) {
				position = p2;
			} else if (index == 3) {
				position = pointForRatio(p2, p3, Math.min(1, offset));
			} else {
				position = p3;
			}
			return {
				x: position[0],
				y: position[1],
				i: i,
				year: e.year
			};
		})
		.filter((d) => d.year <= currentYear);
</script>

<div class="w-full h-full">
	<svg width={'100%'} height={'100%'}>
		{#each circles as circle}
			<circle r={circleSize} cx={circle.x} cy={circle.y} class="fill-black" in:fade out:fly />
		{/each}
	</svg>
	<div class="flex h-80 items-end space-x-2.5 w-max">
		{#each data as year, i}
			<div class="relative w-3" transition:fade={{ delay: i * 10 }}>
				{#if i % 10 == 0 || year.year == 2023}
					<p class="text-xs text-gray-600 absolute -bottom-4 left-1 -translate-x-1/2">
						{year.year}
					</p>
				{/if}

				<div class="flex flex-col-reverse">
					{#each year.data as a, j}
						<div
							class="w-3 h-3 {types.find((d) => d.key == a.type).classes} mb-0.5 rounded-xl"
							transition:fade={{ delay: j * 10 }}
						/>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
