
<script>
    import { PUBLIC_VERSION } from '$env/static/public';
    import * as d3 from "d3";

    export let energyTypes;
    export let dataset;

    
	const margin = { top: 10, right: 10, left: 10, bottom: 10 };
	let chartWidth;
	let chartHeight;


	$: innerChartHeight = chartHeight - margin.top - margin.bottom;
	$: xScale = dataset ? d3.scaleLinear().range([margin.left, chartWidth-margin.right]).domain([dataset[0].year, dataset[dataset.length-1].year]) : null;
	$: yScale = dataset ? d3.scaleLinear().range([innerChartHeight, 0]).domain([0, 1]): null;
    $: line = d3
        .line()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.value));
    $: console.log(dataset, chartWidth, chartHeight)


</script>

<div>
    <div
        class="relative w-full h-32"
        bind:clientWidth={chartWidth}
        bind:clientHeight={chartHeight}
    >
        {#if chartWidth && chartHeight && dataset != null}
            <svg width={'100%'} height={'100%'}>
                <g transform="translate(0,{margin.top})">
                    <path fill="none" stroke="steelblue" stroke-width="1.5" d={line(dataset)} />
                </g>
            </svg>
        {/if}
    </div>
</div>