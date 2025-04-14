<script>
	import { line } from 'd3-shape';
	import { scaleLinear } from 'd3-scale';
	import { max } from 'd3-array';

	let chartWidth;
	let chartHeight;

	export let data;
	export let colors;

	$: xScale = scaleLinear()
		.domain([data[0].year, data[data.length - 1].year])
		.range([0, chartWidth]);

	$: yScale = scaleLinear()
		.domain([0, max(data, (d) => d.cumulative_power_kw)])
		.range([chartHeight, 0]);

	$: generateLine = line()
		.x((d) => xScale(d.year))
		.y((d) => yScale(d.cumulative_power_kw));
</script>

<div class="h-64" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
	<svg width={'100%'} height={'100%'} class="overflow-visible">
		<g>
			{#each xScale.ticks(10) as year}
				<g transform="translate({xScale(year)},{chartHeight})" class="text-xs opacity-70">
					<text text-anchor="middle">{year}</text>
					<line x1={0} x2={0} y1={-20} y2={-15} stroke="currentColor" />
				</g>
			{/each}
		</g>
		<g>
			{#each yScale.ticks() as tick}
				<g transform="translate(0,{yScale(tick)})" class="text-xs opacity-70">
					<line x1="40" x2={chartWidth} y1="0" y2="0" class="stroke-current opacity-20" />
					<text dominant-baseline="middle">{tick}</text>
				</g>
			{/each}
		</g>
		<path d={generateLine(data)} class="fill-none opacity-50 stroke-2" stroke={colors[1]} />
	</svg>
</div>
