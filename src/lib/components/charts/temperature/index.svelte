<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems, readItem } from '@directus/sdk';
	import Wrapper from './Wrapper.svelte';
	import StationPicker from './StationPicker.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	let selectedStation;

	let tableName = PUBLIC_VERSION == 'de' ? 'de_dwd_data' : 'at_geosphere_data';

	$: console.log(selectedStation);

	async function getData() {
		const directus = getDirectusInstance(fetch);
		if (selectedStation) {
			const data = await directus.request(
				readItems(tableName, {
					filter: {
						station: {
							id: {
								_eq: parseInt(selectedStation.id)
							}
						}
					},
					limit: -1
				})
			);
			return data;
		} else {
			return false;
		}
	}

	$: promise = getData();

	$: if (selectedStation) {
		promise = getData();
	}
</script>

<div>
	<StationPicker bind:selectedStation />

	{#await promise}
		<Loader showText={true} />
	{:then data}
		<Wrapper {data} {selectedStation} />
	{:catch error}
		{error}
	{/await}
</div>
