<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems, readItem } from '@directus/sdk';
	import Loader from '$lib/components/Loader.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import Chart from './Chart.svelte';

	let selectedStation = 101;

	let tableName = PUBLIC_VERSION == 'de' ? 'de_dwd_data' : 'at_geosphere_data';

	async function getData() {
		const directus = getDirectusInstance(fetch);
		if (selectedStation) {
			const data = await directus.request(
				readItems(tableName, {
					fields: ['date', 'sh'],
					filter: {
						_and: [
							{
								station: {
									id: {
										_eq: parseInt(3379)
									}
								}
							}
						]
					},
					limit: -1
				})
			);
			console.log(data);
			return data;
		} else {
			return false;
		}
	}

	$: promise = getData();
</script>

<div>
	{#await promise}
		<Loader showText={true} />
	{:then data}
		<Chart {data} />
	{:catch error}
		{error}
	{/await}
</div>
