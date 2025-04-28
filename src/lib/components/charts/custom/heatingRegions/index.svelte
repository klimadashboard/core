<script>
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';

	const getData = async () => {
		const directus = getDirectusInstance();
		const regions = await directus.request(
			readItems('regions', {
				limit: -1,
				filter: {
					_and: [
						{
							layer: {
								_eq: 'municipality'
							}
						},
						{
							country: {
								_eq: 'DE'
							}
						}
					]
				},
				fields: ['name', 'code', 'outline_simple']
			})
		);
		// console.log(data);
		console.log(regions);
		return { regions };
	};

	$: promise = getData();

	let selectedRegion = '091880139139';
</script>

<div class="min-h-[90vh]">
	{#await promise then { data, regions }}
		<!--
		<div class="h-80">
			<Map {regions} {data} bind:selectedRegion />
		</div>
        -->
		<Inspector bind:selectedRegion />
	{/await}
</div>
