<script>
    import { max, min, extent, bisector } from 'd3-array';
    import { scaleLinear, scaleOrdinal } from 'd3-scale';
    import { fade, draw } from "svelte/transition";
    
    export let data;
    export let radius = 5;
    export const colors = ["#313695","#a50026"];
    export let unit = "";
    export let yLabel = "";
    
    let chartHeight;
    let chartWidth;
    
    const margin = {top:10,right:50,bottom:10,left:0};
    $: innerChartHeight = chartHeight - margin.top - margin.bottom;
    $: innerChartWidth = chartWidth - margin.left - margin.right;
    
    $: xScale = scaleLinear()
        .rangeRound([0, innerChartWidth])
        .domain([min(data, (d) => d.x), max(data, (d) => d.x)]);
    
    $: yScale = scaleLinear()
        .rangeRound([innerChartHeight, 0])
        .domain([min(data, (d) => d.y), max(data, (d) => d.y)]);
    
    $: colorScale = scaleLinear()
        .range(colors)
        .domain([min(data, (d) => d.y), max(data, (d) => d.y)]);
    
    $: path = `M${[...data].splice(30)
        .map(
          (d) =>
            `${xScale(d.x)},${yScale(
              d.path
            )}`
        )
        .join('L')}`;
    
    $: getColor = function(datapoint) {
        return colorScale(datapoint.y);
    }
    
    $: selectedDatapoint = null;
    </script>
    
    <div
        class="relative h-full text-gray-100"
        bind:clientHeight={chartHeight}
        bind:clientWidth={chartWidth}
        >
        {#if innerChartWidth && innerChartHeight}
        <svg 
        width={"100%"} 
        height={"100%"}
        >
    
        <rect class="text-transparent fill-current" width={chartWidth} height={chartHeight} on:mouseover={() => selectedDatapoint = null}></rect>
    
        <g transform={`translate(${margin.left}, ${margin.top})`}>
        {#each xScale.ticks(chartWidth > 1000 ? 10 : 5).slice(0,-1) as tick}
        <g transform={`translate(${xScale(tick)}, ${margin.top})`} class="text-xs text-gray-500 dark:text-gray-400">
        <text fill="currentColor">{tick}</text>
        </g>
        {/each}
    
        {#each yScale.ticks(10).slice(0,-1) as tick}
        <g transform={`translate(0, ${yScale(tick)})`} class="text-xs text-gray-500 dark:text-gray-400">
        <text fill="currentColor" x={margin.left + innerChartWidth + 5} dominant-baseline="middle">{tick} {unit}</text>
        <line x1=0 y1=0 x2={margin.left + innerChartWidth} y2=0 stroke="currentColor" stroke-width="2" stroke-opacity="0.1"></line>
        </g>
        {/each}
        </g>
    
        <g id="visualisation" transform={`translate(${margin.left}, ${margin.top})`} class="text-gray-500 dark:text-gray-400">
    
        {#if path}
        <path class="path-line" d={path} transition:draw />
        {/if}
    
        {#each data as datapoint, i}
        <g transform={`translate(${xScale(datapoint.x)}, ${yScale(datapoint.y)})`} in:fade="{{delay: i * 10}}" class="dark:brightness-200">
            {#if i == data.length - 1}
            <circle cx="{radius/2}" cy="{radius/2}"  r={radius} fill="{getColor(datapoint)}">
                <animate attributeName="r" from="{radius}" to="{radius * 2}" dur="1.5s" begin="0s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="1" to="0.5" dur="1.5s" begin="0s" repeatCount="indefinite"/>
              </circle>
              {/if}
            <circle 
            cx="{radius/2}" 
            cy="{radius/2}" 
            r="{radius}" 
            fill="{getColor(datapoint)}" 
            class="cursor-help"
            on:mouseover={() => selectedDatapoint = datapoint}
            >
            </circle>
        </g>
        {/each}
    
        {#if selectedDatapoint}
            <g transform="translate({xScale(selectedDatapoint.x) > chartWidth - 300 ? xScale(selectedDatapoint.x) - 280 + radius * 2 : xScale(selectedDatapoint.x) - radius},{yScale(selectedDatapoint.y) + radius})" class="text-white text-sm uppercase cursor-help" transition:fade>
            <rect fill="{getColor(selectedDatapoint)}" x="0" y="{-2.5 * radius}" width="280" rx="{radius * 2}" height="{radius * 4}"></rect>
            <text x="10" y="-1" fill="currentColor" class="font-thin" dominant-baseline="middle">{selectedDatapoint.x}</text>
            <text x="45" y="-1" fill="currentColor" dominant-baseline="middle">{selectedDatapoint.y}{unit}</text>
            <text x="90" y="-1" fill="currentColor" dominant-baseline="middle" class="text-xs">{yLabel}</text>
            </g>
        {/if}
        </g>
        </svg>
        {/if}
    </div>
    
    <style>
        .path-line {
            fill: none;
            stroke-width: 7;
            stroke: currentColor;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-opacity: 0.4;
        }
    </style>