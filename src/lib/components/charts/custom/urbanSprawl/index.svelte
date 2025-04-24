<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';
	import Map from './Map.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import Inspector from './Inspector.svelte';

	$: getData = async () => {
		const directus = getDirectusInstance(fetch);
		const data = await directus.request(
			readItems('urban_sprawl', {
				/*
                filter: {
                    country: {
                        _eq: PUBLIC_VERSION
                    }
                },
                */
				sort: ['period'],
				limit: -1
			})
		);
		const regions = await directus.request(
			readItems('regions', {
				filter: {
					_and: [
						{
							country: {
								_eq: PUBLIC_VERSION.toUpperCase()
							}
						},
						{
							layer: {
								_eq: 'district'
							}
						}
					]
				},
				fields: ['name', 'code', 'outline_simple', 'center']
			})
		);

		return { data, regions };
	};

	$: promise = getData();

	$: selectedPeriod = 2020;
	$: selectedVariable = 'pop3';

	let selectedRegion = null;
	let selectedView = 'change';
</script>

<select bind:value={selectedView}>
	<option value="change">change</option>
	<option value="absolute">absolute</option>
</select>

{#if selectedView !== 'change'}
	<select bind:value={selectedVariable}>
		<option value="pop3">pop3</option>
		<option value="pop2">pop2</option>
		<option value="pop1">pop1</option>
	</select>

	<input type="range" bind:value={selectedPeriod} min="1975" max="2020" step="5" />
	{selectedPeriod}
{/if}

<div class="min-h-[80vh]">
	{#await promise}
		<Loader />
	{:then { data, regions }}
		<Map {data} {regions} {selectedView} {selectedPeriod} {selectedVariable} bind:selectedRegion />

		<div
			class="bg-white dark:bg-gray-900 border border-current/10 shadow p-3 rounded-2xl -mt-10 z-30 relative max-w-3xl mx-auto"
		>
			<Inspector bind:selectedRegion {data} {regions} {selectedPeriod} />
		</div>
	{/await}
</div>
