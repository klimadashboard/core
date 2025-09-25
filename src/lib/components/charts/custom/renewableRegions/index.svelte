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
	let selectedLayer = page.data.page?.layer == 'district' ? 'districts' : 'municipalities';

	const colors = [
		{ key: 'solar', colors: ['#F0E1C2', '#E0A906'] },
		{ key: 'wind', colors: ['#E5F3FA', '#003B80'] }
	];

	let selectedEnergy = 'solar';
	let views = [
		{ key: 'solar', label: 'Solar', color: colors.find((c) => c.key === 'solar').colors },
		{ key: 'wind', label: 'Wind', color: colors.find((c) => c.key === 'wind').colors }
	];

	const fetchRegions = async () => {
		const regions = await getRegions().then((r) =>
			r.map((r) => ({
				...r,
				code: r.code_short ? r.code_short : r.code
			}))
		);

		console.log(regions);

		const foundRegion = findMatchingRegion(page.data.page, regions, true);
		selectedRegion = foundRegion || regions.find((d) => d.layer == 'country');

		return regions;
	};

	$: promise = fetchRegions();
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
	{:then regions}
		<div class="h-[38rem]">
			<Map
				colors={colors.find((c) => c.key === selectedEnergy).colors}
				{regions}
				{selectedEnergy}
				bind:selectedRegion
				bind:selectedLayer
				on:selectRegion={(e) => (selectedRegion = regions.find((d) => d.code == e.detail))}
			/>
		</div>
		<div
			class="bg-white dark:bg-gray-900 border border-current/10 shadow p-3 rounded-2xl -mt-10 z-30 relative max-w-3xl mx-auto"
		>
			<Inspector
				colors={colors.find((c) => c.key === selectedEnergy).colors}
				{regions}
				{selectedEnergy}
				region={selectedRegion}
				bind:selectedRegion
			/>
		</div>
	{:catch error}
		<p>{error.message}</p>
	{/await}
</div>
