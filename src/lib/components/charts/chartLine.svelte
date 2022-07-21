<script>
    import { max, min, extent, bisector } from 'd3-array';
    import { scaleLinear, scaleTime } from 'd3-scale';
    import formatNumber from "$lib/stores/formatNumber";
    import { pointer } from 'd3-selection';
    import { area, line } from 'd3-shape';
  
    export let data;
    export let keys = [];
    export let labels = [];
    export let visualisation;
    export let colors;
    export let showLegend = true;
    export let unit = "";
    export let showAreas = false;
    export let showDots = false;
    export let showTotal = true;
    export let lineWidth = 3;
    export let circleRadius = 5;
    export let marginLeft = 20;
    export let xTicksInterval = 10;
    export let minValue = 0;
  
    let chartHeight;
    let chartWidth;
    let legendHeight;
  
    $: margin = { top: legendHeight + 10, right: 15, bottom: 20, left: marginLeft };
    $: innerChartHeight = chartHeight - margin.top - margin.bottom;
    $: innerChartWidth = chartWidth - margin.left - margin.right;
  
    $: xScale = scaleLinear()
      .range([0, innerChartWidth])
      .domain([0, max(data, (d) => d.x)]);
  
    $: yScale = scaleLinear()
      .range([innerChartHeight, 0])
      .domain([minValue, max(data.map((item, index) => {
        if(visualisation == "stacked") {
        // get total of all values for keys
        var total = 0;
        for(var k = 0; k < shownKeys.length; k++) {
          total += item[shownKeys[k]];
        }
        return total;
      } else {
        // get max of values
        var values = [];
        for(var k = 0; k < shownKeys.length; k++) {
          values.push(item[shownKeys[k]]);
        }
        var max = Math.max(...values);
        return max;
      }
      })) + 1 * 1.1]);
  
      $: shownKeys = [...keys];
  
      $: shownColors = [...colors];
  
      $: generateLine = (key) => {
        if(visualisation == "stacked") {
        return line()
        .x(d => xScale(d.x))
        .y(function(d) {
          var total = 0;
          for(var i = 0; i <= shownKeys.indexOf(key); i++) {
            total += d[shownKeys[i]];
          }
          return yScale(total);
        })
        } else {
        return line()
        .x(d => xScale(d.x))
        .y(d => yScale(d[key]));
        }
      }
  
      $: generateArea = (key) => {
      if(visualisation == "stacked") {
        return area()
        .x(d => xScale(d.x))
        .y0(innerChartHeight)
        .y1(function (d) {
          var total = 0;
          for(var i = 0; i <= shownKeys.indexOf(key); i++) {
            total += d[shownKeys[i]];
          }
          return yScale(total);
        });
      } else {
      return area()
        .x(d => xScale(d.x))
        .y0(innerChartHeight)
        .y1(function (d) {
          return yScale(d[key]);
        });
      };
    };
  
    $: lines = keys.map((key) => generateLine(key)(data));
    $: areas = keys.map((key) => generateArea(key)(data));
    $: totals = data.map((datapoint) => getTotal(datapoint));
  
    $: getTotal = function(datapoint) {
      var total = 0;
      for(var i = 0; i < keys.length; i++) {
        total += datapoint[keys[i]];
      }
      return total;
    }
  
    $: prettifyTick = function(tick) {
        if(tick > 999999) {
            return formatNumber(Math.round(tick / 1000000 * 100) / 100) + " Mio";
        }
        return formatNumber(tick);
    }
  
    $: selectedIndex = data[data.length - 1].x;
  
    const handleMouseMove = function (event) {
      const [currentXPosition] = pointer(event);
      const currentXValue = Math.round(xScale.invert([currentXPosition][0]));
      selectedIndex = currentXValue || 0;
    };
  
    const handleMouseLeave = function () {
      selectedIndex = data[data.length - 1].x;
    };
  </script>
  
  <div
      class="h-full relative"
      bind:clientHeight={chartHeight}
      bind:clientWidth={chartWidth}
      >
      <svg 
      width={"100%"} 
      height={"100%"}
      >
      {#if chartWidth && chartHeight}
      <g class="chart-y-axis text-sm text-gray-600" style="transform: translate(0,{margin.top}px">
        {#each yScale.ticks(6) as tick, index}
        <g transform={`translate(0, ${yScale(tick)})`} class="text-gray-500">
          <line x1="0" x2={chartWidth} y1="0" y2="0" stroke-width="1" class="stroke-current opacity-30" />
          <text class="text-xs fill-current bg-white" x="2" y="-3">{prettifyTick(tick)} <tspan dx=2>{index == yScale.ticks(6).length - 1 ? unit : ""}</tspan></text>
        </g>
        {/each}
      </g>
      <g class="chart-areas-and-lines" style="transform: translate({margin.left}px,{margin.top}px">
        
        {#if showAreas}
        <g style="" class="chart-areas">
          {#each [...areas].reverse() as area, i}
          <g id="area-{[...shownKeys].reverse()[i]}">
            <linearGradient id="grad-{i + [...shownKeys].reverse()[i]}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:{[...shownColors].reverse()[i]};stop-opacity:1" />
              <stop offset="100%" style="stop-color:{[...shownColors].reverse()[i]};stop-opacity:0.6" />
            </linearGradient>
            <path
              d={area}
              fill="url(#grad-{i + [...shownKeys].reverse()[i]}"
              class="chart-area"
            />
          </g>
          {/each}
        </g>
        {/if}
  
        <g class="chart-lines">
          {#each lines as line, i}
          <g id="line-{shownKeys[i]}">
          <path
          d={line}
          fill="none"
          stroke-width={lineWidth}
          stroke={shownColors[i]}
          >
          </path>
        </g>
          {/each}
        </g>
  
        {#if showDots}
        <g>
          {#each data as datapoint}
            {#each keys as key, i}
            <circle cx="{xScale(datapoint.x) || 0}" cy="{yScale(datapoint[key]) || 0}" r={circleRadius} fill="{shownColors[i]}"></circle>
            {/each}
          {/each}
        </g>
        {/if}
        <rect 
        fill="transparent"
        width={innerChartWidth} 
        height={innerChartHeight}
        on:mousemove={handleMouseMove}
        on:mouseleave={handleMouseLeave}
        ></rect>
      </g>
  
      <g class="chart-x-axis" transform={`translate(${margin.left}, ${margin.top + innerChartHeight})`}>
        {#each data.filter((d) => (max(data, (d) => d.x) - d.x) % xTicksInterval == 0 ) as d, i}
            <g transform={`translate(${xScale(d.x)}, 0)`} class="text-xs text-gray-500">
              <text dy={15} text-anchor="middle" fill="currentColor">
                {d.label}
              </text>
              <g class="text-gray-500">
              <line y1={0} y2={4} stroke="currentColor" />
              </g>
            </g
            >
          {/each}
        </g>
  
        <g class="chart-selected-index text-gray-600 dark:text-gray-400 selection-indicator" transform={`translate(${margin.left + xScale(selectedIndex)},${margin.top})`}>
          <line x1=0 x2=0 y1=0 y2={innerChartHeight} stroke="currentColor" stroke-opacity="0.7"></line>
          <g class="text-xs" transform={`translate(0, ${innerChartHeight + circleRadius})`}>
          <rect class="text-white dark:text-gray-800 fill-current" width="40" x="-20" height={margin.bottom}></rect>
          <text fill="currentColor" text-anchor="middle" y=10>{data[selectedIndex].label}</text>
          </g>
        </g>
        {/if}
      </svg>
  
    {#if showLegend}
      <div class="absolute top-0 left-4 flex flex-wrap gap-2 px-4 md:px-0" bind:clientHeight={legendHeight}>
      {#each keys as key, i}
      <div class="font-semibold tracking-wide px-3 py-1 text-white text-xs rounded-full" style="background-color:{colors[i]}">
        <span class="uppercase">{labels[i]}</span>
        <span class="">{formatNumber(data[selectedIndex][key])}</span>
        {#if unit.length < 8}
        <span class="text-xs transform -translate-x-0.5 inline-block">{unit}</span>
        {/if}
      </div>
      {/each}
      {#if showTotal}
      <div class="font-semibold tracking-wide px-3 py-1 text-white text-xs rounded-full bg-gray-500">
        <span class="uppercase">Gesamt</span>
        <span class="">{formatNumber(Math.round(totals[selectedIndex] * 100) / 100)}</span>
        {#if unit.length < 8}
        <span class="text-xs transform -translate-x-0.5 inline-block">{unit}</span>
        {/if}
      </div>
      {/if}
      </div>
    {/if}
  </div>
  