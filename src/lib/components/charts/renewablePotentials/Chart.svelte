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
	export let do_select = true;
	export let showTechn;

	let chartWidth;


	
	function getValuesOfLastYear(bundesland) {
		const bundesland_energy = energyByBundesland[bundesland];
		return bundesland_energy[bundesland_energy.length - 1];
	}
	
	$: margin = { top: 0.02*chartHeight, bottom: 0.02*chartHeight };

	$: margin_bars = { left: 0.02*chartWidth, right: 0.02*chartWidth };

	$: innerChartHeight = chartHeight - margin.top - margin.bottom;

	$: xScale = scaleLinear().range([0, chartWidth]).domain([0, energyTypes.length]);

	$: yScale = scaleLinear().range([innerChartHeight, 0]).domain([0, 1]);

	$: barWidth = chartWidth / energyTypes.length;

	$: chartHeight = chartWidth / 1.4;

	$: ratio_data = showTechn ? potentiale_techn : potentiale_2030;

	$: console.log(energyByBundesland);

	// $: hoverX = margin_bars.left;
	// $: hoverY = margin.top;
	let hoverType;
	let hoverBundesland;

</script>

{#each Object.keys(energyByBundesland) as bundesland, index}
	{@const lastYear = getValuesOfLastYear(bundesland)}
	{@const ratio_current_2030 = (ratio_to, dataKey) => {
		let last_year_val = lastYear[dataKey];
		if (isNaN(last_year_val)) {
			last_year_val = toNumber(last_year_val.replaceAll(',', ''));
		}
		return last_year_val / ratio_to[bundesland][dataKey];
	}}
	<div class="rounded overflow-hidden div-bundesland {selectedBundesland === bundesland ? "selected" : ""}" 
		on:click={() => { 
			if(do_select)
				selectedBundesland = bundesland 
		}}
		on:keydown={() => { 
			if(do_select)
				selectedBundesland = bundesland 
		}}>
		
		{#if chartWidth < 150}
			<div class="relative w-full h-6" style="padding-left: {margin_bars.left}px;">{bundeslaender[bundesland]}</div>
		{:else}
			<div class="relative w-full h-6" style="padding-left: {margin_bars.left}px;">{bundesland} {lastYear.year}</div>
		{/if}
		
		
		<div
			class="bg-gray-100 relative w-full"
			style="height: {chartHeight}px;"
			bind:clientWidth={chartWidth}
		>
			{#if chartWidth && chartHeight}
				{#if hoverBundesland === bundesland && chartWidth >= 150}
					<!-- <span style="position: absolute; top: {hoverY}px; left: {hoverX}px">asdf</span> -->
					<div class="absolute h-15 bg-gray-100" style="padding-left: {margin_bars.left}px; padding-right: {margin_bars.right}px; margin-left: {margin_bars.left}px; margin-right: {margin_bars.right}px; opacity:0.6;">
						<b>{hoverType.label}</b>
						<br>
						{#if showTechn}
							{"Techn mögl: " + Math.round(potentiale_techn[hoverBundesland][hoverType.dataKey]*100)/100 + "TWh"}
							<br>
						{/if}
						{"Potential 2030: " + Math.round(potentiale_2030[hoverBundesland][hoverType.dataKey]*100)/100 + "TWh"}
						<br>
						{"Derzeit: " + Math.round(lastYear[hoverType.dataKey]*100)/100 + "TWh (" + Math.round(ratio_current_2030(potentiale_2030, hoverType.dataKey)*1000)/10 + "%)"}
					</div>
				{/if}
				<svg width={'100%'} height={'100%'}
					on:focus={(event) => { 
						hoverBundesland = null;
						hoverType = null;
					}}
					on:mouseover={(event) => { 
						hoverBundesland = null;
						hoverType = null;
					}}>
					<g transform="translate(0,{margin.top})">
						{#each energyTypes.filter((d) => d.regions.indexOf(PUBLIC_VERSION) > -1) as type, index}
							{#if Object.keys(lastYear).includes(type.dataKey)}
								<!-- <text>{@html type.icon}</text> TODO: show icon somewhere -->
								{@const total = 1}
								<rect
									x={xScale(index) + margin_bars.left}
									y={yScale(total)}
									width={barWidth - (margin_bars.left + margin_bars.right)}
									height={yScale(0) - yScale(1)}
									fill={type.color}
									opacity={0.3}
									on:focus={(event) => { 
										hoverBundesland = bundesland;
										hoverType = type;
										event.stopPropagation()
									}}
									on:mouseover={(event) => { 
										// const {offsetX, offsetY} = event;
										// hoverX = offsetX;
										// hoverY = offsetY;
										hoverBundesland = bundesland;
										hoverType = type;
										event.stopPropagation()
									}}
								/>

								{@const ratio_techn_2030 = potentiale_2030[bundesland][type.dataKey]/ratio_data[bundesland][type.dataKey]}
								<rect
									x={xScale(index) + margin_bars.left}
									y={yScale(ratio_techn_2030)}
									width={barWidth - (margin_bars.left + margin_bars.right)}
									height={yScale(0) - yScale(ratio_techn_2030)}
									fill={type.color}
									opacity={0.5}
									on:focus={(event) => { 
										hoverBundesland = bundesland;
										hoverType = type;
										event.stopPropagation()
									}}
									on:mouseover={(event) => {
										hoverBundesland = bundesland;
										hoverType = type;
										event.stopPropagation()
									}}
								/>
								<rect
									x={xScale(index) + margin_bars.left}
									y={yScale(ratio_current_2030(ratio_data, type.dataKey))}
									width={barWidth - (margin_bars.left + margin_bars.right)}
									height={yScale(0) - yScale(ratio_current_2030(ratio_data, type.dataKey))}
									fill={type.color}
									opacity={1.0}
									on:focus={(event) => { 
										hoverBundesland = bundesland;
										hoverType = type;
										event.stopPropagation()
									}}
									on:mouseover={(event) => {
										hoverBundesland = bundesland;
										hoverType = type;
										event.stopPropagation()
									}}
								/>
								<!-- <div>{type.dataKey}: {lastYear[type.dataKey]}</div> -->
								
								<!-- hover info -->
								<!-- <g
									transform="translate({xScale(index) + margin_bars.left},{yScale(ratio_techn_2030)})"
									class="text-white text-sm uppercase cursor-help"
								>
									<text x={(barWidth - (margin_bars.left + margin_bars.right))/2} y="-10" fill="currentColor" class="font-thin" dominant-baseline="middle" text-anchor="middle">
										{
											"~" + Math.round(ratio_techn_2030*10000)/100 + "%"
										}
									</text>
								</g>
								<g
									transform="translate({xScale(index) + margin_bars.left},{yScale(ratio_current_2030())})"
									class="text-white text-sm uppercase cursor-help"
								>
									<text x={(barWidth - (margin_bars.left + margin_bars.right))/2} y="-10" fill="currentColor" class="font-thin" dominant-baseline="middle" text-anchor="middle">
										{
											"~" + Math.round(ratio_current_2030()*10000)/100 + "%"
										}
									</text>
								</g> -->
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