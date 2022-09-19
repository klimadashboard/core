<script>
    import { scaleLinear, scaleTime } from "d3-scale"; 
    import { min, max} from "d3-array";
    import { line } from "d3-shape";
    import { selectedWeatherYear } from "$lib/stores/weather";
    import { draw, fade } from "svelte/transition";

    export let selectedStationData;
    export let types;
    export let showDays;

    let chartWidth;
    let chartHeight;

    $: data = selectedStationData.timestamps.map((timestamp, i) => {
        const parameters = selectedStationData.features[0].properties.parameters;
        const startIndex = Math.max(0, i - 30);
        const endIndex = i;
        const values = [...parameters.t.data].slice(startIndex,endIndex);
        let average;
        if(values.indexOf(null) > -1 || values.length < 30) {
            average = null;
        } else {
            average = [...values].reduce((a,b) => {
                return a + b;
            }, 0) / Math.max(1, values.length);
        }
        return {
            day: new Date(timestamp),
            t: parameters.t.data[i],
            tmin: parameters.tmin.data[i],
            tmax: parameters.tmax.data[i],
            average: average,
            heatDay: parameters.tmax.data[i] >= 30 ? true : false,
            summerDay: parameters.tmax.data[i] >= 25 ? true : false,
            tropicalNight: parameters.tmin.data[i] >= 20 ? true : false,
            iceDay: parameters.tmax.data[i] <= 0 ? true : false
        }
    });

    const currentYear = new Date().getFullYear();
    const firstDayOfCurrentYear = new Date(currentYear, 0, 1);
    $: dataForCurrentYear = data.filter(d => d.day > firstDayOfCurrentYear);

    const margin = { top: 25, right: 10, bottom: 5, left: 5};

    $: innerChartWidth = chartWidth - margin.left - margin.right;
    $: innerChartHeight = chartHeight - margin.top - margin.bottom;

    $: xScale = scaleTime()
    .rangeRound([0, innerChartWidth])
    .domain([min(dataForCurrentYear, (d) => d.day), new Date(new Date().getFullYear(), 11, 31)]);

    $: yScale = scaleLinear()
    .rangeRound([innerChartHeight, 0])
    .domain([min(data, (d) => d.t), max(data, (d) => d.t)]);

    $: selectedDay = false;

    $: generateLine = (year) => {
    const firstDayOfYear = new Date(year, 0, 1);
    const lastDayOfYear = new Date(year, 11, 31);
    const dataset = data.filter(d => d.day > firstDayOfYear && d.day < lastDayOfYear).map((d, i) => {
      return {
        day: new Date(currentYear, d.day.getMonth(), d.day.getDate()),
        average: d.average
      }
    });

    return line()(dataset.map(d => {
      return [xScale(d.day),yScale(d.average)]
    }))

    };

    const range = function(start, end) {
    return Array(end - start + 1).fill().map((_, idx) => start + idx)
    }

    const colors = ["#CDE4EF","#FADEA5","#FDA26F","#F56860","#D5345E","#9E0669"]; // from blue to red

    $: yearlyAverages = years.map((year) => {
      const dataset = data.filter((d) => d.day.getFullYear() == year);
      return dataset.reduce((a,b) => {
        return a + b.t
      }, 0) / dataset.length;
    })

    const getColor = function(index) {
      const colorScale = scaleLinear()
        .range(colors)
        .domain([-5,0,5,7.5,10,12.5]);
      if(index == years.length - 1) {
        return "currentColor"
      } else {
      return colorScale(yearlyAverages[index]);
      }
    }

    $: years = range(1960, currentYear);
    $: months = range(0,11);

    $: lines = years.map((year) => generateLine(year));
</script>

