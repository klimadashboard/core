<script>
	import XAxis from './XAxis.svelte';
	import YAxis from './YAxis.svelte';
	import Bar from './Bar.svelte';
	import Line from './Line.svelte';
	export let data;
	export let chart;

	let chartWidth;
	let chartHeight;

	const layerTypes = [
		{
			key: 'line',
			component: Line
		},
		{
			key: 'bar',
			component: Bar
		}
	];

	const options = {
		margin: {
			top: 0,
			right: 10,
			bottom: 10,
			left: 10
		}
	};
</script>

<div bind:clientWidth={chartWidth} bind:clientHeight={chartHeight} class="min-h-96">
	{#if chartWidth && chartHeight}
		<svg width={'100%'} height={'100%'}>
			<XAxis {chartWidth} {chartHeight} {data} {options} />

			{#each chart.layers as layer}
				<YAxis {chartWidth} {chartHeight} {data} />
				<svelte:component this={layerTypes.find((d) => d.key == layer.type)?.component} {data} />
			{/each}
		</svg>
	{/if}
</div>
