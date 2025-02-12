<script>
	import { line } from 'd3-shape';
	import { getScale } from '$lib/utils/scales.js'; // Import the updated getScale function

	export let data;
	export let layer;
	export let chartWidth;
	export let chartHeight;
	export let options;

	// Create scales using getScale
	$: xScale = getScale(relevantData, 'x', [
		0,
		chartWidth - options.margin.left - options.margin.right
	]);
	$: yScale = getScale(relevantData, 'y', [
		chartHeight - options.margin.bottom - options.margin.top,
		0
	]);

	// console.log(layer);
	// Extract relevant data for rendering
	$: relevantData = data.map((d) => ({
		x: d.x, // Pass x as is
		y: d.layers?.find((l) => l.label === layer.name)?.y
	}));

	// Generate line
	$: generateLine = line()
		.x((d) => xScale(d.x))
		.y((d) => yScale(d.y));
</script>

{#if relevantData}
	<g>
		<path d={generateLine(relevantData)} class="stroke-current stroke-2 fill-none" />
	</g>
{/if}
