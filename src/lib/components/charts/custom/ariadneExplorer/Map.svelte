<script>
	import { geoPath, geoAlbers } from 'd3-geo';
	import { scaleApproval } from '$lib/utils/scales';

	let mapWidth;
	let mapHeight;

	export let data;
	export let topo;
	export let selectedFeature = false;

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

<div id="map" bind:clientHeight={mapHeight} bind:clientWidth={mapWidth}>
	{#if mapHeight && mapWidth}
		<svg width={'100%'} height={'100%'}>
			<g>
				{#each topo.features as feature}
					<path
						d={path(feature)}
						on:mouseover={() => (selectedFeature = parseInt(feature.properties.RS))}
						on:focus={() => (selectedFeature = parseInt(feature.properties.RS))}
						on:mouseout={() => (selectedFeature = false)}
						on:blur={() => (selectedFeature = false)}
						fill={getColor(feature)}
						stroke="#000"
						stroke-width={selectedFeature == parseInt(feature.properties.RS) ? 1 : 0}
						class={selectedFeature && selectedFeature !== parseInt(feature.properties.RS)
							? 'opacity-70'
							: 'opacity-100'}
						id={feature.properties.DEBKG_ID}
						role="tooltip"
					/>
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
