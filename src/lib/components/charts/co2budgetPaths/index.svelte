<script>
    import Papa from "papaparse";
    import { line, area } from "d3-shape";
    import { scaleLinear } from "d3-scale";


    $: data = [];

    Papa.parse(
    './data/scenarios_co2budget.csv',
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

    $: values = [{
      year: 2021,
      value: 80.2
    }];

    $: calculatePath = function() {
      values.push({
        year: 2022,
        curved: 80.2,
        linear: 80.2,
        businessAsUsual: 80.2
      })
    };

    $: xScale = scaleLinear()
      .range([0, chartWidth])
      .domain([2021, 2040]);

    $: yScale = scaleLinear()
      .range([chartHeight, 0])
      .domain([0, 85]);

    $: generateLine = (key) => {
      return line()
      .x(d => xScale(d.value))
      .y(d => yScale(d[key]));
    }

    const keys = ["curved","linear","businessAsUsual"];
    $: lines = keys.map((key) => generateLine(key)(values));

    let chartWidth;
    let chartHeight;
</script>

<div id="switch" class="flex gap-4">
  <div>
  <h3>Wahrscheinlichkeiten</h3>
  <label>
  <input type="radio" name="probabilities" value=66>
  <span>66%</span>
  </label>
  <label>
  <input type="radio" name="probabilities" value=50>
  <span>50%</span>
  </label>
  </div>
  <div>
  <h3>Temperatur-Ziel</h3>
  <label>
  <input type="radio" name="goal" value="1.5">
  <span>1,5 Grad</span>
  </label>
  <label>
  <input type="radio" name="goal" value="1.65">
  <span>1,5 Grad mit zwischenzeitlich 1,65 Grad</span>
  </label>
  </div>
</div>

<div class="h-56 w-full"
bind:clientHeight={chartHeight}
bind:clientWidth={chartWidth}>
  <svg width={"100%"} height={"100%"}>
    {#if chartWidth && chartHeight}
    <g>
      <g class="chart-y-axis text-sm text-gray-600">
        {#each yScale.ticks(6) as tick, index}
        <g transform={`translate(0, ${yScale(tick)})`} class="text-gray-500">
          <line x1="0" x2={chartWidth} y1="0" y2="0" stroke-width="1" class="stroke-current opacity-30" />
          <text class="text-xs fill-current bg-white" x="2" y="-3">{tick} <tspan dx=2>Mio. t</tspan></text>
        </g>
        {/each}
      </g>
      <g class="chart-x-axis">
        {#each xScale.ticks(6) as tick, i}
            <g transform={`translate(${xScale(tick)}, ${chartHeight - 20})`} class="text-xs text-gray-500">
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
    </g>
    {/if}
  </svg>
</div>