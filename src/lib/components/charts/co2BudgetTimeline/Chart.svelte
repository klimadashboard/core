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
	export let selectedBudgetYear;

	let margin = { top: 0, right: 5, bottom: 80, left: 5 };

	const startYear1 = 1850;
	$: startYear2 = chartWidth > 600 ? 1960 : 2010;
	const maxValue = 1000;
	const circleSize = 3;
	const padding = 3;

	$: yearWindow = chartWidth / circleSize / padding;
	$: startYear = startYear1;
	$: endYear = startYear + yearWindow;

	// interpolate x-axis move
	$: if (index == 2) {
		startYear = startYear1 + (startYear2 - startYear1) * offset;
	}

	$: if (index > 2) {
		startYear = startYear2;
	}

	$: innerChartWidth = chartWidth - margin.left - margin.right;
	$: innerChartHeight = chartHeight - margin.top - margin.bottom;

	$: xScale = scaleLinear().range([0, innerChartWidth]).domain([startYear, endYear]);
	$: yScale = scaleLinear()
		.range([innerChartHeight, innerChartHeight - (maxValue / blockValue) * circleSize * padding])
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
				year: e.year,
				highlighted:
					index > 3 && index < 6
						? index == 5 && offset > 0.25 && selectedBudgetYear.year >= e.year && e.year > 2015
							? true
							: false
						: true,
				overflow:
					index == 5
						? e.year == 2023 && selectedBudgetYear.year > 2022 && e.index > 0
							? true
							: false
						: false
			};
		})
		.filter((d) => d.year <= currentYear);

	const projections = [
		{
			index: 6,
			key: '1.5_50'
		},
		{
			index: 8,
			key: '3860_nochange'
		},
		{
			index: 9,
			key: '3860_linear'
		},
		{
			index: 10,
			key: '3860_percentage'
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

	const highlightedYears = [
		{
			year: 1979,
			label: 'Peak der Emissionen'
		},
		{
			year: 1995,
			label: 'Erste UN-Weltklimakonferenz (COP 1)'
		},
		{
			year: 1997,
			label: 'Kyoto-Protokoll'
		},
		{
			year: 2015,
			label: 'Pariser Klimaabkommen'
		}
	];
</script>

<div class="w-full h-full {index == 7 ? 'opacity-20' : 'opacity-100'} transition">
	<svg width={'100%'} height={'100%'}>
		<g id="annotations">
			{#if index > 3}
				<g
					transform="translate({xScale(2016)},{yScale(
						historicalArray.findLast((d) => d.year == 2016).index
					) - 40})"
				>
					<line x1={0} x2={0} y1={0} y2={30} class="stroke-2 stroke-industry" />
					<text x={5} class="text-sm font-bold fill-industry" dominant-baseline="hanging"
						>2016 – Start des CO2-Budgets</text
					>
				</g>
			{/if}
			{#if index == 2 || index == 3}
				{#each highlightedYears as highlightedYear, i}
					<g
						transform="translate({xScale(highlightedYear.year) - 1},{yScale(
							historicalArray.findLast((d) => d.year == highlightedYear.year).index
						) - (i == 1 ? 50 : 40)})"
						class="text-industry"
						transition:fade
					>
						<text x={40} y={2} dominant-baseline="middle" class="font-bold text-sm fill-current"
							>{highlightedYear.year} – {highlightedYear.label}</text
						>
						<svg
							width="38"
							height="30"
							viewBox="0 0 38 30"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M6.22604 29.6332C6.57577 30.0607 7.20579 30.1237 7.63324 29.774L14.5989 24.0748C15.0263 23.7251 15.0893 23.0951 14.7396 22.6676C14.3898 22.2402 13.7598 22.1772 13.3324 22.5269L7.14072 27.5928L2.07482 21.4011C1.72509 20.9737 1.09507 20.9107 0.667622 21.2604C0.240177 21.6102 0.177175 22.2402 0.526903 22.6676L6.22604 29.6332ZM36.5 2C37.0523 2 37.5 1.55228 37.5 1C37.5 0.447715 37.0523 0 36.5 0V2ZM7.99504 29.0995C8.73752 21.6746 10.5818 14.9226 14.8185 10.0296C19.0186 5.17875 25.7089 2 36.5 2V0C25.2911 0 17.9814 3.32125 13.3065 8.72042C8.66817 14.0774 6.76248 21.3254 6.00496 28.9005L7.99504 29.0995Z"
								class="fill-current"
							/>
						</svg>
					</g>
				{/each}
			{/if}
		</g>
		<g id="circles" transform="translate({margin.left},{margin.top})">
			{#each circles as circle}
				<circle
					r={circleSize}
					cx={circle.x}
					cy={circle.y}
					class="{circle.highlighted ? 'opacity-100' : 'opacity-50'} {circle.overflow
						? 'fill-energy'
						: 'fill-industry'}"
					in:fade
					out:fly
				/>
			{/each}

			{#each circlesFuture as circle}
				<circle
					r={circleSize}
					cx={circle.x}
					cy={circle.y}
					class="stroke-black stroke-1 fill-none"
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
						<line x1={circleSize * 2} x2={circleSize * 2} y1="-14" y2="0" class="stroke-current" />
						<text class="fill-current" text-anchor="left" x={circleSize * 2 + 3}>{tick}</text>
					</g>
				{/each}
			</g>
		{/if}
	</svg>
</div>
