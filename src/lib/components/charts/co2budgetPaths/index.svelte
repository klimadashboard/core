<script>
    import Papa from "papaparse";
    import { line, area } from "d3-shape";
    import { scaleLinear } from "d3-scale";
    import { draw, fade } from "svelte/transition";
	  import { quintOut } from 'svelte/easing';
    import { pointer } from "d3-selection";

    export let v;

    let budgets = [{
      value: 510,
      probability: 50,
      temperature: 1.5,
      type: "THG"
    }, {
      value: 280,
      probability: 66,
      temperature: 1.5,
      type: "THG"
    }, {
      value: 610,
      probability: 50,
      temperature: 1.65,
      type: "THG"
    }, {
      value: 340,
      probability: 66,
      temperature: 1.65,
      type: "THG"
    }];

    const keys = [{
      key: "nochange",
      label: "Gleichbleibende Emissionen",
      zeroYear: 2025.5
    }, {
      key: "linear",
      label: "Jährliche Abnahme um {value} Mio t",
      zeroYear: 2029
    }, {
      key: "percentage",
      label: "Pfad bis Klimaneutralität 2040",
      zeroYear: 2040
    }, {
      key: "historic",
      label: "Historische Emissionen"
    }];

    const colors = ['#9E0669', '#F56860', '#F2A60D', '#268EA5'];

    $: data = [];
    $: dataHistoric = [];

    Papa.parse(
    '../data/scenarios_co2budget.csv',
    {
      download: true,
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        if (results) {
          data = results.data;
        }
      }
    }
    );

    Papa.parse(
    '../data/historic_emissions.csv',
    {
      download: true,
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        if (results) {
          dataHistoric = results.data;
        }
      }
    }
    );

    $: selectedStartYear = chartWidth > 1000 ? 1990 : 2010;

    $: xScale = scaleLinear()
      .range([0, innerChartWidth])
      .domain([selectedStartYear, 2040]);

    $: yScale = scaleLinear()
      .range([innerChartHeight, 0])
      .domain([0, 90]);

    $: generateLine = (key) => {
      return line()
      .x(d => xScale(d.year))
      .y(d => yScale(key == "total_co2e_t" ? (d[key] / 1000000) : d[key])) || 0;
    }

    $: generateArea = (key) => {
      return line()
      .x(d => xScale(d.year || 2021))
      .y(d => yScale(d[key] || 0));
    }

    $: chosenBudget = budgets.find(d => d.temperature == chosenTemperature && d.probability == chosenProbability).value;
    $: chosenTemperature = 1.5;
    $: chosenProbability = 66;
    $: chosenPath = 2;

    $: areas = [...keys].splice(0,3).map((key) => generateArea(chosenBudget + "_" + key.key)(data));

    $: lines = keys.map((key) => {
    if(key.key == "historic") {
    return generateLine("total_co2e_t")(dataHistoric)
    } else {
    return generateLine(chosenBudget + "_" + key.key)(data);
    }
    }
    );

    $: console.log(areas);

    let chartWidth;
    let chartHeight;
    let margin = { top: 20, right: 15, bottom: 30, left: 0};
    $: innerChartWidth = chartWidth - margin.left - margin.right;
    $: innerChartHeight = chartHeight - margin.top - margin.bottom;
    $: linearReduction = 0;

    $: if(data[0]) {
      linearReduction = Math.round(data[0][chosenBudget + "_linear"] - data[1][chosenBudget + "_linear"]);
    } 
</script>


