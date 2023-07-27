<script>
	import { geoPath, geoAlbers } from 'd3-geo';
	import { scaleApproval } from '$lib/stores/scales';

	let mapWidth;
	$: mapHeight = mapWidth * 1.3;

	export let data;
	export let topo;

	// $: console.log(data);

	$: bounds = [
		[0, 0],
		[mapWidth - 10, mapHeight - 10]
	];

	$: getDataForFeature = (feature) => {
		return data.find((d) => d.code == feature.properties.RS);
	};

	$: getColor = (feature) => {
		const dataForFeature = getDataForFeature(feature);
		if (dataForFeature) return scaleApproval(dataForFeature['support.rd']);
	};

	$: projection = geoAlbers().center([0, 47.8]).rotate([-13.5, 0]).fitExtent(bounds, topo);
	$: path = geoPath(projection);
</script>

<div id="map" class="w-full my-4" style="height: {mapHeight}px" bind:clientWidth={mapWidth}>
	{#if mapHeight && mapWidth}
		<svg width={'100%'} height={'100%'}>
			<g>
				{#each topo.features as feature}
					<path d={path(feature)} fill={getColor(feature)} id={feature.properties.DEBKG_ID} />
				{/each}
			</g>
		</svg>
	{/if}
</div>

<style>
	#map {
		height: 400px;
	}
</style>
