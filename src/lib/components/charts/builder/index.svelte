<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import Canvas from './Canvas.svelte';
	import SmallCanvas from './small/SmallCanvas.svelte';

	export let chart;
	export let type = 'regular'; // or small

	$: getData = async function () {
		const directus = getDirectusInstance(fetch);
		const rawData = await directus.request(readItems(chart.table_name, chart.options));

		const data = rawData.map((d) => ({
			x: d[chart.x_axis],
			x_axis_name: chart.x_axis_name,
			layers: chart.layers.map((l) => ({
				label: l.name,
				y: d[l.y_axis],
				unit: d.unit,
				type: l.type
			}))
		}));
		return data;
	};

	$: promise = getData();
</script>

{#await promise then data}
	{#if type == 'regular'}
		<Canvas {data} {chart} />
	{:else}
		<SmallCanvas {data} {chart} />
	{/if}
{/await}
