<script>
	import { getRegions } from '@/lib/utils/regions';
	import { page } from '$app/state';
	import formatNumber from '$lib/stores/formatNumber';

	export let relatedRegions = [];

	let region = page.data.page;
	let regions = [];

	function haversineDistance([lng1, lat1], [lng2, lat2]) {
		lng1 = parseFloat(lng1);
		lat1 = parseFloat(lat1);
		lng2 = parseFloat(lng2);
		lat2 = parseFloat(lat2);
		const toRad = (x) => (x * Math.PI) / 180;
		const R = 6371; // km
		const dLat = toRad(lat2 - lat1);
		const dLng = toRad(lng2 - lng1);
		const a =
			Math.sin(dLat / 2) ** 2 +
			Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

	async function loadRegions() {
		regions = await getRegions();

		// Filter out current region
		const otherRegions = regions.filter((r) => r.id !== region.id && r.center && r.population);

		// Find 3 closest by geographic distance
		const closestByLocation = [...otherRegions]
			.sort(
				(a, b) =>
					haversineDistance(region.center, a.center) - haversineDistance(region.center, b.center)
			)
			.slice(0, 7);

		// Find 1 most similar by population
		const closestByPopulation = [...otherRegions]
			.filter((r) => !closestByLocation.find((cr) => cr.id === r.id)) // avoid duplicates
			.sort(
				(a, b) =>
					Math.abs(region.population - a.population) - Math.abs(region.population - b.population)
			)[0];

		// Prepare relatedRegions with labels
		relatedRegions = [...closestByLocation, closestByPopulation];
		console.log(relatedRegions);
	}

	loadRegions();

	$: console.log(region);
	$: console.log(relatedRegions);
</script>

<div class="grid grid-cols-2 gap-1 md:grid-cols-4 my-1">
	{#each relatedRegions as region, i}
		<a
			class="rounded-2xl bg-gray-50 dark:bg-gray-900 p-4 hover:bg-current/10"
			href="/regions/{region.id}"
		>
			<p class="uppercase font-bold tracking-wide text-sm">
				{i < 7 ? 'In der Nähe' : 'Ähnliche Bevölkerung'}
			</p>
			<h3 class="text-3xl">{region.name}</h3>
			<p>{formatNumber(region.population)} Einwohner*innen</p>
		</a>
	{/each}
</div>
