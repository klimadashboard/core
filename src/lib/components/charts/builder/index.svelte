<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import Canvas from './Canvas.svelte';
	import SmallCanvas from './small/SmallCanvas.svelte';
	import { mapAndFilterData } from '$lib/utils/data';

	export let chart;
	export let type = 'regular'; // or small

	$: getData = async function () {
		const directus = getDirectusInstance(fetch);
		const rawData = await directus.request(readItems(chart.table_name, chart.options));
		const data = mapAndFilterData(chart, rawData);
		return data;
	};

	$: promise = getData();
	console.log(type);
</script>

{#await promise then data}
	{#if type == 'regular'}
		<Canvas {data} {chart} />
	{:else}
		<SmallCanvas {data} {chart} />
	{/if}
{/await}
