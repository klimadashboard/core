<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	import { scaleLinear } from 'd3-scale';
	import _, { toNumber } from 'lodash';

	export let energyTypes;
	export let energyByBundesland;
	export let selectedBundesland;


	let potentiale_2030 = {
		Kärnten: { wasserkraft: 4472700.4, windkraft: 28067.5, pv: 376485.8 },
		Burgenland: { wasserkraft: 3605.2, windkraft: 3552028.4, pv: 376485.8 },
		Niederösterreich: { wasserkraft: 7468411, windkraft: 5067009.7, pv: 1016531 },
		Oberösterreich: { wasserkraft: 9958764.1, windkraft: 92487.4, pv: 1020865.7 },
		Salzburg: { wasserkraft: 4472700.4, windkraft: 50.6, pv: 376485.8 },
		Steiermark: { wasserkraft: 4472700.4, windkraft: 615476.5, pv: 841770.3 },
		Tirol: { wasserkraft: 6730807.6, windkraft: 31, pv: 349151.5 },
		Vorarlberg: { wasserkraft: 4472700.4, windkraft: 2.2, pv: 376485.8 },
		Wien: { wasserkraft: 4472700.4, windkraft: 28067.5, pv: 376485.8 }
	};

	let chartWidth;
	let chartHeight;

	const margin = { top: 10, right: 10, left: 10, bottom: 10 };
	const margin_bars = { left: 10, right: 10 };


	function getValuesOfLastYear(bundesland) {
		const bundesland_energy = energyByBundesland[bundesland];
		return bundesland_energy[bundesland_energy.length - 1];
	}
	

	$: selectedBundesland = Object.keys(energyByBundesland)[0];

	$: innerChartHeight = chartHeight - margin.top - margin.bottom;

	$: xScale = scaleLinear().range([0, chartWidth]).domain([0, energyTypes.length]);

	$: yScale = scaleLinear().range([innerChartHeight, 0]).domain([0, 1]);

	$: barWidth = chartWidth / energyTypes.length;
</script>

<div class="grid md:grid-cols-3 gap-4 my-4">
	{#each Object.keys(energyByBundesland) as bundesland, index}
		{@const lastYear = getValuesOfLastYear(bundesland)}
		<div class="bg-gray-100 rounded overflow-hidden div-bundesland {selectedBundesland === bundesland ? "selected" : ""}" 
			on:click={() => { selectedBundesland = bundesland }}
			on:keydown={() => { selectedBundesland = bundesland }}>
			<div class="relative w-full h-5" style="padding-left: {margin.left}px;">{bundesland} {lastYear.year}</div>
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
										opacity={0.5}
									/>
									{@const ratio_current_potential = () => {
										let last_year_val = lastYear[type.dataKey];
										if (isNaN(last_year_val)) {
											last_year_val = toNumber(last_year_val.replaceAll(',', ''));
										}
										return last_year_val / potentiale_2030[bundesland][type.dataKey];
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
</div>

<style>
	.div-bundesland{
		border: 5px solid #ffffff00;
		cursor: pointer;
	}
	.selected {
		border-color: #11998e;
	}
</style>