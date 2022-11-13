<script>
    import Papa from "papaparse";
    import { line, area } from "d3-shape";
    import { scaleLinear } from "d3-scale";
    import { draw } from "svelte/transition";

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
      key: "linear",
      label: "Lineare Abnahme"
    }, {
      key: "percentage",
      label: "Prozentuale Abnahme"
    }, {
      key: "nochange",
      label: "Business As Usual"
    }];

    const colors = ['#00429d', '#73a2c6', '#f4777f', '#93003a'];

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
          console.log(dataHistoric);
        }
      }
    }
    );

    $: xScale = scaleLinear()
      .range([0, innerChartWidth])
      .domain([2000, 2040]);

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

    $: lines = keys.map((key) => generateLine(chosenBudget + "_" + key.key)(data))
    .concat(generateLine("total_co2e_t")(dataHistoric));

    let chartWidth;
    let chartHeight;
    let margin = { top: 20, right: 15, bottom: 20, left: 0};
    $: innerChartWidth = chartWidth - margin.left - margin.right;
    $: innerChartHeight = chartHeight - margin.top - margin.bottom;
</script>

<div id="switch" class="flex gap-4">
  <div class="flex gap-2 items-center">
  <h3 class="font-bold">Wahrscheinlichkeiten</h3>
  <label class="flex items-center gap-1">
  <input type="radio" value={66} bind:group={chosenProbability}>
  <span>66%</span>
  </label>
  <label class="flex items-center gap-1">
  <input type="radio" value={50} bind:group={chosenProbability}>
  <span>50%</span>
  </label>
  </div>
  <div>
  <div class="flex ml-4 gap-2">
  <h3 class="font-bold">Temperatur-Ziel</h3>
  <label class="flex items-center gap-1">
  <input type="radio" name="goal" value={1.5} bind:group={chosenTemperature}>
  <span>1,5 Grad</span>
  </label>
  <label class="flex items-center gap-1">
  <input type="radio" name="goal" value={1.65} bind:group={chosenTemperature}>
  <span>1,5 Grad mit zwischenzeitlich 1,65 Grad</span>
  </label>
  </div>
  </div>
</div>

<div id="legend" class="flex gap-4">
  {#each keys as key, i}
    <div class="flex gap-1 items-center">
      <span class="inline-block h-3 w-3 rounded-full" style="background: {colors[i]}"></span>
      <span>{key.label}</span>
    </div>
  {/each}
</div>

<div class="h-56 w-full"
bind:clientHeight={chartHeight}
bind:clientWidth={chartWidth}>
  <svg width={"100%"} height={"100%"}>
    {#if chartWidth && chartHeight}
    <g transform="translate({margin.left},{margin.top})">
      <g class="chart-y-axis text-sm text-gray-600">
        {#each yScale.ticks(6) as tick, index}
        <g transform={`translate(0, ${yScale(tick)})`} class="text-gray-500">
          <line x1="0" x2={innerChartWidth} y1="0" y2="0" stroke-width="1" class="stroke-current opacity-30" />
          <text class="text-xs fill-current bg-white" x="2" y="-3">{tick} <tspan dx=2>Mio. t</tspan></text>
        </g>
        {/each}
      </g>
      <g class="chart-x-axis">
        {#each xScale.ticks(6) as tick, i}
            <g transform={`translate(${xScale(tick)}, ${innerChartHeight})`} class="text-xs text-gray-500">
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
        <g>
          {#each lines as line, i}
          <g id="line-{keys[i]}">
          <path
          d={line}
          fill="none"
          stroke-width=4
          stroke={colors[i]}
          transition:draw
          >
          </path>
          </g>
          {/each}
        </g>
    </g>
    {/if}
  </svg>
</div>