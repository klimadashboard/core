<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import Loader from '$lib/components/Loader.svelte';
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { findMatchingRegion } from '$lib/utils/findMatchingRegion';
	import { page } from '$app/state';

	let selectedRegion;

	const colors = [
		{ key: 'wind', colors: ['#E5F3FA', '#003B80'] },
		{ key: 'solar', colors: ['#F0E1C2', '#E0A906'] }
	];

	let selectedEnergy = 'solar';
	let views = [
		{ key: 'solar', label: 'Solar', color: '#E0A906' },
		{ key: 'wind', label: 'Wind', color: '#003B80' }
	];

	// --- In-memory cache (lost on full reload) ---
	let cachedRegions = null;
	let cachedCountryName = null;

	const fetchRegions = async () => {
		if (cachedRegions) return { regions: cachedRegions, countryName: cachedCountryName };

		const directus = getDirectusInstance();
		const regionsRaw = await directus.request(
			readItems('regions', {
				fields: ['id', 'name', 'code_short', 'outline_simple', 'center', 'area'],
				filter: {
					_and: [
						{
							country: { _eq: PUBLIC_VERSION.toUpperCase() },
							_or: [{ layer: { _eq: 'municipality' } }, { layer: { _eq: 'country' } }]
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

		cachedRegions = regions;
		cachedCountryName = PUBLIC_VERSION;

		return { regions, countryName: PUBLIC_VERSION };
	};

	$: getData = async (selectedEnergy) => {
		const [{ regions, countryName }, data] = await Promise.all([
			fetchRegions(),
			fetch(
				`https://base.klimadashboard.org/get-region-stats-for-renewables?table=energy_${selectedEnergy}_units`
			).then((r) => r.json())
		]);

		const foundRegionCode = findMatchingRegion(page.data.page, regions);
		if (foundRegionCode) {
			selectedRegion = foundRegionCode;
		}

		return { data, regions, countryName };
	};

	$: promise = getData(selectedEnergy);

	$: getRegionData = (regions, selectedRegion, countryName) => {
		const region = regions.find((d) => d.code == selectedRegion);
		return {
			name: region?.name || countryName,
			code: selectedRegion,
			center: region?.center,
			area: region?.area
		};
	};
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
