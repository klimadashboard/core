<script>
	import { line, area } from 'd3-shape';
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { min, max } from 'd3-array';

	export let data;
	console.log(data);

	let chartWidth;
	let marginLeft = 200;
	$: timeChartWidth = chartWidth - marginLeft;
	let distance = 14;
	let chartHeight = data.length * distance;

	// Compute scales
	$: xScales = data.map((d) =>
		scaleTime()
			.domain([new Date(d.data[0].date), new Date(d.data[d.data.length - 1].date)])
			.range([0, timeChartWidth])
	);
	$: yScale = scaleLinear()
		.domain([0, max(data, (d) => max(d.data, (d) => d.sh))])
		.range([distance * 4, 0]);

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

	$: getTotalSnowAccumulation = (winter) => {
		return winter.data.reduce((acc, d) => acc + d.sh, 0);
	};

	$: getWidthForWinter = (winter) => {
		const totalSnowAccumulation = getTotalSnowAccumulation(winter);
		return (
			(totalSnowAccumulation / max(data, (d) => d.data.reduce((acc, d) => acc + d.sh, 0))) * 100
		);
	};
</script>

<div
	class="w-full"
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
					><text
						text-anchor="end"
						x={marginLeft - 45 - getWidthForWinter(winter)}
						class="text-xs"
						y={-2}>{getTotalSnowAccumulation(winter)}cm</text
					>
					<rect
						x={marginLeft - 45 - getWidthForWinter(winter)}
						y={-distance}
						width={getWidthForWinter(winter)}
						height={distance - 2}
						class="fill-building"
					/>
					<text class="fill-black text-xs tabular-nums" x={marginLeft - 40} y={-2}>
						{winter.label}
					</text>
					<!--
					<line x1={0} x2={chartWidth} class="stroke stroke-white" />
                    -->
					<g transform="translate({marginLeft},{-distance * 4})">
						<path
							d={generateArea(
								winter.data.filter((d) => !isNaN(d.sh)),
								xScale
							)}
							class="stroke-gray-100 fill-[#CDE0E6]"
						/>
						<path
							d={generateLine(
								winter.data.filter((d) => !isNaN(d.sh)),
								xScale
							)}
							class="stroke-gray-10 fill-none"
						/>
					</g>
					<rect fill="transparent" y={-distance} height={distance} width={chartWidth} />
				</g>
			{/each}
		</svg>
	{/if}
</div>
