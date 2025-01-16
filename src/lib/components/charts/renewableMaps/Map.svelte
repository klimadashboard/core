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

	const OFFSET_POSITIONS = [
		[0, 0], // center (default)
		[0, -15], // top
		[0, 15], // bottom
		[-15, 0], // left
		[15, 0] // right
	];

	let placedLabels = [];

	function checkOverlap(rect1, rect2) {
		return !(
			rect1.x + rect1.width < rect2.x ||
			rect1.x > rect2.x + rect2.width ||
			rect1.y + rect1.height < rect2.y ||
			rect1.y > rect2.y + rect2.height
		);
	}

	function findBestPosition(feature) {
		const centroid = pathGenerator.centroid(feature);
		let bestPosition = OFFSET_POSITIONS[0];
		let minOverlaps = Infinity;

		OFFSET_POSITIONS.forEach(([offsetX, offsetY]) => {
			const testRect = {
				x: centroid[0] - 26 + offsetX,
				y: centroid[1] - 12 + offsetY,
				width: 52,
				height: 20
			};

			const overlaps = placedLabels.filter((label) => checkOverlap(testRect, label)).length;

			if (overlaps < minOverlaps) {
				minOverlaps = overlaps;
				bestPosition = [offsetX, offsetY];
			}
		});

		const finalRect = {
			x: centroid[0] - 26 + bestPosition[0],
			y: centroid[1] - 12 + bestPosition[1],
			width: 52,
			height: 20
		};

		placedLabels.push(finalRect);
		return bestPosition;
	}

	$: {
		if (data) {
			placedLabels = [];
		}
	}
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
							{@const position = findBestPosition(feature)}
							{@const centroid = pathGenerator.centroid(feature)}
							{#key getValue(feature)}
								<g>
									<rect
										x={centroid[0] - 26 + position[0]}
										y={centroid[1] - 12 + position[1]}
										width="52"
										height="20"
										fill="white"
										rx="4"
										ry="4"
										opacity="0.5"
									/>
									<text
										x={centroid[0] + position[0]}
										y={centroid[1] + position[1]}
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
