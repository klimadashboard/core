<script>
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { min, max } from 'd3-array';

	export let chartWidth;
	export let chartHeight;
	export let data;
	export let layer;
	export let options;

	// console.log(data);

	$: yScale = scaleLinear()
		.domain([min(data, (d) => d.y), max(data, (d) => d.y)])
		.range([chartHeight - options.margin.bottom - options.margin.top, 0]);
</script>

<g transform="translate(0,{options.margin.top})" class="text-sm">
	{#each yScale.ticks(10) as tick}
		<g transform="translate({options.margin.left},{yScale(tick)})">
			<text x={-5} text-anchor="end" class="fill-current" dominant-baseline="middle"
				>{tick} {data[0].unit}</text
			>
			<line
				x1={0}
				x2={chartWidth - options.margin.left - options.margin.right}
				class="stroke-current opacity-20"
				stroke-dasharray="2,2"
			/>
		</g>
	{/each}
</g>
