<script>
    import { line, area } from "d3-shape";
    import { scaleLinear } from "d3-scale";
    import { draw, fade } from "svelte/transition";
	import { quintOut } from 'svelte/easing';
    import { pointer } from "d3-selection";

    export let dataHistoric;
    export let dataPaths;
    export let chosenBudget;
    export let selectedStartYear;

    const keys = [{
      key: "nochange",
      label: "Gleichbleibende Emissionen",
      color: "#9E0669"
    }, {
      key: "linear",
      label: "Jährliche Abnahme um {value}",
      color: "#F56860"
    }, {
      key: "linear_alt",
      label: "Jährliche Abnahme um {value}",
      color: "#F2A60D"
    }, {
      key: "percentage",
      label: "Pfad bis Klimaneutralität 2040 <br>-22% pro Jahr",
      color: "#F2A60D"
    }];

    let chartWidth;
    let chartHeight;
    let margin = { top: 20, right: 15, bottom: 30, left: 0};
    
    $: innerChartWidth = chartWidth - margin.left - margin.right;
    $: innerChartHeight = chartHeight - margin.top - margin.bottom;

    $: xScale = scaleLinear()
      .range([0, innerChartWidth])
      .domain([selectedStartYear, 2040]);

    $: yScale = scaleLinear()
      .range([innerChartHeight, 0])
      .domain([0, 100]);

    $: generateLine = (key) => {
      return line()
      .x(d => xScale(d.year || 0) )
      .y(d => yScale(key == "total_co2e_t" ? (d[key] / 1000000) : d[key])) || 0;
    }

    $: generateArea = (key) => {
      return line()
      .x(d => xScale(d.year || 2021))
      .y(d => yScale(d[key] || 0));
    }

    $: chosenPath = 1;

    $: areas = selectedKeys.map((key) => generateArea(key)(dataPaths));
    $: lines = selectedKeys.map((key) => generateLine(key)(dataPaths));

    $: lineHistoric = generateLine("total_co2e_t")(dataHistoric);

    $: selectedKeys = Object.keys(dataPaths[0]).filter(d => d.includes(chosenBudget));

    $: getZeroYear = function(key) {
        return dataPaths.find(d => d[key] == 0).year;
    }

    $: getReductionRate = function(key) {
        var values = dataPaths.map((d,i) => d[key]);
        var rates = values.map((d,i) => Math.round((d - values[Math.max(i - 1,0)]) * 10) / 10).slice(1).filter(d => d !== 0);
        var inflectionYear = 0;
        var inflectionIndex = 0;

        for(var i = 0; i < rates.length; i++) {
            var difference = rates[i] - rates[Math.max((i-1),0)];
            console.log(difference);
            if(difference > 1 || difference < -1) {
                inflectionYear = dataPaths[i].year;
                inflectionIndex = i;
            }
        }

        console.log(values);
        console.log(rates);
        console.log(inflectionIndex);
        console.log("")
        

        var valueBeforeInflection = rates[inflectionIndex - 1];
        var valueAfterInflection = rates[inflectionIndex];

        var string = "";

        if(inflectionYear == 0) {
        string =  rates[1] + " Mio t.";
        } else {
        string = valueBeforeInflection + " Mio t. bis " + inflectionYear + ", danach " + valueAfterInflection + " Mio t. pro Jahr";
        }

        return string;
    }
</script>

