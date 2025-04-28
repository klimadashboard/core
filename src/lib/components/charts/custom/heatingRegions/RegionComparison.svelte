<script>
	import { getDataForSelectedRegion } from './getData';
	import formatNumber from '$lib/stores/formatNumber';

	export let regions;
	export let selectedRegion;
	export let categories;

	const cityRegions = ['091620000000', '110000000000', '020000000000'];

	const getDistance = (center1, center2) => {
		const R = 6371; // Earth's radius in km
		const lat1 = parseFloat(center1[1]);
		const lon1 = parseFloat(center1[0]);
		const lat2 = parseFloat(center2[1]);
		const lon2 = parseFloat(center2[0]);
		const dLat = (lat2 - lat1) * (Math.PI / 180);
		const dLon = (lon2 - lon1) * (Math.PI / 180);
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(lat1 * (Math.PI / 180)) *
				Math.cos(lat2 * (Math.PI / 180)) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	};

	$: regionsWithDistance = regions
		.map((region) => ({
			...region,
			distance: getDistance(selectedRegion.center, region.center) || Infinity
		}))
		.sort((a, b) => a.distance - b.distance);

	$: shownRegions =
		selectedRegion.population > 100000
			? regions.filter((d) => cityRegions.includes(d.code))
			: regionsWithDistance.slice(0, 5);
</script>

<ul class="mt-2">
	{#each shownRegions.filter((d) => d.code !== selectedRegion.code) as region}
		<li class="border-t py-2 border-current/20">
			<p class="font-bold text-lg">
				{region.name}
				{#if region.distance < 20}
					<span class="font-normal">| in der Nähe</span>{/if}
			</p>
			<div class="grid grid-cols-2 gap-2 md:grid-cols-4 leading-snug">
				{#each categories.filter((d) => d.featured) as category}
					<div class="" style="color: {category.color}">
						<p class="font-bold">{category.label}</p>
						{#await getDataForSelectedRegion(region.code) then data}
							<p>
								<strong
									>{formatNumber(
										data?.find((d) => d.category == category.key)?.percentage
									)}%</strong
								>
								| Anzahl: {formatNumber(data?.find((d) => d.category == category.key)?.value)}
							</p>
							<div class="mt-1">
								<div
									class="bg-current h-2 rounded-full"
									style="width: {data?.find((d) => d.category == category.key)?.percentage}%"
								></div>
							</div>
						{/await}
					</div>
				{/each}
			</div>
		</li>
	{/each}
</ul>
