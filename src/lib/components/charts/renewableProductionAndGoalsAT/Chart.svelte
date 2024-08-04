<script>
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { area, line } from 'd3-shape';
	import Papa from 'papaparse';
	import formatNumber from '$lib/stores/formatNumber';
	import dayjs from 'dayjs';
	import { fade } from 'svelte/transition';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let type;
	export let unifiedScaling;
	export let maxX;
	export let maxY;
	export let dataGoals;

	let unit = PUBLIC_VERSION == 'de' ? 'GW' : 'TWh';
	let title =
		PUBLIC_VERSION == 'de' ? 'Installierte Leistung vs. Ziel' : 'Jahresproduktion vs. Ausbauziel';

	$: maxValue = 50;

	let dataProduction;
	Papa.parse(
		'https://data.klimadashboard.org/' +
			PUBLIC_VERSION +
			'/energy/renewables/' +
			type.dataKey +
			'_produktion.csv',
		{
			download: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			header: true,
			complete: function (results) {
				if (results) {
					dataProduction = results.data
						.filter((d) => d.Jahresproduktion)
						.map((entry) => {
							return {
								x: new Date(entry.DateTime.slice(0, 10)),
								y: entry.Jahresproduktion
							};
						});
				}
			}
		}
	);

	let chartWidth;
	let chartHeight;

	const margin = { top: 20, right: 0, left: 0, bottom: 0 };

	$: innerChartHeight = chartHeight - margin.top - margin.bottom;

	const keys = ['production', 'goal'];
	const colors = [type.color];

	$: xScale = scaleTime()
		.range([0, chartWidth])
		.domain([new Date(2016, 1, 1), new Date(maxX)]);

	$: yScale = scaleLinear()
		.range([innerChartHeight, 0])
		.domain([0, unifiedScaling ? maxY : maxValue]);

	$: generateArea = (key) => {
		return area()
			.x((d) => xScale(d.x))
			.y((d) => yScale(d.y));
	};

	$: areas = [];

	$: if (dataProduction) {
		areas = keys.map((key) => generateArea(key)(dataProduction));
	}

	$: selected = false;
</script>

<div class="bg-gray-100 rounded overflow-hidden">
	<div class="text-white p-4 flex justify-between items-center" style="background: {type.color}">
		<h3 class="text-xl"><b>{type.label}</b> {title}</h3>
		{@html type.icon}
	</div>
	<div class="">
		<div class="relative w-full h-64" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
			{#if chartWidth && chartHeight && dataProduction}
				<svg width={'100%'} height={'100%'}>
					<g transform="translate(0,{margin.top})">
						<g>
							{#each xScale.ticks(6) as tick, index}
								<g transform={`translate(${xScale(tick)}, ${chartHeight})`} class="text-gray-200">
									<rect
										x={0}
										y={-chartHeight - margin.top}
										width={chartWidth / 15}
										height={chartHeight}
										class="fill-gray-200 opacity-50"
									/>
									<text class="text-sm text-gray-600 fill-current" x="6" y={-margin.top - 4}
										>{tick.getFullYear()}</text
									>
								</g>
							{/each}
						</g>
						<g>
							{#each yScale.ticks(6) as tick, index}
								<g transform={`translate(0, ${yScale(tick)})`} class="text-gray-400">
									<line
										x1="0"
										x2={chartWidth}
										y1="0"
										y2="0"
										stroke-width="1"
										class="stroke-gray-200 opacity-50"
									/>
									<text class="text-sm text-gray-600 fill-current bg-white" x="10" y="-4"
										>{tick} {index == yScale.ticks(6).length - 1 ? ' ' + unit : ''}</text
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

						<g style="color: {colors[0]}" class="opacity-70">
							{#each dataGoals.filter((d) => d.energy_type == type.dataKey && d.scenario !== 'nekp_draft_wam') as goal}
								<g transform="translate({xScale(new Date(goal.year, 1, 1))},{yScale(goal.value)})">
									<circle r={4} class="fill-none stroke-current stroke-2" />
									<text
										style="color:{colors[0]}"
										class="text-sm font-semibold fill-current"
										text-anchor="end"
										x={-8}
										y={4}
										>{goal.scenario.toUpperCase()}-Ziel: {formatNumber(goal.value)} {unit}
									</text>
								</g>
							{/each}
						</g>

						<g
							transform="translate({xScale(dataProduction[dataProduction.length - 1].x)},{yScale(
								dataProduction[dataProduction.length - 1].y
							)})"
							style="color: {colors[0]}"
							on:mouseover={() => (selected = true)}
							on:focus={() => (selected = true)}
							on:mouseout={() => (selected = false)}
							on:blur={() => (selected = false)}
						>
							<circle r="5" class="fill-current" />
							<circle r="5" class="fill-current">
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
							{#if !unifiedScaling}
								<text class="text-sm font-semibold fill-current" x={16} y={0} transition:fade
									>{formatNumber(
										Math.round(dataProduction[dataProduction.length - 1].y * 100) / 100
									)}
									{' ' + unit + ' '}
									{#if PUBLIC_VERSION == 'at'}
										Produktion im Zeitraum
										<tspan x="16" y="16"
											>{dayjs(dataProduction[dataProduction.length - 1].x)
												.subtract(364, 'day')
												.format('D.M.YYYY')} – {dayjs(
												dataProduction[dataProduction.length - 1].x
											).format('D.M.YYYY')}</tspan
										>
									{:else if PUBLIC_VERSION == 'de'}
										Installierte Leistung am {dayjs(
											dataProduction[dataProduction.length - 1].x
										).format('D.M.YYYY')}
									{/if}
								</text>
							{/if}
						</g>
					</g>
				</svg>
			{/if}
		</div>
	</div>
</div>
