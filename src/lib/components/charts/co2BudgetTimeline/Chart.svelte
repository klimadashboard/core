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
	let margin = { top: 0, right: 5, bottom: 70, left: 5 };

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

	const startYear1 = 1850;
	$: startYear2 = chartWidth > 600 ? 1990 : 2010;
	const maxValue = 1000;
	const circleSize = 5;

	$: yearWindow = chartWidth / circleSize / 3;
	$: console.log(yearWindow);
	$: startYear = startYear1;
	$: endYear = startYear + yearWindow;

	// interpolate x-axis move
	$: if (index == 2) {
		startYear = startYear1 + (startYear2 - startYear1) * offset;
	}

	$: if (index > 2) {
		startYear = startYear2;
	}

	$: console.log(offset);

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
</script>

<div class="w-full h-full">
	<svg width={'100%'} height={'100%'}>
		<g id="annotations">
			{#if index == 3}
				<g transform="translate({xScale(2016)},{chartHeight / 2})" transition:fade>
					<text x={50} y={2} dominant-baseline="middle" class="font-bold"
						>2016 Pariser Klimaabkommen</text
					>
					<svg
						width="46"
						height="31"
						viewBox="0 0 46 31"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M4.07265 29.8742C4.27931 30.3864 4.86203 30.634 5.37419 30.4274L13.7203 27.0596C14.2325 26.8529 14.4802 26.2702 14.2735 25.7581C14.0668 25.2459 13.4841 24.9982 12.972 25.2049L5.55316 28.1985L2.5596 20.7797C2.35294 20.2675 1.77022 20.0198 1.25806 20.2265C0.745898 20.4332 0.498242 21.0159 0.704903 21.528L4.07265 29.8742ZM44.5 2.5C45.0523 2.5 45.5 2.05228 45.5 1.5C45.5 0.947715 45.0523 0.5 44.5 0.5V2.5ZM5.92033 29.8911C10.2032 19.8137 13.0912 13.0786 18.2303 8.76602C23.3125 4.50126 30.7583 2.5 44.5 2.5V0.5C30.6417 0.5 22.5875 2.49874 16.9447 7.23398C11.3588 11.9214 8.29676 19.1863 4.07967 29.1089L5.92033 29.8911Z"
							fill="black"
						/>
					</svg>
				</g>
			{/if}
		</g>
		<g id="circles" transform="translate({margin.left},{margin.top})">
			{#each circles as circle}
				<circle
					r={circleSize}
					cx={circle.x}
					cy={circle.y}
					class={circle.year > 2020 && index <= 4 ? 'fill-energy' : 'fill-black'}
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
				transform="translate(0,{innerChartHeight + 25})"
				in:fade
			>
				{#each xScale.ticks() as tick}
					<g transform="translate({xScale(tick)},0)">
						<line x1="-12" x2="12" y1="-14" y2="-14" class="stroke-current" />
						<text class="fill-current" text-anchor="middle">{tick}</text>
					</g>
				{/each}
			</g>
		{/if}
	</svg>
</div>
