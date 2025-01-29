<script>
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { min, max } from 'd3-array';

	export let chartWidth;
	export let chartHeight;
	export let data;
    export let layer;
	export let options;

	console.log(data);

    $: relevantData = data.map(d => d.layers.find(d => d.label == layer.name));

	$: yScale = scaleLinear()
		.domain([min(relevantData, (d) => d.y), max(relevantData, (d) => d.y)])
		.range([chartHeight, 0]);
</script>

<g transform="translate(0,0)" class="text-sm">
	{#each yScale.ticks(10) as tick}
		<g transform="translate(0,{yScale(tick)})">
			<text text-anchor="left">{tick} {relevantData[0].unit}</text>
			<line x1={0} x2={chartWidth} class="stroke-black opacity-20" />
		</g>
	{/each}
</g>