{#if data}
<div 
class="h-96"
style="height: 60vh;"
bind:clientHeight={chartHeight}
bind:clientWidth={chartWidth}>
{#if chartWidth && chartHeight}
    <svg width={"100%"} height={"100%"}>
    <g transform="translate({margin.left},0)">
    {#each months as month, i}
    <g transform="translate({Math.floor((new Date(2000, month, 1) - new Date(2000, 0, 1)) / (1000 * 60 * 60 * 24)) * innerChartWidth / 365}, 0)" class="text-xs text-gray-500">
    {#if i % 2 == 0}
    <rect height={innerChartHeight} width={innerChartWidth / 12} class="fill-gray-50"></rect>
    {/if}
    <text fill="currentColor" x={innerChartWidth / 24} y={5} text-anchor="middle" dominant-baseline="hanging">{new Date(2000, month, 1).toLocaleString('de-AT', { month: 'short' })}</text>
    </g>
    {/each}
    </g>

    <g transform="">
    {#each yScale.ticks(4) as tick}
    <g transform={`translate(0, ${yScale(tick)})`} class="text-xs text-gray-500">
    <text fill="currentColor" x={innerChartWidth - 22} dominant-baseline="middle" text-anchor="end">{tick}°C</text>
    <line class="text-white" x1=0 y1=0 x2={margin.left + innerChartWidth} y2=0 stroke="currentColor" stroke-width="2" stroke-opacity="0.1"></line>
    </g>
    {/each}
    </g>

    <g transform="translate({margin.left},{margin.top})">
    {#if years.length > 0}
    <g class="{showDays ? "opacity-75 pointer-events-none" : "opacity-100"}">
    {#each lines as line, i}
    <path
    d={line}
    fill="none"
    stroke-width="2"
    stroke="{getColor(i)}"
    id="line-{i}"
    on:mouseover={() => $selectedWeatherYear = years[i]}
    on:focus={() => $selectedWeatherYear = years[i]}
    on:mouseout={() => $selectedWeatherYear = currentYear}
    on:blur={() => $selectedWeatherYear = currentYear}
    opacity={$selectedWeatherYear == years[i] ? 1 : 0.3}
    class="transition duration-75 text-gray-900"
    in:draw="{{duration: 1000, delay: i * 200}}"
    ></path>
    {/each}
    </g>
    {/if}

    {#if $selectedWeatherYear == currentYear && !showDays}
    <g transform="translate({xScale(dataForCurrentYear[dataForCurrentYear.length - 1].day)},{yScale(dataForCurrentYear[dataForCurrentYear.length - 1].average)})" 
    class="text-gray-900 transition"
    transition:fade>
      <circle r={6} class="fill-current">
        <animate attributeName="r" from="6" to="10" dur="1.5s" begin="0s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="1" to="0.5" dur="1.5s" begin="0s" repeatCount="indefinite"/>
      </circle>
      <circle r={6} class="fill-current"></circle>
      <text class="text-sm fill-current" x={30} y={30}>
        <tspan x={0}>30-tägige Durchschnittstemperatur</tspan>
        <tspan x={0} dy={16}>am {dataForCurrentYear[dataForCurrentYear.length - 1].day.toLocaleDateString("de-AT", { month: "long", day: "numeric", year: "numeric"})}</tspan>
      </text>
    </g>
    {/if}
  

    {#if showDays}
    <g>
    {#each dataForCurrentYear as day, index}
      {@const circleRadius = 5}
      {@const commonClasses = "transition pointer-events-none"}
      <g transform="translate({xScale(day.day)},{yScale(day.t)})">
        <rect 
        fill="white" 
        opacity={0}
        height={circleRadius * 2} 
        width={circleRadius * 2} 
        x={-circleRadius} 
        y={-circleRadius}
        on:mouseover={() => selectedDay = index}  
        on:focus={() => selectedDay = index}
        on:mouseout={() => selectedDay = false}
        on:blur={() => selectedDay = false}>
        </rect>
        {#if day.heatDay}
        <circle r={circleRadius} 
        fill={types[0].color} 
        class="{commonClasses} {selectedDay && selectedDay !== index ? "opacity-50" : "opacity-100"}"
        ></circle>
        {:else if day.summerDay}
        <circle r={circleRadius} 
        fill={types[1].color} 
        class="{commonClasses} {selectedDay && selectedDay !== index ? "opacity-50" : "opacity-100"}"></circle>
        {:else if day.tropicalNight}
        <circle r={circleRadius} 
        fill={types[2].color} 
        class="{commonClasses} {selectedDay && selectedDay !== index ? "opacity-50" : "opacity-100"}"></circle>
        {:else if day.iceDay}
        <circle r={circleRadius} 
        fill={types[3].color} 
        class="{commonClasses} {selectedDay && selectedDay !== index ? "opacity-50" : "opacity-100"}"></circle>
        {:else}
        <circle r={circleRadius} 
        class="fill-gray-900  {commonClasses} {selectedDay && selectedDay !== index ? "opacity-50" : "opacity-100"}"></circle>
        {/if}
      </g>
    {/each}
    </g>
    {/if}

    {#if selectedDay}
        <g transform="translate({xScale(dataForCurrentYear[selectedDay].day) - 40},{yScale(dataForCurrentYear[selectedDay].t) - 84})">
          <path d="m 35 75 l 5 5 l 5 -5 h 35 v -75 h -80 v 75 z" class="text-gray-100 fill-current shadow stroke-gray-200"></path>
          <rect></rect>
          <text class="text-gray-700 fill-current text-sm" dominant-baseline="hanging" text-anchor="middle" x={40} y={5}>{new Date(dataForCurrentYear[selectedDay].day).toLocaleDateString("de-AT")}</text>
          <text class="text-gray-700 fill-current text-sm" dominant-baseline="hanging" text-anchor="middle" x={40} y={25}>{dataForCurrentYear[selectedDay].tmax}°C</text>
          <text class="text-gray-900 fill-current text-lg" dominant-baseline="hanging" text-anchor="middle" x={40} y={40}>{dataForCurrentYear[selectedDay].t}°C</text>
          <text class="text-gray-700 fill-current text-sm" dominant-baseline="hanging" text-anchor="middle" x={40} y={60}>{dataForCurrentYear[selectedDay].tmin}°C</text>
        </g>
    {/if}
    </g>
    </svg>
    {/if}
  </div>
  {/if}
