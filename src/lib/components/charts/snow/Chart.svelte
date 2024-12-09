<script>
	import { line, area } from 'd3-shape';
	import { scaleLinear } from 'd3-scale';

	export let data;
	console.log(data);

	let chartWidth;
	let chartHeight;

	// Compute scales
	$: xScale = scaleLinear().domain([0, 150]).range([0, chartWidth]);
	$: yScale = scaleLinear().domain([0, 10]).range([20, 0]);

	// Generate lines
	$: generateLine = function (data) {
		return line()
			.x((d) => xScale(d.x))
			.y((d) => yScale(d.sh))(data.filter((d) => !isNaN(d.sh)));
	};

	$: generateArea = function (data) {
		return area()
			.x((d) => xScale(d.x))
			.y0((d) => yScale(d.sh))
			.y1((d) => yScale(0))(data.filter((d) => !isNaN(d.sh)));
	};

	$: selectedYear = false;
</script>

test
<div
	class="w-full h-[1400px] bg-blue-900"
	bind:clientWidth={chartWidth}
	bind:clientHeight={chartHeight}
>
	{#if chartWidth && chartHeight}
		<svg width={'100%'} height={'100%'}>
			{#each data as winter, i}
				<g transform="translate(0,{i * 10})">
					<text dominant-baseline="hanging">{winter.label}</text>
					<path
						d={generateArea(winter.data.filter((d) => !isNaN(d.sh)))}
						class="stroke-gray-300 fill-white"
					/>
				</g>
			{/each}
		</svg>
	{/if}
</div>