<div class="h-72 w-full mt-4"
bind:clientHeight={chartHeight}
bind:clientWidth={chartWidth}>
<div id="legend" class="flex-col mb-4 md:absolute md:top-12 text-sm" style="left: {xScale(2030)}px">
  {#each [...keys].splice(0,3) as key, i}
    <div class="flex gap-1 items-center leading-tight {chosenPath == i ? "opacity-100" : "opacity-60"}" 
    on:mouseover={() => chosenPath = i}
    on:focus={() => chosenPath = i}
    on:mouseout={() => chosenPath = 2}
    on:blur={() => chosenPath = 2}
    >
      <span class="inline-block h-3 w-3 rounded-full" style="background: {colors[i]}"></span>
      <span>{key.label.replace("{value}",linearReduction)}</span>
    </div>
  {/each}
</div>

  <svg width={"100%"} height={"100%"}>
    {#if chartWidth && chartHeight && data}
    <!--
    <rect
        width={xScale(2021)}
        height={chartHeight - margin.bottom}
        class="fill-gray-100">
    </rect>
    -->
    <line 
    x1={xScale(2021)}
    x2={xScale(2021)}
    y1={0}
    y2={chartHeight - margin.bottom}
    class="stroke-gray-400"
    ></line>
    <text text-anchor="end" dominant-baseline="hanging" x={xScale(2021) - 5} y=5 class="text-xs uppercase fill-gray-300 font-semibold tracking-wide">Vergangenheit</text>
    <text x={xScale(2021) + 5} y=5 dominant-baseline="hanging" class="text-xs uppercase fill-gray-300 font-semibold tracking-wide">Zukunft</text>

    <g transform="translate({margin.left},{margin.top})">
      
      <g class="chart-y-axis text-sm text-gray-600">
        {#each yScale.ticks(6) as tick, index}
        <g transform={`translate(0, ${yScale(tick)})`} class="text-gray-500">
          <line x1="0" x2={innerChartWidth} y1="0" y2="0" stroke-width="1" class="stroke-current opacity-30" />
          <text class="text-xs fill-current bg-white" x="2" y="-3">{tick} 
          <tspan dx=2>Mio. t</tspan>
          {#if index == 0}
          <tspan dx=1>Treibhausgase</tspan>
          {/if}
          </text>
        </g>
        {/each}
      </g>
      <g class="chart-x-axis">
        {#each xScale.ticks(10) as tick, index}
            <g transform={`translate(${index == 0 ? xScale(tick) + 12 : xScale(tick)}, ${innerChartHeight})`} class="text-xs text-gray-500">
              {#if tick < 2022 && tick % 10 == 0}
              <text dy={15} text-anchor="middle" fill="currentColor">
                {tick}
              </text>
              {/if}
              <g class="text-gray-500">
              <line y1={0} y2={4} stroke="currentColor" />
              </g>
            </g
            >
          {/each}
        </g>
        {#key chosenBudget}
        <g>
          {#each lines as line, i}
          {#if keys[i].key == "historic"}
          <path
          d="{line}L{xScale(2021)},{innerChartHeight}L0,{innerChartHeight}Z"
          fill={colors[i]}
          fill-opacity=0.2
          transition:fade
          >
          </path>
          {:else}
          <path
          d="{areas[i]}L{xScale(2021)},{yScale(0)}L{xScale(2021)},{yScale(80)}z"
          fill={colors[i]}
          fill-opacity={chosenPath == i ? "0.3" : "0"}
          transition:fade
          on:mouseover={() => chosenPath = i}
          on:mouseout={() => chosenPath = 2}
          >
          </path>
          {/if}
          <g id="line"
          on:mouseover={() => chosenPath = i}
          on:mouseout={() => chosenPath = 2}>
          <path
          d={line}
          fill="none"
          stroke-width=4
          stroke={colors[i]}
          transition:draw={{duration: 2000, easing: quintOut}}
          >
          </path>
          </g>
          {/each}
        </g>
        {/key}

        {#each [...keys].splice(0,3) as key, i}
        <g transform="translate({xScale(key.zeroYear)},{innerChartHeight + 16})" style="color: {colors[i]}">
          <text class="fill-current text-xs" text-anchor="middle">
            {#if key.zeroYear == 2025.5}
            <tspan x=-12 y=0>Mitte</tspan>
            <tspan x=-13 y=14>2025</tspan>
            {:else}
            <tspan x=0 y=0>Ende</tspan>
            <tspan x=-1 y=14>{key.zeroYear}</tspan>
            {/if}
          </text>
        </g>
        {/each}

        <g transform="translate({xScale(2021)},{yScale(80)})">
        <circle r=5 fill="{colors[3]}"></circle>
            <circle r=5 fill="{colors[3]}">
            <animate attributeName="r" from="5" to="10" dur="1.5s" begin="0s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="1" to="0.5" dur="1.5s" begin="0s" repeatCount="indefinite"/>
        </circle>
        </g>

        <g transform="translate({xScale(2021) + 15},{innerChartHeight - 70})"
        >
        <text style="color: {colors[chosenPath]}" class="fill-current uppercase font-semibold tracking-wide">
          <tspan x="0" dy="1.2em">280 Mio. t</tspan>
          <tspan x="0" dy="1.2em">THG</tspan>
          <tspan x="0" dy="1.2em">Budget</tspan>
        </text>
        </g>
    </g>
    {/if}
  </svg>
</div>

<div id="settings" class="flex items-center gap-2 text-sm">
  <span>Startjahr auswählen</span>
  <input type="number" min=1990 max=2021 bind:value={selectedStartYear} class="px-3 py-1 w-20 bg-gray-100 rounded-full">
</div>