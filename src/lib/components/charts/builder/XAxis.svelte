<script>
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { min, max } from 'd3-array';

	export let chartWidth;
	export let chartHeight;
	export let data;
	export let options;

	console.log(data);

	$: xScale = scaleLinear()
		.domain([min(data, (d) => d.x), max(data, (d) => d.x)])
		.range([0, chartWidth - options.margin.left - options.margin.right]);
</script>

<g transform="translate(0,0)" class="text-sm">
	{#each xScale.ticks(10) as tick}
		<g transform="translate({xScale(tick)},0)">
			<text y={chartHeight - options.margin.bottom} text-anchor="middle">{tick}</text>
			<line y1={0} y2={chartHeight} class="stroke-black opacity-20" />
		</g>
	{/each}
</g>
