<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import Canvas from './Canvas.svelte';

	export let chart;

	console.log(chart);

	$: getData = async function () {
		const directus = getDirectusInstance(fetch);
		const rawData = await directus.request(readItems(chart.table_name));
		// todo: add options, sorting,...

		const data = rawData.map((d) => ({
			x: d[chart.x_axis],
			layers: chart.layers.map((l) => ({
				label: l.name,
				y: d[l.y_axis]
			}))
		}));
		return data;
	};

	$: promise = getData();
</script>

{#await promise then data}
	<Canvas {data} {chart} />
{/await}
