<script>
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';

	let selectedRegion;

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
				fields: ['name', 'code', 'outline_simple', 'population', 'center']
			})
		);
		// console.log(data);
		console.log(regions);
		selectedRegion = regions.find((d) => d.code === '091880139139');
		return { regions };
	};

	$: promise = getData();
</script>

<div class="min-h-[90vh]">
	{#await promise then { data, regions }}
		<!--
		<div class="h-80">
			<Map {regions} {data} bind:selectedRegion />
		</div>
        -->
		<Inspector {regions} bind:selectedRegion />
	{/await}
</div>
