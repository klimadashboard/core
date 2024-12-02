<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	import * as d3 from 'd3';
	import formatNumber from '$lib/stores/formatNumber';
	import dayjs from 'dayjs';
	import { fade } from 'svelte/transition';
	import Papa from 'papaparse';

	export let bundesland;
	export let type;
	export let dataset;
	export let potential_2030;
	export let potential_techn;
	export let goals;
	export let selectedStartYear;
	export let showTechn;
	export let predefinedMaxValue;

	const margin = { top: 15, right: 15, left: 15, bottom: 25 };
	let chartWidth;
	let chartHeight;
	let unit = 'TWh';
	const grey = '#A3A3A3';
	const green = '#4FB365';

	$: has_goals = goals != null && goals.length > 0;

	$: maxYear = Math.max(Math.max(...goals.map((g) => +g.goal_year).filter((x) => !isNaN(x))), 2060);
	$: minYear = Math.max(dataset[0].year, selectedStartYear);
	$: maxValue = predefinedMaxValue
		? predefinedMaxValue
		: (showTechn
				? potential_techn
				: Math.max(
						Math.max(...goals.map((g) => +g.goal_amount).filter((x) => !isNaN(x))),
						potential_2030,
						Math.max(...dataset.map((g) => +g.value))
				  )) * 1.1;
	$: minValue = 0;

	$: innerChartHeight = chartHeight - margin.top - margin.bottom;
	$: innerChartWidth = chartWidth - margin.left - margin.right;
	$: xScale = dataset
		? d3
				.scaleTime()
				.range([0, innerChartWidth])
				.domain([new Date(minYear, 1, 1), new Date(maxYear, 12, 31)])
		: null;
	$: yScale = dataset
		? d3.scaleLinear().range([innerChartHeight, 0]).domain([minValue, maxValue])
		: null;
	$: line = d3
		.line()
		.x((d) => xScale(new Date(d.year, 1, 1)))
		.y((d) => yScale(d.value));
</script>