<div class="relative">
<div id="legend" class="flex-col mb-4 mt-4 md:mt-0 md:absolute md:top-12 text-sm bg-white z-20 md:p-1" style="left: {xScale(2030)}px">
    {#each selectedKeys as key, i}
      {@const selectedKey = keys.find(d => d.key == key.replace(chosenBudget + "_", ""))}
      <div class="flex my-1 gap-1 items-start leading-tight {chosenPath == i ? "opacity-100" : "opacity-60"}" 
      on:mouseover={() => chosenPath = i}
      on:focus={() => chosenPath = i}
      on:mouseout={() => chosenPath = 2}
      on:blur={() => chosenPath = 2}
      >
        <div class="pl-1" style="border-left: 4px solid {selectedKey.color}">{@html selectedKey.label.replace("{value}", getReductionRate(key))}</div>
      </div>
    {/each}
</div>

<div class="h-72 w-full mt-4"
bind:clientHeight={chartHeight}
bind:clientWidth={chartWidth}>

  <svg width={"100%"} height={"100%"}>
    {#if chartWidth && chartHeight && lines && areas}
    <!--
    <rect
        width={xScale(2021)}
        height={chartHeight - margin.bottom}
        class="fill-gray-100">
    </rect>
    -->
    {#if selectedStartYear < 2016 && xScale(2021) > 250}
    <line 
    x1={xScale(2021)}
    x2={xScale(2021)}
    y1={0}
    y2={chartHeight - margin.bottom}
    class="stroke-gray-400"
    ></line>
    <text text-anchor="end" dominant-baseline="hanging" x={xScale(2021) - 5} y=5 class="text-xs uppercase fill-gray-300 font-semibold tracking-wide">Vergangenheit</text>
    <text x={xScale(2021) + 5} y=5 dominant-baseline="hanging" class="text-xs uppercase fill-gray-300 font-semibold tracking-wide">Zukunft</text>
    {/if}

    <g transform="translate({margin.left},{margin.top})">
      <g class="chart-y-axis text-sm text-gray-600">
        {#each yScale.ticks(6) as tick, index}
        <g transform={`translate(0, ${yScale(tick)})`} class="text-gray-500">
          <line x1="0" x2={innerChartWidth} y1="0" y2="0" stroke-width="1" class="stroke-current opacity-30" />
          <text class="text-xs fill-current bg-white" x="2" y="-3">{tick} 
          <tspan dx=2></tspan>
          {#if index == 5}
          <tspan dx=1>Mio. t Treibhausgase</tspan>
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
        <g id="historic">
        <path
          d="{lineHistoric}L{xScale(2021)},{innerChartHeight}L0,{innerChartHeight}Z"
          fill={"#268EA5"}
          fill-opacity=0.2
          transition:fade
          >
        </path>
        <path
          d={lineHistoric}
          fill="none"
          stroke-width=4
          stroke={"#268EA5"}
          transition:draw={{duration: 2000, easing: quintOut}}
          >
          </path>
        </g>
        {#key chosenBudget}
        <g id="budget">
          {#each lines as line, i}
          {@const selectedKey = keys.find(d => d.key == selectedKeys[i].replace(chosenBudget + "_", ""))}
          <g id="area">
          <path
          d="{areas[i]}L{xScale(2021)},{yScale(0)}L{xScale(2021)},{yScale(80)}z"
          fill={selectedKey.color}
          fill-opacity={chosenPath == i ? "0.3" : "0"}
          transition:fade
          on:mouseover={() => chosenPath = i}
          on:mouseout={() => chosenPath = 2}
          >
          </path>
          </g>

          <g id="line"
          on:mouseover={() => chosenPath = i}
          on:mouseout={() => chosenPath = 2}>
          <path
          d={line}
          fill="none"
          stroke-width=4
          stroke={selectedKey.color}
          transition:draw={{duration: 2000, easing: quintOut}}
          >
          </path>
          </g>
          {/each}
        </g>
        {/key}

        {#each selectedKeys as key, i}
        <g transform="translate({xScale(getZeroYear(key))},{innerChartHeight + 16})" style="color: {keys[keys.findIndex(d => d.key == selectedKeys[i].replace(chosenBudget + "_",""))].color}">
          <text class="fill-current text-xs" text-anchor="middle">
            {#if getZeroYear(key) == 2025.5}
            <tspan x=1 y=0>Mitte</tspan>
            <tspan x=0 y=14>2025</tspan>
            {:else}
            <tspan x=0 y=0>Ende</tspan>
            <tspan x=-1 y=14>{getZeroYear(key)}</tspan>
            {/if}
          </text>
        </g>
        {/each}

        <g transform="translate({xScale(2021)},{yScale(80)})">
        <circle r=5 fill="#268EA5"></circle>
            <circle r=5 fill="#268EA5">
            <animate attributeName="r" from="5" to="10" dur="1.5s" begin="0s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="1" to="0.5" dur="1.5s" begin="0s" repeatCount="indefinite"/>
        </circle>
        </g>

        <g transform="translate({xScale(2021) + (selectedStartYear < 2020 ? 10 : 20)},{innerChartHeight - 65})" class="hidden md:block"
        >
        <text style="color: {keys[keys.findIndex(d => d.key == selectedKeys[chosenPath].replace(chosenBudget + "_",""))].color}" class="text-sm md:text-base fill-current uppercase font-semibold tracking-wide">
          <tspan x="0" dy="1.2em">{chosenBudget} Mio. t</tspan>
          <tspan x="0" dy="1.2em">THG</tspan>
          <tspan x="0" dy="1.2em">Budget</tspan>
        </text>
        </g>
    </g>
    {/if}
  </svg>
</div>
</div>