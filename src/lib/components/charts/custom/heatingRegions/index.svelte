<script>
	import Inspector from './Inspector.svelte';
	import { findMatchingRegion } from '$lib/utils/findMatchingRegion';
	import { page } from '$app/state';
	import { getRegions } from '$lib/utils/regions';

	let selectedRegion;

	async function getData() {
		// load DE municipalities + districts
		const regions = await getRegions().then((r) =>
			r.filter((r) => r.country === 'DE' && (r.layer === 'municipality' || r.layer === 'district'))
		);

		const foundRegionCode = findMatchingRegion(page.data.page, regions);
		if (foundRegionCode) {
			selectedRegion = regions.find((d) => d.code == foundRegionCode);
		}
		console.log(regions);

		return { regions };
	}

	$: promise = getData();
</script>

<div class="min-h-[90vh]">
	{#await promise then { regions }}
		<Inspector {regions} bind:selectedRegion />
	{/await}
</div>
