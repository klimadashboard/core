<script>
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { findMatchingRegion } from '$lib/utils/findMatchingRegion';
	import { page } from '$app/state';

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
				fields: ['id', 'name', 'code', 'outline_simple', 'population', 'center']
			})
		);

		const foundRegionCode = findMatchingRegion(page.data.page, regions);

		if (foundRegionCode) {
			selectedRegion = regions.find((d) => d.code == foundRegionCode);
		}

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
