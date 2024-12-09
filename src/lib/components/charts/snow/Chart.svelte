<script>
	import { line, area } from 'd3-shape';
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { min, max } from 'd3-array';

	export let data;
	console.log(data);

	let chartWidth;
	let distance = 15;
	let chartHeight = data.length * distance;

	// Compute scales
	$: xScales = data.map((d) =>
		scaleTime()
			.domain([new Date(d.data[0].date), new Date(d.data[d.data.length - 1].date)])
			.range([0, chartWidth])
	);
	$: yScale = scaleLinear().domain([0, 10]).range([20, 0]);

	// Generate lines
	$: generateLine = function (data, xScale) {
		return line()
			.x((d) => xScale(new Date(d.date)))
			.y((d) => yScale(d.sh))(data.filter((d) => !isNaN(d.sh)));
	};

	$: generateArea = function (data, xScale) {
		return area()
			.x((d) => xScale(new Date(d.date)))
			.y0((d) => yScale(d.sh))
			.y1((d) => yScale(0))(data.filter((d) => !isNaN(d.sh)));
	};

	$: selectedWinter = false;
</script>

<div
	class="w-full max-w-4xl bg-[#CDE0E6] mx-auto"
	style="height: {chartHeight}px"
	bind:clientWidth={chartWidth}
	bind:clientHeight={chartHeight}
>
	{#if chartWidth && chartHeight}
		<svg width={'100%'} height={'100%'}>
			{#each data as winter, i}
				{@const xScale = xScales[i]}
				<g
					transform="translate(0,{i * distance})"
					on:mouseover={() => (selectedWinter = winter)}
					on:mouseout={() => (selectedWinter = false)}
					class={!selectedWinter || selectedWinter == winter ? 'opacity-100' : 'opacity-50'}
				>
					<text class="fill-white text-sm">{winter.label}</text>
					<path
						d={generateArea(
							winter.data.filter((d) => !isNaN(d.sh)),
							xScale
						)}
						class="stroke-gray-100 fill-white"
					/>
					<rect fill="transparent" y={-5} height={5} width={chartWidth} />
				</g>
			{/each}
		</svg>
	{/if}
</div>
