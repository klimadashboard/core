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
	export let dataGoals;

	let unit = PUBLIC_VERSION == 'de' ? 'GW' : ' TWh';
	let title =
		PUBLIC_VERSION == 'de' ? 'Installierte Leistung vs. Ziel' : 'Jahresproduktion vs. Ausbauziel';

	$: maxValue = dataGoals
		.filter((d) => d.energy_type == type.dataKey)
		.sort((a, b) => b.value - a.value)[0].value;

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
					limit: -1
					// fields: ['id', 'name', 'postcodes', 'country', 'layer'],
					// sort: ['name']
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

	const margin = { top: 30, right: 0, left: 0, bottom: 0 };

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
	$: dataGoalsForType = dataGoals.filter((d) => d.energy_type == type.dataKey);
</script>

<div class="bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden">
	<div class="text-white p-4 flex justify-between items-center" style="background: {type.color}">
		<h3 class="text-xl"><b>{type.label}</b> {title}</h3>
		{@html type.icon}
	</div>
	<div class="">
		<div class="relative w-full h-64" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
			{#if chartWidth && chartHeight && dataProduction}
				<svg width={'100%'} height={'100%'}>
					<g transform="translate(0,{margin.top})" style="color: {type.color}">
						<g>
							{#each xScale.ticks() as tick, index}
								{#if tick.getMonth() === 0 && tick.getDate() === 1 && tick.getFullYear() % 2 === 0}
									<g transform={`translate(${xScale(tick)}, ${0})`} class="text-gray-200">
										<line
											x1={0}
											x2={0}
											y1={innerChartHeight - 5}
											y2={innerChartHeight}
											class="stroke-gray-400"
										/>
										<text
											class="text-sm text-gray-600 fill-current"
											text-anchor="middle"
											y={innerChartHeight + margin.bottom - 7}>{tick.getFullYear()}</text
										>
									</g>
								{/if}
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

						<line
							x1={xScale(new Date(dataGoalsForType.find((d) => d.scenario == 'eag').release_date))}
							y1={yScale(
								dataProduction.find(
									(e) =>
										new Date(e.x) >
										new Date(dataGoalsForType.find((d) => d.scenario == 'eag').release_date)
								).y
							)}
							x2={xScale(
								new Date(dataGoalsForType.find((d) => d.scenario == 'eag').year + '-01-01')
							)}
							y2={yScale(dataGoalsForType.find((d) => d.scenario == 'eag').value)}
							class="stroke-2 stroke-current opacity-50"
							stroke-dasharray="10 10"
						/>

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
							{#each dataGoalsForType as goal, i}
								<g transform="translate({xScale(new Date(goal.year, 1, 1))},{yScale(goal.value)})">
									{#if !(i > 0 && dataGoalsForType.every((d) => d.value == dataGoalsForType[0].value))}
										<circle r={4} class="fill-none stroke-current stroke-2" />
										<text
											style="color:{colors[0]}"
											class="text-sm font-semibold fill-current"
											text-anchor="end"
											x={-7}
											y={-4}
										>
											{#if dataGoalsForType.every((d) => d.value == dataGoalsForType[0].value)}
												NEKP, EAG und ÖNIP-Ziel: {formatNumber(goal.value)} {unit}
											{:else}
												{goal.scenario.toUpperCase()}-Ziel: {formatNumber(goal.value)} {unit}
											{/if}
										</text>
									{/if}
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
								<text class="text-sm font-semibold fill-current" x={5} y={20} transition:fade
									>{formatNumber(
										Math.round(dataProduction[dataProduction.length - 1].y * 100) / 100
									)}
									{' ' + unit + ' '}
									{#if PUBLIC_VERSION == 'at'}
										Produktion im Zeitraum
										<tspan x="5" y="35"
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
