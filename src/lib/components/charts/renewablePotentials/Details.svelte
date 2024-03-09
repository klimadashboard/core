
<script>
    import { PUBLIC_VERSION } from '$env/static/public';
    import * as d3 from "d3";
	import formatNumber from '$lib/stores/formatNumber';
	import dayjs from 'dayjs';
	import { fade } from 'svelte/transition';

    export let type;
    export let dataset;
    export let potential_2030;
    export let potential_techn;

    
	const margin = { top: 20, right: 10, left: 10, bottom: 10 };
	let chartWidth;
	let chartHeight;
	let unit = 'MWh';


	$: innerChartHeight = chartHeight - margin.top - margin.bottom;
	$: innerChartWidth = chartWidth - margin.left - margin.right;
	$: xScale = dataset ? d3.scaleTime().range([0, innerChartWidth]).domain([new Date(dataset[0].year, 1, 1), new Date(2030, 12, 31)]) : null;
	$: yScale = dataset ? d3.scaleLinear().range([innerChartHeight, 0]).domain([0, potential_techn]): null;
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
		<div class="relative w-full h-32" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
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