<script>
	import { geoPath, geoAlbers } from 'd3-geo';
	import topo from './austria.json';
	import { min, extent, max } from 'd3-array';
	import { scaleLinear, scaleOrdinal, scaleBand } from 'd3-scale';
	import formatNumber from '$lib/stores/formatNumber';

	export let data;
	export let label;
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
		const dataForFeature = getValue(feature);
		if (!isNaN(dataForFeature)) {
			return colorScale(dataForFeature);
		}
	};

	$: getValue = (feature) => {
		return data[feature.properties['name']][key];
	};

	$: currentState = false;
</script>

<div class="w-full h-80 relative" bind:clientHeight={chartHeight} bind:clientWidth={chartWidth}>
	{#if chartHeight && chartWidth}
		<svg width={'100%'} height={'100%'} preserveAspectRatio="xMidYMid meet" class="bg-white">
			<g>
				{#each topo.features as feature}
					<path
						d={geoPath().projection(projection)(feature)}
						fill={getColor(feature)}
						class="{currentState && currentState !== feature
							? 'opacity-50'
							: 'opacity-100'} stroke-white transition"
						on:mouseover={() => (currentState = feature)}
						on:mouseout={() => (currentState = false)}
					/>
				{/each}</g
			>
		</svg>
	{/if}
	<div
		class="text-center text-sm font-bold absolute bottom-0 w-full leading-tight"
		style="color: {colorRange[1]}"
	>
		<p class=" uppercase">
			{label}
		</p>
		{#if currentState}
			<p>{formatNumber(getValue(currentState))} TWh in {currentState.properties.name}</p>
		{/if}
	</div>
</div>
