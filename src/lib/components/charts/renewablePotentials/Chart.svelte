<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	import { scaleLinear } from 'd3-scale';
	import _, { toNumber } from 'lodash';

	export let energyTypes;
	export let energyByBundesland;
	export let selectedBundesland;
	export let potentiale_2030;
	export let potentiale_techn;
	export let bundeslaender;

	let chartWidth;
	let chartHeight;

	const margin = { top: 10, right: 10, left: 10, bottom: 10 };

	


	function getValuesOfLastYear(bundesland) {
		const bundesland_energy = energyByBundesland[bundesland];
		return bundesland_energy[bundesland_energy.length - 1];
	}
	
	$: margin_bars = { left: 0.02*chartWidth, right: 0.02*chartWidth };

	$: selectedBundesland = Object.keys(energyByBundesland)[0];

	$: innerChartHeight = chartHeight - margin.top - margin.bottom;

	$: xScale = scaleLinear().range([0, chartWidth]).domain([0, energyTypes.length]);

	$: yScale = scaleLinear().range([innerChartHeight, 0]).domain([0, 1]);

	$: barWidth = chartWidth / energyTypes.length;
</script>

{#each Object.keys(energyByBundesland) as bundesland, index}
	{@const lastYear = getValuesOfLastYear(bundesland)}
	<div class="bg-gray-100 rounded overflow-hidden div-bundesland {selectedBundesland === bundesland ? "selected" : ""}" 
		on:click={() => { selectedBundesland = bundesland }}
		on:keydown={() => { selectedBundesland = bundesland }}>
		{#if chartWidth < 100}
			<div class="relative w-full h-5" style="padding-left: {margin_bars.left}px;">{bundeslaender[bundesland]} {lastYear.year}</div>
		{:else}
			<div class="relative w-full h-5" style="padding-left: {margin_bars.left}px;">{bundesland} {lastYear.year}</div>
		{/if}
		
		<div
			class="relative w-full h-32"
			bind:clientWidth={chartWidth}
			bind:clientHeight={chartHeight}
		>
			{#if chartWidth && chartHeight}
				<svg width={'100%'} height={'100%'}>
					<g transform="translate(0,{margin.top})">
						{#each energyTypes.filter((d) => d.regions.indexOf(PUBLIC_VERSION) > -1) as type, index}
							{#if Object.keys(lastYear).includes(type.dataKey)}
								<rect
									x={xScale(index) + margin_bars.left}
									y={yScale(1)}
									width={barWidth - (margin_bars.left + margin_bars.right)}
									height={yScale(0) - yScale(1)}
									fill={type.color}
									opacity={0.3}
								/>
								<rect
									x={xScale(index) + margin_bars.left}
									y={yScale(potentiale_2030[bundesland][type.dataKey]/potentiale_techn[bundesland][type.dataKey])}
									width={barWidth - (margin_bars.left + margin_bars.right)}
									height={yScale(0) - yScale(potentiale_2030[bundesland][type.dataKey]/potentiale_techn[bundesland][type.dataKey])}
									fill={type.color}
									opacity={0.3}
								/>
								{@const ratio_current_potential = () => {
									let last_year_val = lastYear[type.dataKey];
									if (isNaN(last_year_val)) {
										last_year_val = toNumber(last_year_val.replaceAll(',', ''));
									}
									return last_year_val / potentiale_techn[bundesland][type.dataKey];
								}}
								<rect
									x={xScale(index) + margin_bars.left}
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

<style>
	.div-bundesland{
		border: 5px solid #ffffff00;
		cursor: pointer;
	}
	.selected {
		border-color: #11998e;
	}
</style>