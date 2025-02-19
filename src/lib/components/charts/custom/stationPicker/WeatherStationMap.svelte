<script>
	import { geoPath, geoAlbers } from 'd3-geo';
	import { scaleLinear } from 'd3-scale';
	import { max, min } from 'd3-array';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let data;
	export let selectedStation;

	let mapWidth;
	let mapHeight;

	// Projection scaled to fit the provided GeoJSON
	// (Germany or Austria, depending on PUBLIC_VERSION)
	$: projection = geoAlbers()
		.center([0, 47.8])
		.rotate([-13.5, 0])
		.fitExtent(
			[
				[10, 10],
				[mapWidth - 20, mapHeight - 20]
			],
			data.geo
		);

	// Simple color and radius scales
	const colorScale = scaleLinear().range(['#209857', '#fdea45']).domain([0, 3000]);
	const radiusScale = scaleLinear()
		.range([5, 5])
		.domain([min(data.stations, (d) => d.height), max(data.stations, (d) => d.height)]);

	function getColor(station) {
		return colorScale(station.height);
	}

	function getRadius(station) {
		return radiusScale(station.height);
	}

	function isSelected(station) {
		return selectedStation?.id === station.id;
	}

	function selectStation(station) {
		// Update selectedStation directly
		selectedStation = { ...station };
	}
</script>

<div
	id="map"
	class={PUBLIC_VERSION == 'at' ? 'h-56' : 'h-96'}
	bind:clientHeight={mapHeight}
	bind:clientWidth={mapWidth}
>
	{#if mapHeight && mapWidth}
		<svg width="100%" height="100%">
			<!-- The country outline -->
			<g>
				{#each data.geo.features as feature}
					<path
						d={geoPath().projection(projection)(feature)}
						class="fill-current/10 stroke-white stroke-1 shadow-sm"
					/>
				{/each}
			</g>

			<!-- Weather stations -->
			<g>
				{#each data.stations as station}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<g
						transform="translate({projection([station.longitude, station.latitude])})"
						role="button"
						tabindex="0"
						cursor="pointer"
						on:click={() => selectStation(station)}
					>
						<circle
							r={getRadius(station)}
							fill={isSelected(station) ? '#C7495C' : getColor(station)}
							class="opacity-70"
						/>
						{#if isSelected(station)}
							<circle r={getRadius(station)} fill="#C7495C" class="animate-ping" />
						{/if}
					</g>
				{/each}
			</g>
		</svg>
	{/if}
</div>

<div class="w-max mx-auto flex items-center gap-2 text-sm mb-8">
	<span>0m Seehöhe</span>
	<div
		class="w-24 h-3 bg-gray-100"
		style="background: linear-gradient(90deg, #209857 0%, #fdea45 100%);"
	></div>
	<span>3.000m</span>
</div>
