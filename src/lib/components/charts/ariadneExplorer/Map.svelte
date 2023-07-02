<script>
	import { geoPath, geoAlbers } from 'd3-geo';
	import { scaleLinear } from 'd3-scale';

	let mapWidth;
	let mapHeight;

	export let data;
	export let topo;
	export let selectedFeature = false;

	// $: console.log(data);

	$: bounds = [
		[0, 0],
		[mapWidth - 10, mapHeight - 10]
	];

	$: colorScale = scaleLinear()
		.range([
			'#8b0000',
			'#bf2344',
			'#e45678',
			'#fa8da3',
			'#ffc7c6',
			'#ffffe0',
			'#c2efb1',
			'#94d98e',
			'#6ec171',
			'#4ea859',
			'#308f44'
		])
		.domain([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);

	$: getDataForFeature = (feature) => {
		return data.find((d) => d.code == feature.properties.RS);
	};

	$: getColor = (feature) => {
		const dataForFeature = getDataForFeature(feature);
		if (dataForFeature) return colorScale(dataForFeature['support.rd']);
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
						on:mouseover={() => (selectedFeature = feature)}
						on:focus={() => (selectedFeature = feature)}
						on:mouseout={() => (selectedFeature = false)}
						on:blur={() => (selectedFeature = false)}
						fill={getColor(feature)}
						stroke="#000"
						stroke-width={selectedFeature == feature ? 1 : 0}
						class={selectedFeature && selectedFeature !== feature ? 'opacity-70' : 'opacity-100'}
						id={feature.properties.DEBKG_ID}
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
