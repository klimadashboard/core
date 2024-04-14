
<script>
    import { PUBLIC_VERSION } from '$env/static/public';
    import * as d3 from "d3";
	import formatNumber from '$lib/stores/formatNumber';
	import dayjs from 'dayjs';
	import { fade } from 'svelte/transition';
	import Papa from 'papaparse';

    export let type;
    export let dataset;
    export let potential_2030;
    export let potential_techn;
	export let goals;

    
	const margin = { top: 20, right: 10, left: 10, bottom: 10 };
	let chartWidth;
	let chartHeight;
	let unit = 'TWh';


	$: minYear = dataset[0].year;
	$: maxYear = Math.max(Math.max(...goals.map(g => +g.goal_year).filter(x => !isNaN(x))), 2030);
	$: minValue = 0;
	$: maxValue = Math.max(Math.max(...goals.map(g => +g.goal_amount).filter(x => !isNaN(x))), potential_2030);

	$: innerChartHeight = chartHeight - margin.top - margin.bottom;
	$: innerChartWidth = chartWidth - margin.left - margin.right;
	$: xScale = dataset ? d3.scaleTime().range([0, innerChartWidth]).domain([new Date(minYear, 1, 1), new Date(maxYear, 12, 31)]) : null;
	$: yScale = dataset ? d3.scaleLinear().range([innerChartHeight, 0]).domain([minValue, maxValue]): null;
    $: line = d3
        .line()
        .x((d) => xScale(new Date(d.year, 1, 1)))
        .y((d) => yScale(d.value));



</script>

<div class="bg-gray-100 rounded overflow-hidden">
	<div class="text-white p-1 flex justify-between items-center" style="background: {type.color}; padding-left: 1rem; padding-right: 1rem;">
		<h3 class="text-xl"><b>{type.label}</b> </h3>
		{@html type.icon}
	</div>
	<div class="h-auto">
		<div class="relative w-full h-48" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
			{#if chartWidth && chartHeight && dataset != null && type != null && potential_techn != null}
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
							{#each yScale.ticks(3) as tick, index}
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
										>{tick} {index == yScale.ticks(3).length - 1 ? ' ' + unit : ''}</text
									>
								</g>
							{/each}
						</g>

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
							transform="translate({xScale(new Date(dataset[dataset.length - 1].year, 1, 1))},{yScale(
								dataset[dataset.length - 1].value
							)})"
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
                            <text class="text-sm font-semibold fill-current" x={16} y={0} transition:fade
                                >{formatNumber(
                                    Math.round(dataset[dataset.length - 1].value * 100) / 100
                                )}
                                {' ' + unit + ' '}
                                Produktion im Zeitraum
                                <tspan x="16" y="16"
                                    >{dataset[0].year} - {dataset[dataset.length - 1].year}</tspan
                                >
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
						
						{#if goals != null}
							<g>
								{#each goals as goal, index}
									{@const sourceYear = index > 0 ? +goals[index-1].goal_year : +goal.source_year} <!--take last goal's year and value if there are several goals defined-->
									{@const sourceAmount = index > 0 ? +goals[index-1].goal_amount : +dataset.find(d => +d.year === sourceYear)?.value}
									{@const goalYear = +goal.goal_year}
									{@const goalAmount = +goal.goal_amount}
									{@const asdf = console.log(sourceYear, sourceAmount, goalYear, goalAmount, "TODO: remove log")}
									{#if !isNaN(sourceYear) && !isNaN(sourceAmount) && !isNaN(goalYear) && !isNaN(goalAmount)}
										<line x1={xScale(new Date(sourceYear, 1, 1))} y1={yScale(sourceAmount)} x2={xScale(new Date(goalYear, 1, 1))} y2={yScale(goalAmount)} style="stroke:grey; stroke-width:2" />
										<circle cx={xScale(new Date(goalYear, 1, 1))} cy={yScale(goalAmount)} r="5" style="fill: grey;" />
									{/if}
								{/each}
							</g>
						{/if}
						{#if potential_2030 != null}
							<line x1={xScale(new Date(minYear, 1, 1))} y1={yScale(potential_2030)} x2={xScale(new Date(2030+1, 1, 1))} y2={yScale(potential_2030)} stroke-dasharray="5,5" style="stroke:grey; stroke-width:1" />
							<line x1={xScale(new Date(2030, 1, 1))} y1={yScale(minValue)} x2={xScale(new Date(2030, 1, 1))} y2={yScale(potential_2030*1.12)} stroke-dasharray="5,5" style="stroke:grey; stroke-width:1" />
						{/if}
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