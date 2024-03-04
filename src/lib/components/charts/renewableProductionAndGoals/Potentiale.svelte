<script>
    import { PUBLIC_VERSION } from '$env/static/public';
	import Papa from 'papaparse';
    import _, { includes, toInteger, toNumber } from "lodash";
    import { scaleLinear } from 'd3-scale';

    export let energyTypes;

    let dataset;
    let potentiale_2030 = {
        Kärnten: {wasserkraft: 4472700.4, windkraft: 28067.5, pv: 376485.8},
        Burgenland: {wasserkraft: 3605.2, windkraft: 3552028.4, pv: 376485.8},
        Niederösterreich: {wasserkraft: 7468411, windkraft: 5067009.7, pv: 1016531},
        Oberösterreich: {wasserkraft: 9958764.1, windkraft: 92487.4, pv: 1020865.7},
        Salzburg: {wasserkraft: 4472700.4, windkraft: 50.6, pv: 376485.8},
        Steiermark: {wasserkraft: 4472700.4, windkraft: 615476.5, pv: 841770.3},
        Tirol: {wasserkraft: 6730807.6, windkraft: 31, pv: 349151.5},
        Vorarlberg: {wasserkraft: 4472700.4, windkraft: 2.2, pv: 376485.8},
        Wien: {wasserkraft: 4472700.4, windkraft: 28067.5, pv: 376485.8},
    };
    
	let chartWidth;
	let chartHeight;

	const margin = { top: 20, right: 20, left: 20, bottom: 20 };
    const margin_bars = { left: 10, right: 10};


    // https://docs.google.com/spreadsheets/d/1dK_GAqMHt6treYwaQjjPj_Bn5fFLUBHZ/edit#gid=271008028
	Papa.parse(
		'https://docs.google.com/spreadsheets/u/8/d/1dK_GAqMHt6treYwaQjjPj_Bn5fFLUBHZ/export?format=csv&id=1dK_GAqMHt6treYwaQjjPj_Bn5fFLUBHZ&gid=271008028',
		{
			download: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			header: true,
			complete: function (results) {
				if (results) {
					dataset = results.data;
                    console.log(dataset)
				}
			}
		}
	);

    function getValuesOfLastYear(bundesland){
        const sorted = energyByBundesland[bundesland].sort((row) => row.year);
        return sorted[sorted.length-1];
    }

    $: energyByBundesland = _.groupBy(dataset, row => row.region);
    
	$: innerChartHeight = chartHeight - margin.top - margin.bottom;

    $: xScale = scaleLinear()
        .range([0, chartWidth])
        .domain([0, 3]);

    $: yScale = scaleLinear()
        .range([innerChartHeight, 0])
        .domain([0, 1]);

    $: barWidth = chartWidth / 3 ;

</script>

<div class="grid md:grid-cols-3 gap-4 my-4">
    {#each Object.keys(energyByBundesland) as bundesland, index}
        {@const lastYear = getValuesOfLastYear(bundesland)}
        <div class="bg-gray-100 rounded overflow-hidden">
            <div class="relative w-full h-5">{bundesland} {lastYear.year}</div>
            <div class="relative w-full h-64" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
                {#if chartWidth && chartHeight}
                    <svg width={'100%'} height={'100%'}>
                        <g transform="translate(0,{margin.top})">
                            {#each energyTypes.filter((d) => d.regions.indexOf(PUBLIC_VERSION) > -1) as type, index}
                                {#if Object.keys(lastYear).includes(type.dataKey)}
                                    <rect
                                        x={xScale(index)+margin_bars.left}
                                        y={yScale(1)}
                                        width={barWidth - (margin_bars.left + margin_bars.right)}
                                        height={yScale(0) - yScale(1)}
                                        fill={type.color}
                                        opacity={0.5}
                                    />
                                    {@const ratio_current_potential = () => {
                                        let last_year_val = lastYear[type.dataKey];
                                        if(isNaN(last_year_val)){
                                            last_year_val = toNumber(last_year_val.replaceAll(",", ""))
                                        }
                                        console.log(bundesland, type.dataKey, last_year_val)
                                        return last_year_val / potentiale_2030[bundesland][type.dataKey]
                                    } }
                                    <rect
                                        x={xScale(index)+margin_bars.left}
                                        y={yScale(ratio_current_potential())}
                                        width={barWidth - (margin_bars.left + margin_bars.right)}
                                        height={yScale(0) - yScale(ratio_current_potential())}
                                        fill={type.color}
                                        opacity={1.0}
                                    />
                                    <!-- <div>{type.dataKey}: {lastYear[type.dataKey]}</div> -->
                                {/if}
                            {/each}
                        </g>
                    </svg>
                {/if}
            </div>
        </div>
    {/each}
</div>