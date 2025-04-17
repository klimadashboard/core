<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';
	import Map from './Map.svelte';
	import Loader from '$lib/components/Loader.svelte';

	$: getData = async (selectedPeriod, selectedVariable) => {
		const directus = getDirectusInstance(fetch);
		const rawData = await directus.request(
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
				fields: ['name', 'code', 'outline_simple']
			})
		);
		const filteredData = rawData.filter((d) => parseInt(d.period) == selectedPeriod);
		const filteredDataForVariable = filteredData.filter((d) => d.category == selectedVariable);
		const data = filteredDataForVariable.map((d) => ({
			region: d.region,
			value:
				d.value / filteredData.find((d) => d.region == d.region && d.category == 'population').value
		}));
		return { data, regions };
	};

	$: promise = getData(selectedPeriod, selectedVariable);

	$: selectedPeriod = 2020;
	$: selectedVariable = 'pop3';
	$: console.log(selectedPeriod, selectedVariable);
</script>

<select bind:value={selectedVariable}>
	<option value="pop3">pop3</option>
	<option value="pop2">pop2</option>
	<option value="pop1">pop1</option>
</select>

<input type="range" bind:value={selectedPeriod} min="1975" max="2020" step="5" />
{selectedPeriod}

{#await promise}
	<Loader />
{:then { data, regions }}
	<Map {data} {regions} />
{/await}