<div class="bg-gray-100 rounded overflow-hidden">
	<div
		class="text-white p-1 flex justify-between items-center"
		style="background: {type.color}; padding-left: 1rem; padding-right: 1rem;"
	>
		<h3 class="text-xl">
			<b>{type.label}</b>
			<span class="text-sm">{has_goals ? '' : '(kein Ausbauziel definiert)'}</span>
		</h3>
		{@html type.icon}
	</div>
	<div class="h-auto">
		<div class="relative w-full h-56" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
			{#if chartWidth && chartHeight && dataset != null && type != null && potential_techn != null}
				{@const last_datapoint = dataset[dataset.length - 1]}
				{@const delta_values = has_goals
					? yScale(+goals[0].goal_amount) - yScale(+last_datapoint.value)
					: 0}
				{@const text_production_x_offset = has_goals
					? Math.abs(delta_values) <= 8.1 && +goals[0].goal_year > 2000
						? delta_values < 0
							? 10
							: -10
						: 0
					: 0}

				{@const delta_goal_potential_2030 = yScale(+goals[0]?.goal_amount) - yScale(potential_2030)}
				{@const text_potential_2030_y_offset = has_goals
					? Math.abs(delta_goal_potential_2030) < 25
						? delta_goal_potential_2030 > -18
							? -14
							: +16
						: -14
					: -14}

				<svg width={'100%'} height={'100%'}>
					<g transform="translate({margin.left},{margin.top})">
						<g>
							{#each xScale.ticks(6) as tick, index}
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
							{/each}
						</g>
						<g>
							{#each yScale.ticks(3) as tick, index}
								<g transform={`translate(${-margin.left}, ${yScale(tick)})`} class="text-gray-400">
									<line
										x1="0"
										x2={chartWidth}
										y1="0"
										y2="0"
										class={index == 0 ? 'stroke-gray-400' : 'stroke-gray-200'}
									/>
									<text class="text-sm text-gray-600 fill-current bg-white" x="10" y="-4"
										>{tick} {index == yScale.ticks(3).length - 1 ? ' ' + unit : ''}</text
									>
								</g>
							{/each}
							<!-- 0 Linie -->
							<g transform={`translate(0, ${yScale(0)})`} class="text-gray-400">
								<line
									x1="0"
									x2={chartWidth}
									y1="0"
									y2="0"
									stroke-width="2"
									class="stroke-gray-400 opacity-50"
								/>
							</g>
						</g>
						{#if has_goals}
							<g>
								{#each goals as goal, index}
									{@const sourceYear = index > 0 ? +goals[index - 1].goal_year : +goal.source_year}
									<!--take last goal's year and value if there are several goals defined-->
									{@const sourceAmount =
										index > 0
											? +goals[index - 1].goal_amount
											: +dataset.find((d) => +d.year === sourceYear)?.value}
									{@const goalYear = +goal.goal_year}
									{@const goalAmount = +goal.goal_amount}
									{#if !isNaN(goalYear) && !isNaN(goalAmount)}
										{#if !isNaN(sourceYear) && !isNaN(sourceAmount)}
											<line
												x1={xScale(new Date(sourceYear, 1, 1))}
												y1={yScale(sourceAmount)}
												x2={xScale(new Date(goalYear, 1, 1))}
												y2={yScale(goalAmount)}
												style="stroke:{grey}; stroke-width:2"
											/>
										{:else}
											{@const approxSourceAmount = +dataset
												.map((d) => {
													return {
														sort: +Math.abs(+d.year - sourceYear),
														value: d.value,
														year: d.year
													};
												})
												.sort((a, b) => a.sort - b.sort)[0].value}
											<line
												x1={xScale(new Date(sourceYear, 1, 1))}
												y1={yScale(approxSourceAmount)}
												x2={xScale(new Date(goalYear, 1, 1))}
												y2={yScale(goalAmount)}
												style="stroke:{grey}; stroke-width:2; stroke-dasharray: 5,5"
											/>
										{/if}
										<!-- {@const delta_values_potential = yScale(potential_2030) - yScale(goalAmount)} -->
										<!-- {@const text_potential_x_offset =
											showTechn && Math.abs(delta_values_potential) <= 7 ? 10 : 0} -->
										{@const text_potential_x_offset = 0}
										<circle
											cx={xScale(new Date(goalYear, 1, 1))}
											cy={yScale(goalAmount)}
											r="5"
											style="fill: {grey};"
										/>
										{@const anchor = goalYear >= 2040 ? 'end' : 'start'}
										<text
											text-anchor={anchor}
											class="text-sm font-semibold fill-current bg-white chart-text"
											style="fill: {grey};"
											x={xScale(new Date(goalYear, 1, 1))}
											y={yScale(goalAmount) + 5}
											dx={anchor == 'end' ? -12 : 12}
											dy={text_potential_x_offset}
											>{formatNumber(Math.round(goalAmount * 100) / 100)}
											{' ' + unit + ' '}
											Ziel bis {goalYear}
											<!-- im Zeitraum
											<tspan x="16" y="16"
												>{dataset[0].year} - {dataset[dataset.length - 1].year}</tspan
											> -->
										</text>
									{/if}
								{/each}
							</g>
							<!-- {:else}
							<g>
								<text
									text-anchor={'start'}
									class="text-sm font-semibold fill-current bg-white"
									style="fill: {grey};"
									x={xScale(new Date(maxYear, 1, 1))}
									y={yScale(maxValue) + 5}
								>
									{bundesland} hat kein Ausbauziel für {type.label}
								</text>
							</g> -->
						{/if}
						{#if potential_2030 != null && potential_2030 > 0}
							<g
								transform="translate({xScale(new Date(2030, 1, 1))},{yScale(potential_2030)})"
								class="text-green-600"
							>
								<text
									x={12}
									dominant-baseline="middle"
									class="text-sm font-semibold fill-current bg-white chart-text"
									>{formatNumber(Math.round(potential_2030 * 100) / 100)}
									{' ' + unit + ' '}Potential 2030
								</text>
								<!--
							<text
								text-anchor="middle"
								class="text-xl font-semibold fill-current bg-white"
								style="fill: {grey}"
								x={xScale(new Date(2030, 1, 1))}
								y={yScale(potential_2030)}
								dy={4}
								dx={0}>★</text
							>
						-->
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									y={-12}
									x={-12}
									><path stroke="none" d="M0 0h24v24H0z" fill="none" /><circle
										cx="12"
										cy="12"
										r=".5"
										fill="currentColor"
									/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /></svg
								>
							</g>
						{/if}
						{#if potential_techn != null && showTechn}
							<line
								x1={xScale(new Date(minYear, 1, 1))}
								y1={yScale(potential_techn)}
								x2={xScale(new Date(maxYear + 5, 1, 1))}
								y2={yScale(potential_techn)}
								stroke-dasharray="5,5"
								style="stroke:{grey}; stroke-width:1"
							/>
							<!-- <line x1={xScale(new Date(2030, 1, 1))} y1={yScale(minValue)} x2={xScale(new Date(2030, 1, 1))} y2={yScale(potential_techn*1.12)} stroke-dasharray="5,5" style="stroke:grey; stroke-width:1" /> -->

							<text
								text-anchor="middle"
								style="fill:{grey};"
								class="text-sm bg-white font-semibold chart-text"
								x={xScale(new Date(maxYear - (maxYear - minYear) / 2, 1, 1))}
								y={yScale(potential_techn)}
								dy={-3}
								>{formatNumber(Math.round(potential_techn * 100) / 100)}
								{' ' + unit + ' '}
								Technisch möglich
							</text>
						{/if}

						<g>
							<linearGradient x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" style="stop-color:#000;stop-opacity:1" />
								<stop offset="100%" style="stop-color:#000;stop-opacity:0.6" />
							</linearGradient>
							<path
								d={line(dataset)}
								fill="none"
								stroke={type.color}
								stroke-width="3"
								stroke-linecap="round"
								class="chart-area"
							/>
						</g>
						<g
							transform="translate({xScale(
								new Date(dataset[dataset.length - 1].year, 1, 1)
							)},{yScale(dataset[dataset.length - 1].value)})"
							style="color: {type.color}"
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
							<text
								class="text-sm font-semibold fill-current chart-text"
								x={12}
								y={5}
								transition:fade
								dy={text_production_x_offset}
								>{last_datapoint.value > 0.01
									? formatNumber(Math.round(last_datapoint.value * 100) / 100)
									: last_datapoint.value.toString().replace('.', ',')}
								{' ' + unit + ' '}
								Produktion
								<!-- im Zeitraum
                                <tspan x="16" y="16"
                                    >{dataset[0].year} - {dataset[dataset.length - 1].year}</tspan
                                > -->
							</text>
						</g>

						<!-- <g
							transform="translate({xScale(dataGoal[dataGoal.length - 1].x)},{yScale(
								dataGoal[dataGoal.length - 1].y
							)})"
						>
                            <text
                                style="color:grey"
                                class="text-sm font-semibold fill-current"
                                text-anchor="end"
                                x={-10}
                                y={-2}
                                >{goalYear}-Ziel: {formatNumber(dataGoal[dataGoal.length - 1].y)}
                                {unit} Strom aus {type.label}</text
                            >

							<circle r="5" fill={"grey"} />
						</g> -->
					</g>
				</svg>
			{/if}
		</div>
	</div>
</div>

<!-- <div>
    <div
        class="relative w-full h-32"
        bind:clientWidth={chartWidth}
        bind:clientHeight={chartHeight}
    >
        {#if chartWidth && chartHeight && dataset != null && energyType != null && potential_techn != null}
            <svg width={'100%'} height={'100%'}>
                <g transform="translate(0,{margin.top})">
                    <path
                        d={line(dataset)}
                        fill={"none"}
                        stroke={energyType.color}
                        stroke-width="3"
                        stroke-linecap="round"
                        class="chart-area"
                    />
                </g>
            </svg>
            
        {/if}
    </div>
</div> -->
