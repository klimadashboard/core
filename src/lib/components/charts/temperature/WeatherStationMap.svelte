<script>
	import { geoPath, geoAlbers } from 'd3-geo';
	import { scaleLinear } from 'd3-scale';
	import { max, min } from 'd3-array';

	export let data;
	export let selectedStation;

	let mapWidth;
	let mapHeight;

	$: projection = geoAlbers()
		.center([0, 47.8])
		.rotate([-13.5, 0])
		.fitExtent([0, 0], [mapWidth, mapHeight], data.geo);

	const colors = ['#209857', '#5774DB']; // from green to blue
	const selectedColor = '#C7495C';

	$: getColor = function (station) {
		const colorScale = scaleLinear().range(colors).domain([0, 3100]);
		return colorScale(station.height);
	};

	const radi = [5, 8];

	$: getRadius = function (station) {
		const radiusScale = scaleLinear()
			.range(radi)
			.domain([min(data, (d) => d.height), max(data, (d) => d.height)]);
		return radiusScale(station.height);
	};

	$: isSelected = function (station) {
		return selectedStation == station.id;
	};

	$: console.log(data);
</script>

<div id="map" class="h-80" bind:clientHeight={mapHeight} bind:clientWidth={mapWidth}>
	{#if mapHeight && mapWidth}
		<svg width={'100%'} height={'100%'}>
			<g>
				{#each data.geo.features as feature}
					<path
						d={geoPath().projection(projection)(feature)}
						class="fill-gray-200 stroke-white stroke-1 shadow"
					/>
				{/each}
			</g>
			<g>
				{#each data.stations as station}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<g
						transform="translate({projection([station.longitude, station.latitude])})"
						on:click={() => (selectedStation = station)}
						cursor="pointer"
					>
						<circle
							r={getRadius(station)}
							fill={isSelected(station) ? selectedColor : getColor(station)}
							class="opacity-70"
						/>
					</g>
				{/each}
			</g>
		</svg>
	{/if}
</div>
