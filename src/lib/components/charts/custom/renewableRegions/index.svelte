<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import Loader from '$lib/components/Loader.svelte';
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	$: getData = async () => {
		const response = await fetch(
			'https://base.klimadashboard.org/get-region-stats-for-renewables?table=energy_solar_units'
		);
		const data = await response.json();

		const directus = getDirectusInstance();
		const regionsRaw = await directus.request(
			readItems('regions', {
				fields: ['id', 'name', 'code', 'outline_simple', 'center'],
				filter: {
					_and: [
						{
							country: { _eq: PUBLIC_VERSION.toUpperCase() },
							layer: { _eq: 'municipality' }
						}
					]
				},
				limit: -1
			})
		);

		const regions = regionsRaw.map((r) => ({
			...r,
			outline: r.outline_simple
		}));

		const countryName = PUBLIC_VERSION;

		console.log(regions);
		console.log(data);
		return { data, regions, countryName };
	};

	$: promise = getData();

	$: getRegionData = (regions, selectedRegion, countryName) => {
		const name = regions.find((d) => d.code == selectedRegion)?.name || countryName;
		return { name, code: selectedRegion };
	};

	let selectedRegion;
	let selectedEnergy = 'wind';
</script>

<select bind:value={selectedEnergy}>
	<option value="wind">Wind</option>
	<option value="solar">Solar</option>
</select>

<div class="min-h-[70vh]">
	{#await promise}
		<Loader />
	{:then { data, regions, countryName }}
		<div class="h-96">
			<Map
				{data}
				{regions}
				bind:selectedRegion
				on:selectRegion={(e) => (selectedRegion = e.detail)}
			/>
		</div>
		<div
			class="bg-white dark:bg-gray-900 border border-current/10 shadow p-3 rounded-2xl -mt-10 z-30 relative max-w-3xl mx-auto"
		>
			<Inspector region={getRegionData(regions, selectedRegion, countryName)} bind:selectedRegion />
		</div>
	{/await}
</div>
