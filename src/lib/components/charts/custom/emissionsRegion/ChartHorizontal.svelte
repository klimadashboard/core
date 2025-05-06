<script>
	import { scaleLinear } from 'd3-scale';
	export let data;

	let chartWidth;
	let chartHeight;

	// Compute total and scale
	$: total = data.reduce((sum, d) => sum + d.value, 0);
	$: xScale = scaleLinear().domain([0, total]).range([0, chartWidth]);

	// Compute xOffsets for horizontal stacking
	$: stackedData = [];
	$: {
		let offset = 0;
		stackedData = data.map((d) => {
			const item = { ...d, xOffset: offset };
			offset += d.value;
			return item;
		});
	}
</script>

<p class="text-xl mt-4">Die Sektoren mit dem größten Anteil... [todo]</p>
<p>Disclaimer zu energiemosaik.at (Daten von 2019)</p>

<div bind:clientWidth={chartWidth} bind:clientHeight={chartHeight} class="h-40 mt-4">
	<svg width="100%" height="100%">
		{#each stackedData as datapoint}
			<g transform={`translate(${xScale(datapoint.xOffset)}, 0)`}>
				<rect
					width={xScale(datapoint.value)}
					height={chartHeight}
					fill={datapoint.category_color}
				/>
			</g>
		{/each}
	</svg>
</div>
