<script>
	import { line } from 'd3-shape';
	import { scaleLinear } from 'd3-scale';
	import { max } from 'd3-array';
	import formatNumber from '$lib/stores/formatNumber';

	let chartWidth;
	let chartHeight;

	$: console.log(data);

	$: maxValue = data
		.map((d) => d.data)
		.flat()
		.map((d) => d.cumulative_power_kw)
		.sort((a, b) => b - a)[0];

	export let data;

	let margin = { top: 0, right: 20, bottom: 20, left: 40 };

	$: innerChartHeight = chartHeight - margin.top - margin.bottom;
	$: innerChartWidth = chartWidth - margin.left - margin.right;

	$: xScale = scaleLinear().domain([2000, 2025]).range([0, innerChartWidth]);

	$: yScale = scaleLinear()
		.domain([0, maxValue * 1.1])
		.range([innerChartHeight, 0]);

	$: generateLine = line()
		.x((d) => xScale(d.year))
		.y((d) => yScale(d.cumulative_power_kw));
</script>

<div class="flex gap-2 flex-wrap mt-4">
	{#each data as d}
		<span
			class="text-xs opacity-70 rounded-full px-1.5 py-0.5 text-white font-bold"
			style="background: {d.color}">{d.label}</span
		>
	{/each}
</div>

<div class="h-64" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
	<svg width={'100%'} height={'100%'} class="overflow-visible">
		<g transform="translate({margin.left},0)">
			{#each xScale.ticks(10) as year}
				<g transform="translate({xScale(year)},{chartHeight})" class="text-xs opacity-70">
					<text text-anchor="middle">{year}</text>
					<line x1={0} x2={0} y1={-20} y2={-15} stroke="currentColor" />
				</g>
			{/each}
		</g>
		<g transform="translate(0,{margin.top})">
			{#each yScale.ticks() as tick}
				<g transform="translate(0,{yScale(tick)})" class="text-xs opacity-70">
					<line x1="40" x2={chartWidth} y1="0" y2="0" class="stroke-current opacity-20" />
					<text dominant-baseline="middle">{formatNumber(tick)}</text>
				</g>
			{/each}
		</g>
		<g transform="translate({margin.left},{margin.top})">
			{#each data as d}
				<g style="color: {d.color}">
					<path d={generateLine(d.data)} class="fill-none stroke-2 stroke-current" />
				</g>
			{/each}
		</g>
	</svg>
</div>
