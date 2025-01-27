<script>
    import { scaleLinear } from 'd3-scale';
    import { min, max } from 'd3-array';
    import SmallLine from './SmallLine.svelte';

    export let data;
    export let chart;

    let chartWidth;
    let chartHeight;

    const margin = {
        left: 0,
        right: 0,
        top: 10,
        bottom: 20
    }

    $: innerChartWidth = chartWidth - margin.left - margin.right;
    $: innerChartHeight = chartHeight - margin.top - margin.bottom;
</script>

<div class="h-full w-full" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight} >
    {#if innerChartWidth > 0 && innerChartHeight > 0}
    <svg class="h-full w-full">
        <g transform="translate({margin.left},{margin.top})">
        {#each chart.layers as layer,i}
        {#if layer.type == "line"}
        <SmallLine data={data.map((d) => {
            return {
                y: d.layers[i].y,
                ...d
            }
        })} {innerChartWidth} {innerChartHeight} />
        {/if}
        {/each}
        </g>
        <g transform="translate(0,{margin.top + innerChartHeight})" class="text-sm fill-current">
            <line x1={0} x2={chartWidth} class="stroke-current stroke-2 opacity-50" />
            <text dominant-baseline="hanging" y={4}>{data[0].x}</text>
            <text x={chartWidth} text-anchor="end" dominant-baseline="hanging" y={4}>{data[data.length - 1].x}</text>
        </g>
    </svg>
    {/if}
</div>
