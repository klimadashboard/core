<script>
	import { scaleLinear, scaleTime } from 'd3-scale';
	import { area, line } from 'd3-shape';
	import Papa from 'papaparse';
	import formatNumber from '$lib/stores/formatNumber';
	import dayjs from 'dayjs';
	import { fade } from 'svelte/transition';
	import { PUBLIC_VERSION } from '$env/static/public';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';

	export let type;
	export let unifiedScaling;
	export let maxX;
	export let maxY;

	let goalYear;
	let unit = PUBLIC_VERSION == 'de' ? 'GW' : 'TWh';
	let title =
		PUBLIC_VERSION == 'de' ? 'Installierte Leistung vs. Ziel' : 'Jahresproduktion vs. Ausbauziel';

	$: maxValue = 50;

	let dataGoal;
	const getGoal = async function () {
		try{
			const directus = getDirectusInstance(fetch);
			const goals = await directus.request(
				readItems('ee_zielpfad', {
					filter: {
						_and: [
							{ 
								Country: { _eq: PUBLIC_VERSION.toUpperCase() },
								Type: {_eq: type.dataKey}
							}
						]
					},
					limit: -1,
					fields: ['id', 'Jahresproduktion', 'DateTime'],
				})
			);
			dataGoal = goals.map((entry) => {
				return {
					x: new Date(entry.DateTime.slice(0, 10)),
					y: entry.Jahresproduktion
				};
			});
			maxValue = goals[goals.length - 1].Jahresproduktion;
			goalYear = new Date(goals[goals.length - 1].DateTime).getFullYear();

			
		} catch (error) {
			console.error('Error fetching suggestions:', error);
		}
	};

	$: getGoal();

	let dataProduction;
	const getProduction = async function () {
		try{
			const directus = getDirectusInstance(fetch);
			const production = await directus.request(
				readItems('ee_produktion', {
					filter: {
						_and: [
							{ 
								Country: { _eq: PUBLIC_VERSION.toUpperCase() },
								Jahresproduktion: { _nnull: true },
								Type: {_eq: type.dataKey}
							}
						]
					},
					limit: -1,
					fields: ['id', 'Jahresproduktion', 'DateTime'],
				})
			);
			dataProduction = production
				.map((entry) => {
					return {
						x: new Date(entry.DateTime.slice(0, 10)),
						y: entry.Jahresproduktion
					};
				});

			
		} catch (error) {
			console.error('Error fetching suggestions:', error);
		}
	};

	$: getProduction();


	let chartWidth;
	let chartHeight;

	const margin = { top: 20, right: 0, left: 0, bottom: 0 };

	$: innerChartHeight = chartHeight - margin.top - margin.bottom;

	const keys = ['goal', 'production'];
	const colors = ['#A3A3A3', type.color];

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

	$: if (dataGoal && dataProduction) {
		areas = keys.map((key) => generateArea(key)(key == 'production' ? dataProduction : dataGoal));
	}

	$: selected = false;
</script>

<div class="bg-gray-100 rounded-sm overflow-hidden">
	<div class="text-white p-4 flex justify-between items-center" style="background: {type.color}">
		<h3 class="text-xl"><b>{type.label}</b> {title}</h3>
		{@html type.icon}
	</div>
	<div class="">
		<div class="relative w-full h-64" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
			{#if chartWidth && chartHeight && dataGoal && dataProduction}
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

						<g
							transform="translate({xScale(dataProduction[dataProduction.length - 1].x)},{yScale(
								dataProduction[dataProduction.length - 1].y
							)})"
							style="color: {colors[1]}"
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

						<g
							transform="translate({xScale(dataGoal[dataGoal.length - 1].x)},{yScale(
								dataGoal[dataGoal.length - 1].y
							)})"
						>
							{#if !unifiedScaling}
								<text
									style="color:{colors[0]}"
									class="text-sm font-semibold fill-current"
									text-anchor="end"
									x={-10}
									y={-2}
									>{goalYear}-Ziel: {formatNumber(dataGoal[dataGoal.length - 1].y)}
									{unit} Strom aus {type.label}</text
								>
							{/if}

							<circle r="5" fill={colors[0]} />
						</g>
					</g>
				</svg>
			{/if}
		</div>
	</div>
</div>
