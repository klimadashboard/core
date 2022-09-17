<script>
    import Papa from "papaparse";
    import { min, max, extent, bisector } from 'd3-array';
    import { scaleLinear, scaleTime } from 'd3-scale';
    import { area, line } from 'd3-shape';
    import dayjs from "dayjs";
    import formatNumber from "$lib/stores/formatNumber";
    import { glossaryItem } from "$lib/stores/glossary";

    export let v;
    console.log(v);

    $: dataset = [];

    Papa.parse("https://data.klimadashboard.org/global/emissions/co2_mlo_weekly.csv", {
      download: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      header: true,
      complete: function (results) {
        if (results) {
          dataset = results.data.filter(d => {
              return d.day !== null;
          });
        }
      },
    });

    $: CO2Concentration = dataset.length > 0 ? dataset.slice(-1)[0].day : 0;
    $: CO2ConcentrationPreIndustrial = 280;
    $: CO2Concentration15 = 430;
    $: globalWarming = 1.1;

    let chartHeight;
    let chartWidth;

    const margin = { top: 10, right: 5, bottom: 10, left: 15};

    $: innerChartHeight = chartHeight - margin.top - margin.bottom;
    $: innerChartWidth = chartWidth - margin.right - margin.left;

    const rawDataHistorical = [{
        year: 1850,
        concentration: 285.5
    }, {
        year: 1860,
        concentration: 286.8
    }, {
        year: 1870,
        concentration: 288.4
    }, {
        year: 1880,
        concentration: 290.4
    }, {
        year: 1890,
        concentration: 293.3
    }, {
        year: 1900,
        concentration: 296.4
    }, {
        year: 1910,
        concentration: 300.0
    }, {
        year: 1920,
        concentration: 304.8
    }, {
        year: 1940,
        concentration: 311.7
    }, {
        year: 1950,
        concentration: 313.1
    }, {
        year: 1960,
        concentration: 316.8
    }, {
        year: 1970,
        concentration: 324.9
    }, {
        year: 1980,
        concentration: 338.8
    }, {
        year: 1991,
        concentration: 354.0
    }, {
        year: 2000,
        concentration: 368.8
    }, {
        year: 2005,
        concentration: 378.8
    }, {
        year: 2010,
        concentration: 388.6
    }, {
        year: 2015,
        concentration: 399.4
    }];

    const rawDataFuture = [{
        year: 2030,
        concentration: 434
    }, {
        year: 2040,
        concentration: 440
    }, {
        year: 2050,
        concentration: 438
    }, {
        year: 2060,
        concentration: 431
    }, {
        year: 2070,
        concentration: 424
    }, {
        year: 2080,
        concentration: 415
    }, {
        year: 2090,
        concentration: 405
    }, {
        year: 2100,
        concentration: 394
    }, {
        year: 2200,
        concentration: 343
    }];

    const rawDataProjection = [{
        year: 2040,
        concentration: 475
    }, {
        year: 2050,
        concentration: 507
    }, {
        year: 2060,
        concentration: 537
    }, {
        year: 2070,
        concentration: 564
    }, {
        year: 2080,
        concentration: 585
    }, {
        year: 2090,
        concentration: 598
    }, {
        year: 2100,
        concentration: 603
    }];

    $: dataToday = [{
        year: 2022,
        concentration: 421
    }];

    $: dataFuture = dataToday.concat(rawDataFuture);
    $: dataHistorical = rawDataHistorical.concat(dataToday);
    $: dataProjection = dataToday.concat(rawDataProjection);

    $: data = dataHistorical.concat(dataFuture);

    $: xScale = scaleLinear()
    .range([0, innerChartWidth])
    .domain([min(data, (d) => d.year), max(data, (d) => d.year)]);

    $: yScale = scaleLinear()
    .range([innerChartHeight, 0])
    .domain([min(data, (d) => d.concentration) - 40, max(data, (d) => d.concentration) + 100]);

    $: generateArea = () => {
    return area()
      .x(d => xScale(d.year))
      .y0(innerChartHeight)
      .y1(function (d) {
        return yScale(d.concentration);
      });
    };

    $: generateLine = () => {
    return line()
      .x(d => xScale(d.year))
      .y(function (d) {
        return yScale(d.concentration);
      });
    };

    $: marks = [{
        x: dataHistorical[0].year,
        y: dataHistorical[0].concentration,
        label: dataHistorical[0].year
    }, {
        x: dataHistorical[dataHistorical.length - 1].year,
        y: dataHistorical[dataHistorical.length - 1].concentration,
        label: dataHistorical[dataHistorical.length - 1].year
    }, {
        x: dataFuture.find(d => d.year == 2040).year,
        y: dataFuture.find(d => d.year == 2040).concentration,
        label: dataFuture.find(d => d.year == 2040).year + " <tspan class='font-light'>" + v.markerFuture + "</tspan>"
    }, {
        x: dataProjection.find(d => d.year == 2050).year,
        y: dataProjection.find(d => d.year == 2050).concentration,
        label: dataProjection.find(d => d.year == 2050).year + " <tspan class='font-light'>" + v.markerProjection + "</tspan>"
    }]

    $: selectedMark = marks[1];
