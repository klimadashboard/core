<script>
	import { scaleLinear, scaleTime } from 'd3-scale';
	import formatNumber from '$lib/stores/formatNumber';
	import { line } from 'd3-shape';
	import { max } from 'd3-array';

	export let data;
	console.log(data);

	let chartWidth;
	let chartHeight;

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

<div class="w-full h-full" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
	<svg width={chartWidth} height={chartHeight}>
		<g>
			{#each xScale.ticks() as year}
				<text x={xScale(year)} y={chartHeight} text-anchor="end" class="text-xs opacity-70"
					>{year}</text
				>
			{/each}
		</g>
		<g>
			{#each yScale.ticks() as value}
				<text x={0} y={yScale(value)} text-anchor="start" class="text-xs opacity-70"
					>{formatNumber(value)}</text
				>
			{/each}
		</g>
		<g>
			<path d={generateLine(data)} class="fill-none stroke-current stroke-2" />
		</g>
	</svg>
</div>
