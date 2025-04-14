<script>
	import Map from './Map.svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';

	$: getData = async () => {
		const directus = getDirectusInstance();
		const data = await directus.request(
			readItems('energy_wind_units', {
				limit: -1,
				fields: ['lat', 'lon']
			})
		);
		return data;
	};

	$: promise = getData();
</script>

<div>
	{#await promise then data}
		<Map {data} />
	{/await}
</div>
