<script>
    import Papa from "papaparse";
    import { line, area } from "d3-shape";
    import { scaleLinear } from "d3-scale";
    import { draw, fade } from "svelte/transition";
	  import { quintOut } from 'svelte/easing';

    export let v;
    console.log(v);

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
      label: "Gleichbleibende Emissionen"
    }, {
      key: "linear",
      label: "Jährliche Abnahme um {value} Mio t"
    }, {
      key: "percentage",
      label: "Pfad bis Klimaneutralität 2040"
    }, {
      key: "historic",
      label: "Historische Emissionen"
    }];

    const colors = ['#9E0669', '#F56860', '#FADEA5', '#268EA5'];

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
          console.log(data);
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

    $: selectedStartYear = 1990;

    $: xScale = scaleLinear()
      .range([0, innerChartWidth])
      .domain([selectedStartYear, 2040]);

    $: yScale = scaleLinear()
      .range([innerChartHeight, 0])
      .domain([0, 90]);

    $: generateLine = (key) => {
      return line()
      .x(d => xScale(d.year))
      .y(d => yScale(key == "total_co2e_t" ? (d[key] / 1000000) : d[key]));
    }

    $: chosenBudget = budgets.find(d => d.temperature == chosenTemperature && d.probability == chosenProbability).value;
    $: chosenTemperature = 1.5;
    $: chosenProbability = 66;
    $: chosenPath = 2;

    $: lines = keys.map((key) => {
    if(key.key == "historic") {
    return generateLine("total_co2e_t")(dataHistoric)
    } else {
    return generateLine(chosenBudget + "_" + key.key)(data);
    }
    }
    );

    let chartWidth;
    let chartHeight;
    let margin = { top: 20, right: 15, bottom: 20, left: 0};
    $: innerChartWidth = chartWidth - margin.left - margin.right;
    $: innerChartHeight = chartHeight - margin.top - margin.bottom;
    $: linearReduction = 0;

    $: if(data[0]) {
      linearReduction = Math.round(data[0][chosenBudget + "_linear"] - data[1][chosenBudget + "_linear"]);
    } 
</script>

<div id="switch" class="flex flex-wrap gap-4 items-center">
    <div>
    <h3 class="font-bold">Erderhitzung im Jahr 2100</h3>
    <div class="flex gap-2 items-center bg-gray-100 rounded-full py-1 px-3">
    <label class="flex items-center gap-1 {chosenTemperature == 1.5 ? "font-bold" : ""}">
    <input type="radio" name="goal" value={1.5} bind:group={chosenTemperature}>
    <span>+1.5°C</span>
    </label>
    <label class="flex items-center gap-1 {chosenTemperature == 1.65 ? "font-bold" : ""}">
    <input type="radio" name="goal" value={1.65} bind:group={chosenTemperature}>
    <span>+1,5°C, zwischenzeitlich 1.65°C</span>
    </label>
    </div>
    </div>

  <div>
  <h3 class="font-bold">Wahrscheinlichkeit</h3>
  <div class="flex gap-1 bg-gray-100 rounded-full py-1 px-3">
  
  <label class="flex items-center gap-1 {chosenProbability == 66 ? "font-bold" : ""}">
  <input type="radio" value={66} bind:group={chosenProbability}>
  <span>66%</span>
  </label>
  <label class="flex items-center gap-1 {chosenProbability == 50 ? "font-bold" : ""}">
  <input type="radio" value={50} bind:group={chosenProbability}>
  <span>50%</span>
  </label>

  </div>
</div>
  <p><b>= {chosenBudget} Mio. t. THG Budget verbleiben</b> ab 2022</p>

  <div class="ml-auto">
    <h3 class="font-bold">Startjahr</h3>
  <input type="number" min=1990 max=2021 bind:value={selectedStartYear} class="px-3 py-1 w-24 bg-gray-100 rounded-full">
  </div>
</div>

<div class="h-72 w-full mt-4"
bind:clientHeight={chartHeight}
bind:clientWidth={chartWidth}>
<div id="legend" class="flex-col absolute top-12 text-sm" style="left: {xScale(2030)}px">
  {#each keys as key, i}
    <div class="flex gap-1 items-center leading-tight">
      <span class="inline-block h-3 w-3 rounded-full" style="background: {colors[i]}"></span>
      <span>{key.label.replace("{value}",linearReduction)}</span>
    </div>
  {/each}
</div>

  <svg width={"100%"} height={"100%"}>
    {#if chartWidth && chartHeight}
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
        {#each xScale.ticks(6) as tick, index}
            <g transform={`translate(${index == 0 ? xScale(tick) + 12 : xScale(tick)}, ${innerChartHeight})`} class="text-xs text-gray-500">
              <text dy={15} text-anchor="middle" fill="currentColor">
                {tick}
              </text>
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
          {#if keys[i].key == "historic" || i == chosenPath}
          <path
          d="{line}L{xScale(2021)},{innerChartHeight}{keys[i].key == "historic" ? ("L0," + innerChartHeight) : ""}Z"
          fill={colors[i]}
          fill-opacity=0.2
          transition:fade
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

        <g transform="translate({xScale(2021)},{yScale(80)})">
        <circle r=5 fill="{colors[3]}"></circle>
            <circle r=5 fill="{colors[3]}">
            <animate attributeName="r" from="5" to="10" dur="1.5s" begin="0s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="1" to="0.5" dur="1.5s" begin="0s" repeatCount="indefinite"/>
        </circle>
        </g>

        <text x={xScale(2021) + 5} y={innerChartHeight - 5} class="text-xs uppercase opacity-20 font-semibold tracking-wide">Budget</text>
    </g>
    {/if}
  </svg>
</div>

<div class="text-lg max-w-2xl mx-auto mt-4">
  {@html v.description
  .replace("{selectedTemperature}",chosenTemperature)
  .replace("{selectedProbability}",chosenProbability)
  .replace("{remainingBudget}",chosenBudget)
  .replace("{yearsRemainingBusinessAsUsual}", Math.round(chosenBudget / 80))
  .replace("")}
</div>