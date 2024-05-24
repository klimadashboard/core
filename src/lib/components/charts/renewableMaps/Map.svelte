<script>
	import { geoPath, geoAlbers } from 'd3-geo';
	import topo from './austria.json';
	import { min, extent, max } from 'd3-array';
	import { scaleLinear, scaleOrdinal, scaleBand } from 'd3-scale';

	export let data;
	export let key;
	export let colorRange;

	let chartWidth;
	let chartHeight;

	$: projection = geoAlbers().center([0, 47.8]).rotate([-13.5, 0]).fitExtent(bounds, topo);

	$: bounds = [
		[0, 0],
		[chartWidth, chartHeight]
	];

	$: domain = extent(Object.values(data).map((d) => d[key]));

	$: colorScale = scaleLinear().range(colorRange).domain(domain);

	$: getColor = (feature) => {
		const dataForFeature = data[feature.properties['name']][key];
		if (!isNaN(dataForFeature)) {
			return colorScale(dataForFeature);
		}
	};
</script>

<div class="w-full h-80" bind:clientHeight={chartHeight} bind:clientWidth={chartWidth}>
	{#if chartHeight && chartWidth}
		<svg width={'100%'} height={'100%'} preserveAspectRatio="xMidYMid meet" class="bg-white">
			<g>
				{#each topo.features as feature}
					<path
						d={geoPath().projection(projection)(feature)}
						fill={getColor(feature)}
						stroke="#FFFFFF"
					/>
				{/each}</g
			>
		</svg>
	{/if}
</div>
