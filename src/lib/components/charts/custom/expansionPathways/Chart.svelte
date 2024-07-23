<script>
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { area, line } from 'd3-shape';
	import { max } from 'd3-array';
	import dayjs from 'dayjs';

	export let dataProduction;
	export let dataGoals;
	export let type;
	export let unifiedScaling;

	let chartWidth;
	let chartHeight;

	const keys = ['goal', 'production'];
	const colors = ['#A3A3A3', type.color];

	$: xScale = scaleTime()
		.range([0, chartWidth])
		.domain([new Date(2015, 1, 1), new Date(2030, 11, 31)]);

	$: yScale = scaleLinear()
		.range([chartHeight, 0])
		.domain([0, unifiedScaling ? 50 : max(dataGoals, (d) => d.y) * 1.05]);

	$: generateArea = (key) => {
		return area()
			.x((d) => xScale(d.x))
			.y((d) => yScale(d.y));
	};

	$: areas = keys.map((key) => generateArea(key)(key == 'production' ? dataProduction : dataGoals));
</script>

<div class="bg-gray-100 rounded overflow-hidden">
	<div class="text-white p-4 flex justify-between items-center" style="background: {type.color}">
		<h3 class="text-xl"><b>{type.label}</b> Produktion und Ausbauziel</h3>
		{@html type.icon}
	</div>
	<div class="">
		<div
			class="mt-4 relative w-full h-64"
			bind:clientWidth={chartWidth}
			bind:clientHeight={chartHeight}
		>
			{#if chartWidth && chartHeight}
				<svg width={'100%'} height={'100%'}>
					<g>
						{#each xScale.ticks(6) as tick, index}
							<g transform={`translate(${xScale(tick)}, ${chartHeight})`} class="text-white">
								<rect
									x={0}
									y={-chartHeight}
									width={chartWidth / 15}
									height={chartHeight}
									class="fill-gray-200 opacity-50"
								/>
								<!--
              <line x1="{-chartWidth / 12}" x2="{-chartWidth / 12}" y1="{-chartHeight}" y2={0} stroke-width="1" class="stroke-current" />
              <line x1="0" x2="0" y1="{-chartHeight}" y2={0} stroke-width="1" class="stroke-current" />
              <line x1="{chartWidth / 12}" x2="{chartWidth / 12}" y1="{-chartHeight}" y2={0} stroke-width="1" class="stroke-current" />
              -->
								<text class="text-xs text-gray-800 fill-current" x="6" y="-8"
									>{tick.getFullYear()}</text
								>
							</g>
						{/each}
					</g>
					<g>
						{#each yScale.ticks(6) as tick, index}
							<g transform={`translate(0, ${yScale(tick)})`} class="text-gray-400">
								<line x1="0" x2={chartWidth} y1="0" y2="0" stroke-width="1" class="stroke-white" />
								<text class="text-xs text-gray-800 fill-current bg-white" x="10" y="-8"
									>{tick} {index == yScale.ticks(6).length - 1 ? ' TWh' : ''}</text
								>
							</g>
						{/each}
					</g>

					<g>
						{#each [...areas] as area, i}
							<g id="area-{i}">
								<linearGradient id="grad-{i}" x1="0%" y1="0%" x2="0%" y2="100%">
									<stop offset="0%" style="stop-color:#000;stop-opacity:1" />
									<stop offset="100%" style="stop-color:#000;stop-opacity:0.6" />
								</linearGradient>
								<path
									d={area}
									fill={colors[i]}
									stroke={colors[i]}
									stroke-width="3"
									stroke-linecap="round"
									class="chart-area"
								/>
							</g>
						{/each}
					</g>

					<g
						transform="translate({xScale(dataProduction[dataProduction.length - 1].x)},{yScale(
							dataProduction[dataProduction.length - 1].y
						)})"
					>
						<circle r="5" fill={colors[1]} />
						<circle r="5" fill={colors[1]}>
							<animate
								attributeName="r"
								from="5"
								to="10"
								dur="1.5s"
								begin="0s"
								repeatCount="indefinite"
							/>
							<animate
								attributeName="opacity"
								from="1"
								to="0.5"
								dur="1.5s"
								begin="0s"
								repeatCount="indefinite"
							/>
						</circle>
					</g>

					<g
						transform="translate({xScale(dataGoals[dataGoals.length - 1].x)},{yScale(
							dataGoals[dataGoals.length - 1].y
						)})"
					>
						<text
							style="color:{colors[0]}"
							class="text-xs font-semibold fill-current"
							text-anchor="end"
							x={-10}
							y={-2}
							>2030-Ziel: {Math.round(dataGoals[dataGoals.length - 1].y)} TWh Strom aus {type.label}</text
						>
						<circle r="5" fill={colors[0]} />
					</g>
				</svg>
			{/if}
		</div>
	</div>
</div>
