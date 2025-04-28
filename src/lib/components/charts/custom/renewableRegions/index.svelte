<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import Loader from '$lib/components/Loader.svelte';
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	const colors = [
		{
			key: 'wind',
			colors: ['#E5F3FA', '#003B80']
		},
		{
			key: 'solar',
			colors: ['#F0E1C2', '#E0A906']
		}
	];

	$: getData = async (selectedEnergy) => {
		const response = await fetch(
			`https://base.klimadashboard.org/get-region-stats-for-renewables?table=energy_${selectedEnergy}_units`
		);
		const data = await response.json();

		const directus = getDirectusInstance();
		const regionsRaw = await directus.request(
			readItems('regions', {
				fields: ['id', 'name', 'code_short', 'outline_simple', 'center'],
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
			code: r.code_short,
			outline: r.outline_simple
		}));

		const countryName = PUBLIC_VERSION;

		console.log(regions);
		console.log(data);
		return { data, regions, countryName };
	};

	$: promise = getData(selectedEnergy);

	$: getRegionData = (regions, selectedRegion, countryName) => {
		const name = regions.find((d) => d.code == selectedRegion)?.name || countryName;
		return {
			name,
			code: selectedRegion,
			center: regions.find((d) => d.code == selectedRegion)?.center
		};
	};

	let selectedRegion;
	let selectedEnergy = 'wind';
	let views = [
		{
			key: 'wind',
			label: 'Wind',
			color: '#003B80'
		},
		{
			key: 'solar',
			label: 'Solar',
			color: '#E0A906'
		}
	];
</script>

<Switch
	{views}
	bind:activeView={selectedEnergy}
	on:itemClick={(e) => (selectedEnergy = e.detail)}
/>

<div class="min-h-[70vh]">
	{#await promise}
		<Loader />
	{:then { data, regions, countryName }}
		<div class="h-96">
			<Map
				colors={colors.find((c) => c.key === selectedEnergy).colors}
				{data}
				{regions}
				{selectedEnergy}
				bind:selectedRegion
				on:selectRegion={(e) => (selectedRegion = e.detail)}
			/>
		</div>
		<div
			class="bg-white dark:bg-gray-900 border border-current/10 shadow p-3 rounded-2xl -mt-10 z-30 relative max-w-3xl mx-auto"
		>
			<Inspector
				colors={colors.find((c) => c.key === selectedEnergy).colors}
				{regions}
				{data}
				{selectedEnergy}
				region={getRegionData(regions, selectedRegion, countryName)}
				bind:selectedRegion
			/>
		</div>
	{/await}
</div>
