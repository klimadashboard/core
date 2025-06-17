<script>
	import { getRegions } from '@/lib/utils/regions';
	import formatNumber from '$lib/stores/formatNumber';

	export let data;

	let relatedRegions = [];
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

	async function loadRegions(region) {
		regions = await getRegions();

		const otherRegions = regions.filter((r) => r.id !== region.id && r.center && r.population);

		const closestByLocation = [...otherRegions]
			.sort(
				(a, b) =>
					haversineDistance(region.center, a.center) - haversineDistance(region.center, b.center)
			)
			.slice(0, 7);

		const closestByPopulation = [...otherRegions]
			.filter((r) => !closestByLocation.find((cr) => cr.id === r.id))
			.sort(
				(a, b) =>
					Math.abs(region.population - a.population) - Math.abs(region.population - b.population)
			)[0];

		relatedRegions = [...closestByLocation, closestByPopulation];
	}

	// Reactively re-run when `page.data.page` changes
	$: if (data.page) loadRegions(data.page);
</script>

{#if relatedRegions.length > 0}
	<div class="container">
		<h3 class="text-sm pb-1 border-b border-b-current/20 mb-2">Entdecke weitere Regionen</h3>
	</div>
	<div class="grid grid-cols-2 gap-1 md:grid-cols-4 my-1">
		{#each relatedRegions as region, i}
			<a
				class="rounded-2xl bg-gray-50 dark:bg-gray-900 p-4 hover:bg-current/10"
				href="/regions/{region.id}"
			>
				<p class="uppercase font-bold tracking-wide text-sm">
					{i < 7 ? 'In der Nähe' : 'Ähnliche Bevölkerung'}
				</p>
				<h3 class="text-2xl md:text-3xl hyphens-auto leading-none my-1">{region.name}</h3>
				<p>{formatNumber(region.population)} Einwohner</p>
			</a>
		{/each}
	</div>
{/if}
