<script>
	import { scaleLinear } from 'd3-scale';
	export let config;
	export let layers;

	$: xScale = config.scale.domain([0, 100]).range([0, chartWidth]);
	$: yScale = scaleLinear().domain([0, 100]).range([chartHeight, 0]);

	let chartWidth;
	let chartHeight;
</script>

<div class="h-full min-h-64" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
	<svg>
		<!-- axis -->
		<!-- layers -->
		{#each layers as layer}
			<g>
				{#if layer.type == 'bar'}
					{#each layer.data as d}
						<rect />
					{/each}
				{:else if layer.type == 'line'}
					<path />
				{/if}
			</g>
		{/each}
	</svg>
</div>