</script>

<div class="w-screen bg-gradient-green dark:bg-opacity-50 text-white py-8 overflow-hidden">
    <div class="container">
        <h2 class="text-3xl tracking-tight mb-6 md:mb-4 max-w-2xl text-white">{v.heading}</h2>
        <div class="grid md:grid-cols-3 gap-8">
        <div class="col-span-2 relative w-full max-w-2xl h-60 sm:h-56">
            <div class="chart h-full w-full absolute inset-0" bind:clientHeight={chartHeight} bind:clientWidth={chartWidth}>
                {#if chartWidth && chartHeight}
                <svg width={"100%"} height={"100%"} class="text-white text-sm">
                    <g transform="translate({margin.left},{margin.top})">
                    
                    <linearGradient id="grad-area" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#fff;stop-opacity:0.55" />
                      <stop offset="100%" style="stop-color:#fff;stop-opacity:0" />
                    </linearGradient>

                    <linearGradient id="grad-projection" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#fff;stop-opacity:0" />
                      <stop offset="20%" style="stop-color:#fff;stop-opacity:0" />
                      <stop offset="100%" style="stop-color:#fff;stop-opacity:0.55" />
                    </linearGradient>
                    
                    <path
                    d={generateArea()(dataHistorical)}
                    fill="url(#grad-area)"
                    />

                    <path
                    d={generateLine()(dataHistorical)}
                    fill="none"
                    stroke="#fff"
                    stroke-width="2"
                    />

                    <path
                    d={generateLine()(dataProjection)}
                    fill="none"
                    stroke="url(#grad-projection)"
                    stroke-width="2"
                    />

                    <path
                    d={generateLine()(dataFuture)}
                    stroke-dasharray="5,10"
                    stroke-linecap="round"
                    fill="none"
                    stroke="url(#grad-area)"
                    stroke-width="2"
                    />
                    </g>
                    <g transform="translate({margin.left},{margin.top})">
                        {#each marks as mark}
                        <g transform="translate({xScale(mark.x)},{yScale(mark.y)})" 
                        on:mouseover={() => selectedMark = mark}
                        on:focus={() => selectedMark = mark}
                        >
                        <circle r=5 fill="#fff"></circle>
                        {#if selectedMark == mark}
                        <circle r=5 fill="#fff">
                        <animate attributeName="r" from="5" to="10" dur="1.5s" begin="0s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" from="1" to="0.5" dur="1.5s" begin="0s" repeatCount="indefinite"/>
                        </circle>
                        {/if}
                        
                        <g class="fill-current font-semibold text-xs {selectedMark == mark ? "" : "opacity-70"}">
                        {#if xScale(mark.x) < 100}
                        <text y="-10" transform="" text-anchor="middle">{mark.label}
                            <!--
                            <tspan dx="2" class="font-light">{mark.y} ppm</tspan>
                            -->
                        </text>
                        {:else if mark.x == 2040}
                        <text text-anchor="start" x="10" y="-4">{@html mark.label} 
                            <!--
                            <tspan dx="2" class="font-light">{mark.y} ppm</tspan>
                            -->
                        </text>
                        {:else}
                        <text text-anchor="end" x="-12" y="4">{@html mark.label} 
                            <!--
                            <tspan dx="2" class="font-light">{mark.y} ppm</tspan>
                            -->
                        </text>
                        {/if}
                        </g>
                        </g>
                        {/each}
                    </g>
                </svg>
                {/if}
            </div>
            <div class="absolute" style="left: {xScale(dataHistorical[dataHistorical.length - 1].year) + margin.left * 2}px; bottom: {margin.bottom - 5}px">
            <div class="flex items-end space-x-2">
            <p class="text-6xl font-extralight">{formatNumber(selectedMark.y)}</p>
            <p class="{[4,7,9].includes(+selectedMark.y.toString().slice(-1)) ? "-translate-x-4" : "-translate-x-2"}">PPM</p>
            </div>
            <div class="flex items-center space-x-1 -mt-1">
                <p class="font-semibold">{v.CO2ConcentrationLabel}</p>
                <button on:mousedown={() => glossaryItem.set("co2-konzentration")} aria-label="Info">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 icon icon-tabler icon-tabler-info-circle" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <circle cx="12" cy="12" r="9"></circle>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        <polyline points="11 12 12 12 12 16 13 16"></polyline>
                     </svg>
                </button>
            </div>
            <p class="text-sm leading-tight">
            {#if selectedMark.x == 2040}
            {v.labelSmallFuture.replace("{year}",selectedMark.x)}
            {:else if selectedMark.x == 2050}
            <span class="text-xs">
            {v.labelSmallProjection.replace("{year}",selectedMark.x)}
            </span>
            {:else}
            {v.labelSmallPast.replace("{year}",selectedMark.x)}
            {/if}
            
            </p>
        </div>
        </div>

        <div class="flex space-x-4 items-end pl-14 md:pl-0">
            <div class="w-6 h-full relative rounded-t-full border-b-2 text-xs" style="font-variant-numeric: tabular-nums; background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.3) 100%)">
                <div class="absolute right-0 flex items-center space-x-2" style="bottom: 51%">
                    <span>+1,1°C</span>
                    <div class="w-6 h-0.5 bg-white"></div>
                </div>
                <div class="absolute right-0 flex items-center space-x-2 opacity-50" style="bottom: 70%">
                    <span>+1,5°C</span>
                    <div class="w-6 h-0.5 bg-white"></div>
                </div>
            </div>
            <div>
            <p class="text-6xl font-extralight mb-2">+{formatNumber(globalWarming)}°C</p>
            <div class="flex items-center space-x-1">
            <p class="font-semibold">{v.globalWarmingLabel}</p>
            <button on:mousedown={() => glossaryItem.set("globale-erhitzung")} aria-label="Info">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 icon icon-tabler icon-tabler-info-circle" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <circle cx="12" cy="12" r="9"></circle>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    <polyline points="11 12 12 12 12 16 13 16"></polyline>
                 </svg>
            </button>
            </div>
            <p class="text-sm max-w-xs">{v.globalWarmingLabelSmall}</p>
            </div>
        </div>
    </div>
    <p class="mt-4 opacity-50 text-sm pl-3">Source: {v.source}</p>
</div>
</div>

<style>

.pulse {
    transform-origin: center center;
    transform: scale(1);
    animation: pulse 2s infinite;
}

@keyframes pulse {
	0% {
		transform: scale(0.95);
		box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
	}

	70% {
		transform: scale(1);
		box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
	}

	100% {
		transform: scale(0.95);
		box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
	}
}
</style>