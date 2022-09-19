<script>
    import { selectedStation } from "$lib/stores/weather";
    import { geoPath, geoAlbers } from "d3-geo";
    import { scaleLinear } from "d3-scale";
    import topo from "./austria.json";
    import { max, min } from "d3-array";

    export let data;

    let mapWidth;
    let mapHeight;

    $: bounds = [
    [0, 0],
    [mapWidth - 10, mapHeight - 10],
    ];
    
    $: projection = geoAlbers()
    .center([0, 47.8])
    .rotate([-13.5, 0])
    .fitExtent(bounds, topo);

    const colors = ["#209857","#5774DB"]; // from green to blue

    $: getColor = function(station) {
        const colorScale = scaleLinear()
        .range(colors)
        .domain([0, 3100]);
        return colorScale(station.height);
    }

    const radi = [5,8];

    $: getRadius = function(station) {
        const radiusScale = scaleLinear()
        .range(radi)
        .domain([min(data, (d) => d.height), max(data, (d) => d.height)]);
        return radiusScale(station.height);
    }
</script>

<div id="map" class="h-64"
bind:clientHeight={mapHeight} 
bind:clientWidth={mapWidth}>
{#if mapHeight && mapWidth}
    <svg width={"100%"} height={"100%"}>
    <g>
        {#each topo.features as feature}
          <path
            d={geoPath().projection(projection)(feature)}
            class="fill-gray-200  stroke-white  stroke-1 shadow"
          />
        {/each}
    </g>
    <g>
        {#each data as station}
            <g 
            transform="translate({projection([station.longitude,station.latitude])})"
            on:mouseover={() => selectedStation.set(station.id)}>
                {#if $selectedStation == station.id}
                 <circle r={getRadius(station)} fill={getColor(station)}>
                 <animate attributeName="r" from="5" to="10" dur="1.5s" begin="0s" repeatCount="indefinite"/>
                 <animate attributeName="opacity" from="1" to="0.5" dur="1.5s" begin="0s" repeatCount="indefinite"/>
                 </circle>
                {/if}
                <circle r={getRadius(station)} fill={getColor(station)} class="opacity-70">
                </circle>
            </g>
        {/each}
    </g>
</svg>
{/if}
<div class="absolute bottom-0 left-0 right-0 text-gray-600">
    <div class="container flex items-center gap-2 text-sm">
    <span>117m Seehöhe</span>
    <div 
    class="w-24 h-4 bg-gray-100"
    style="background: linear-gradient(90deg, {colors[0]} 20%, {colors[1]} 100%);"
    ></div>
    <span>3.100m</span>
</div>
</div>
</div>