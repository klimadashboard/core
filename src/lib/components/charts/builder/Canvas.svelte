<script>
	import XAxis from './XAxis.svelte';
	import YAxis from './YAxis.svelte';
	import Bar from './Bar.svelte';
	import Line from './Line.svelte';
	import Table from './Table.svelte';
    import Export from './Export.svelte';
	import Switch from '$lib/components/Switch.svelte';

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
			left: 70
		}
	};

    let activeView = "chart";

    const views = [{
    key: "chart",
    label: "Chart"
}, {
    key: "table",
    label: "Table"
}];
</script>

<div>
<Switch 
{views} {activeView} on:itemClick={(event) => {
		activeView = event.detail;
	}} />

<p class="">custom configuration goes here</p>

<div class="h-[400px]">
{#if activeView == "chart"}
<div bind:clientWidth={chartWidth} bind:clientHeight={chartHeight} class="h-full mt-4">
	{#if chartWidth && chartHeight}
		<svg width={'100%'} height={'100%'} class="overflow-visible">
			<XAxis {chartWidth} {chartHeight} {data} {options} />
            
			{#each chart.layers as layer}
				<YAxis {chartWidth} {chartHeight} {layer} {data} />
                <g transform="translate({options.margin.left},0)">
				<svelte:component this={layerTypes.find((d) => d.key == layer.type)?.component} {data} {layer} {chartWidth} {chartHeight} {options} />
			    </g>
                {/each}
		</svg>
	{/if}
</div>
{:else}
<Table {data} />
{/if}
</div>
</div>

<Export {data} />