<script>
    import { scaleLinear } from "d3-scale";

    export let data;

    let chartWidth;
    let chartHeight;

    let arrowHeight = 200;

    $: xScale = scaleLinear()
      .range([0, chartWidth])
      .domain([0, 76000000]);

    $: selectedCategory = false;
</script>

<div
class="h-96"
bind:clientHeight={chartHeight}
bind:clientWidth={chartWidth}>
<svg width="100%" height="100%">
<g>
{#each data as cat, i}
    {@const width = xScale(cat.value)}
    <g transform="translate({xScale(cat.value)},0)" class="text-{cat.key}" on:mousedown={() => selectedCategory = cat}>
        <path d="m 0 20 v {arrowHeight} h {width} v {-arrowHeight} l {-width / 2} -20 z" class="fill-current opacity-70 hover:opacity-100 transition" />
        <text 
        x={10}
        y={30}
        dominant-baseline="hanging" 
        class="fill-white uppercase font-semibold">{cat.key}</text>
    </g>
{/each}
</g>
<g transform="translate(0,{arrowHeight + 20})" class="text-{selectedCategory.key}">
<line x1=0 y1=0 x2={chartWidth} y2=0
class="stroke-2 stroke-current"></line>

{#if selectedCategory}

{/if}
</g>


</svg>
</div>