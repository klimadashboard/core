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
	import { getRegions } from '$lib/utils/regions';

	let selectedRegion;

	const colors = [
		{ key: 'solar', colors: ['#F0E1C2', '#E0A906'] },
		{ key: 'wind', colors: ['#E5F3FA', '#003B80'] }
	];

	let selectedEnergy = 'solar';
	let views = [
		{ key: 'solar', label: 'Solar', color: colors.find((c) => c.key === 'solar').colors },
		{ key: 'wind', label: 'Wind', color: colors.find((c) => c.key === 'wind').colors }
	];

	// --- In-memory cache (lost on full reload) ---
	let cachedRegions = null;

	const fetchRegions = async () => {
		// if (cachedRegions) return { regions: cachedRegions, countryName: cachedCountryName };

		const regionsRaw = await getRegions().then((r) =>
			r.filter(
				(r) =>
					r.country === PUBLIC_VERSION.toUpperCase() &&
					(r.layer == 'country' || r.layer == 'state' || r.layer == 'municipality')
			)
		);

		const regions = regionsRaw
			.filter((d) => d.visible)
			.map((r) => ({
				...r,
				code: r.code_short ? r.code_short : r.code,
				outline: r.outline_simple
			}));

		cachedRegions = regions;

		return regions;
	};

	async function getData(selectedEnergy) {
		try {
			const [regions, data] = await Promise.all([
				fetchRegions(),
				fetch(
					`https://base.klimadashboard.org/get-region-stats-for-renewables?table=energy_${selectedEnergy}_units`
				).then((r) => r.json())
			]);

			const foundRegion = findMatchingRegion(page.data.page, regions, true);
			selectedRegion = foundRegion || regions.find((d) => d.layer == 'country');
			return { data, regions };
		} catch (err) {
			console.error('Error in getData:', err);
			throw err;
		}
	}

	$: promise = getData(selectedEnergy);
</script>

<Switch
	{views}
	bind:activeView={selectedEnergy}
	on:itemClick={(e) => (selectedEnergy = e.detail)}
/>

<div class="my-4">
	{#await promise}
		<div class="bg-amber-400/10 rounded-2xl h-[38rem] animate-pulse"></div>
		<div
			class="rounded-2xl h-[38rem] bg-white dark:bg-gray-900 shadow p-3 animate-pulse -mt-10 max-w-3xl mx-auto relative z-30"
		>
			<div class="h-8 w-64 bg-current/20 animate-pulse rounded"></div>
			<div class="h-64 w-full bg-current/20 animate-pulse mt-4 rounded"></div>
		</div>
	{:then { data, regions }}
		<div class="h-[38rem]">
			<Map
				colors={colors.find((c) => c.key === selectedEnergy).colors}
				{data}
				{regions}
				{selectedEnergy}
				bind:selectedRegion
				on:selectRegion={(e) => (selectedRegion = regions.find((d) => d.code == e.detail))}
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
				region={selectedRegion}
				bind:selectedRegion
			/>
		</div>
	{:catch error}
		<p>{error.message}</p>
	{/await}
</div>
