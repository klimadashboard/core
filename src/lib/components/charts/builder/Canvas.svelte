<script>
	import XAxis from './XAxis.svelte';
	import YAxis from './YAxis.svelte';
	import Bar from './Bar.svelte';
	import Line from './Line.svelte';
	import Table from './Table.svelte';
	import Export from './Export.svelte';
	import XAxisConfig from './XAxisConfig.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import Tooltip from './Tooltip.svelte';

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
			bottom: 20,
			left: 70
		}
	};

	let activeView = 'chart';

	const views = [
		{
			key: 'chart',
			label: 'Chart'
		},
		{
			key: 'table',
			label: 'Table'
		}
	];
</script>

<div class="mb-4">
	<Switch
		{views}
		{activeView}
		on:itemClick={(event) => {
			activeView = event.detail;
		}}
	/>

	<div class="h-[400px]">
		{#if activeView == 'chart' && data.length > 0}
			<div
				bind:clientWidth={chartWidth}
				bind:clientHeight={chartHeight}
				class="h-full mt-4 relative"
			>
				{#if chartWidth && chartHeight}
					<svg width={'100%'} height={'100%'} class="overflow-visible text-current">
						<XAxis {chartWidth} {chartHeight} {data} {options} />

						{#each chart.layers as layer}
							<YAxis
								{chartWidth}
								{chartHeight}
								{layer}
								data={data.map((d) => d.layers.find((d) => d.label == layer.name))}
								{options}
							/>
							<g transform="translate({options.margin.left},0)" style="color: {layer.color}">
								<svelte:component
									this={layerTypes.find((d) => d.key == layer.type)?.component}
									{data}
									{layer}
									{chartWidth}
									{chartHeight}
									{options}
								/>
							</g>
						{/each}
					</svg>
				{/if}
				<Tooltip {chartWidth} {chartHeight} {data} {options} />
			</div>
			<XAxisConfig {data} {chart} />
		{:else}
			<Table {data} />
		{/if}
	</div>
</div>

<Export {data} />
