<script>
	import { geoPath, geoAlbers } from 'd3-geo';
	import topo from './austria.json';
	import { extent } from 'd3-array';
	import { scaleLinear } from 'd3-scale';
	import formatNumber from '$lib/stores/formatNumber';

	export let data;
	export let label;
	export let key;
	export let colorRange;

	let chartWidth;
	let chartHeight;

	$: bounds = [
		[0, 0],
		[chartWidth, chartHeight]
	];

	$: projection = geoAlbers().center([0, 47.8]).rotate([-13.5, 0]).fitExtent(bounds, topo);

	$: pathGenerator = geoPath().projection(projection);

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
</script>

<div>
	<h3 style="color: {colorRange[1]}" class="font-bold ml-8 mt-8">{label}</h3>
	<div class="w-full h-80 relative" bind:clientHeight={chartHeight} bind:clientWidth={chartWidth}>
		{#if chartHeight && chartWidth}
			<svg width={'100%'} height={'100%'} preserveAspectRatio="xMidYMid meet" class="bg-white">
				<!-- First render all the paths -->
				<g>
					{#each topo.features as feature}
						<path
							d={pathGenerator(feature)}
							fill={getColor(feature)}
							class="stroke-white transition"
						/>
					{/each}
				</g>

				<!-- Then render all the rectangles and text on top of the paths -->
				<g>
					{#each topo.features as feature}
						{#if getValue(feature) !== undefined}
							{#key getValue(feature)}
								<g>
									<rect
										x={pathGenerator.centroid(feature)[0] - 26}
										y={pathGenerator.centroid(feature)[1] - 12}
										width="52"
										height="20"
										fill="white"
										rx="4"
										ry="4"
										opacity="0.5"
									/>
									<text
										x={pathGenerator.centroid(feature)[0]}
										y={pathGenerator.centroid(feature)[1]}
										dy=".2em"
										text-anchor="middle"
										class="fill-black font-bold text-xs"
									>
										{formatNumber(getValue(feature))} TWh
									</text>
								</g>
							{/key}
						{/if}
					{/each}
				</g>
			</svg>
		{/if}
	</div>
</div>
