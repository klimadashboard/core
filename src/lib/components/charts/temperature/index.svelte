<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems, readItem } from '@directus/sdk';
	import Wrapper from './Wrapper.svelte';
	import StationPicker from './StationPicker.svelte';
	import Loader from '$lib/components/Loader.svelte';

	let selectedStation;

	async function getData() {
		const directus = getDirectusInstance(fetch);
		if (selectedStation) {
			const data = await directus.request(
				readItems('at_geosphere_data', {
					filter: {
						station: {
							id: {
								_eq: selectedStation.id
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
		<Loader />
	{:then data}
		<Wrapper {data} {selectedStation} />
	{:catch error}
		{error}
	{/await}
</div>
