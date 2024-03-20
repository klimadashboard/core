<script>
	import { fade, fly } from 'svelte/transition';
	import { scaleLinear } from 'd3-scale';
	import { onMount } from 'svelte';

	export let historicalData;
	export let futureData;
	export let blockValue;
	export let index;
	export let offset;
	export let progress;
	export let chartWidth;
	export let chartHeight;
	export let currentYear;

	let x;
	let y;
	let margin = { top: 0, right: 5, bottom: 50, left: 5 };

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

	const startYear1 = 1880;
	const startYear2 = 2016;
	const endYear1 = 2024;
	const endYear2 = 2050;

	$: startYear = startYear1;
	$: endYear = endYear1;
	$: maxValue = 1000;
	$: circleSize = 5;

	// interpolate x-axis move

	$: if (index > 2) {
		if (index == 3) {
			startYear = startYear1 + (startYear2 - startYear1) * offset;
			endYear = endYear1 + (endYear2 - endYear1) * offset;
		} else {
			startYear = startYear2;
			endYear = endYear2;
		}
	}

	$: innerChartWidth = chartWidth - margin.left - margin.right;
	$: innerChartHeight = chartHeight - margin.top - margin.bottom;

	$: xScale = scaleLinear().range([0, innerChartWidth]).domain([startYear, endYear]);
	$: yScale = scaleLinear()
		.range([innerChartHeight, innerChartHeight - (maxValue / blockValue) * circleSize * 3])
		.domain([0, maxValue / blockValue]);

	const pointForRatio = (p1, p2, ratio) => [
		(p2[0] - p1[0]) * ratio + p1[0],
		(p2[1] - p1[1]) * ratio + p1[1]
	];

	$: randomPositions = [...historicalArray].map((d) => {
		return [
			Math.random() * innerChartWidth,
			innerChartHeight / 2 + (Math.random() * innerChartHeight) / 2
		];
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
			const p2 = [xScale(e.year), yScale(e.index)];
			let position;
			if (index == 0) {
				position = p1;
			} else if (index == 1) {
				position = pointForRatio(p1, p2, Math.min(1, offset));
			} else {
				position = p2;
			}
			return {
				x: position[0],
				y: position[1],
				i: i,
				year: e.year
			};
		})
		.filter((d) => d.year <= currentYear);

	const projections = [
		{
			index: 5,
			key: '15_50'
		},
		{
			index: 6,
			key: '3902_nochange'
		},
		{
			index: 7,
			key: '3902_linear'
		},
		{
			index: 8,
			key: '3902_percentage'
		}
	];

	$: circlesFuture = projections.find((d) => d.index == index)
		? futureData
				.filter((d) => d[projections.find((d) => d.index == index).key] > 0)
				.map((e) => {
					const arr = Array.from(
						Array(Math.round(e[projections.find((d) => d.index == index).key] / blockValue)).keys()
					).map((d) => {
						return {
							x: xScale(e.year),
							y: yScale(d),
							year: e.year,
							index: d
						};
					});
					return arr;
				})
				.flat()
		: [];

	$: console.log(circlesFuture);
	$: console.log(futureData);
</script>

<div class="w-full h-full">
	<svg width={'100%'} height={'100%'}>
		<g id="circles" transform="translate({margin.left},{margin.top})">
			{#each circles as circle}
				<circle
					r={circleSize}
					cx={circle.x}
					cy={circle.y}
					class={circle.year > 2020 && index == 4 ? 'fill-energy' : 'fill-black'}
					in:fade
					out:fly
				/>
			{/each}

			{#each circlesFuture as circle}
				<circle
					r={circleSize}
					cx={circle.x}
					cy={circle.y}
					class="stroke-black stroke-2 fill-none"
					transition:fade
				/>
			{/each}
		</g>
		{#if index > 1}
			<g
				id="xScale"
				class="text-xs text-gray-600"
				transform="translate(0,{innerChartHeight + 18})"
				in:fade
			>
				{#each xScale.ticks() as tick}
					<g transform="translate({xScale(tick)},0)">
						<line x1={0} x2={0} y1={0} y2={10} class="stroke-current" />
						<text class="fill-current">{tick}</text>
					</g>
				{/each}
			</g>
		{/if}
	</svg>
</div>
