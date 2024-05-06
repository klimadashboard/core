<script>
	import Chart from './Chart.svelte';
	import Papa from 'papaparse';
	import _ from 'lodash';
	import Details from './Details.svelte';
	import { onMount } from 'svelte';
	import Switch from '$lib/components/Switch.svelte';


	const energyTypes = [
		{
			key: 'Wind',
			label: 'Windenergie',
			dataKey: 'windkraft',
			color: '#4C8EB3',
			colorScale: ['#4C8EB3', '#B8D2E0'],
			regions: ['at', 'de'],
			icon: "<svg width='17' height='20' viewBox='0 0 17 20' fill='none' xmlns='http://www.w3.org/2000/svg' class='w-8 h-8'><path d='M7 10C7 12.76 9.01 13 11.5 13C13.99 13 16 12.76 16 10H7Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M6.5 10.0475C8.89023 8.6675 8.245 6.6564 7 4.5C5.755 2.3436 4.39023 0.873272 2 2.25327L6.5 10.0475Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7.67072 10.2533C5.28049 8.87327 3.745 10.3436 2.5 12.5C1.255 14.6564 0.780485 16.6675 3.17072 18.0475L7.67072 10.2533Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'PV',
			label: 'Photovoltaik',
			dataKey: 'pv',
			color: '#E0A906',
			colorScale: ['#E0A906', '#E8CD7D'],
			regions: ['at', 'de'],
			icon: "<svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8 icon icon-tabler icon-tabler-sun' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><circle cx='12' cy='12' r='4'></circle><path d='M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7'></path></svg>"
		},
		{
			key: 'Wasserkraft',
			label: 'Wasserkraft',
			dataKey: 'wasserkraft',
			color: '#08519C',
			colorScale: ['#08519C', '#7098C2'],
			regions: ['at'],
			icon: "<svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8 icon icon-tabler icon-tabler-ripple' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M3 7c3 -2 6 -2 9 0s6 2 9 0'></path><path d='M3 17c3 -2 6 -2 9 0s6 2 9 0'></path><path d='M3 12c3 -2 6 -2 9 0s6 2 9 0'></path></svg>"
		},
		// {
		// 	key: 'Biomasse',
		// 	label: 'Biomasse',
		// 	dataKey: 'biomasse',
		// 	color: '#00441B',
		// 	colorScale: ['#00441B', '#66997A'],
		// 	regions: ['at'],
		// 	icon: "<svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8 icon icon-tabler icon-tabler-growth' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'></path><path d='M16.5 15a4.5 4.5 0 0 0 -4.5 4.5m4.5 -8.5a4.5 4.5 0 0 0 -4.5 4.5m4.5 -8.5a4.5 4.5 0 0 0 -4.5 4.5m-4 3.5c2.21 0 4 2.015 4 4.5m-4 -8.5c2.21 0 4 2.015 4 4.5m-4 -8.5c2.21 0 4 2.015 4 4.5m0 -7.5v6'></path></svg>"
		// }
	];

	
	let bundeslaender = {
		Kärnten: 'KTN',
		Burgenland: 'BU',
		Niederösterreich: 'NÖ',
		Oberösterreich: 'OÖ',
		Salzburg: 'SBG',
		Steiermark: 'STMK',
		Tirol: 'T',
		Vorarlberg: 'VBG',
		Wien: 'W'
	}

	// TODO: remove the dummy values
	const dummy_values = {
		Kärnten: { wasserkraft: 6.4727, windkraft: 0.028067, pv: 0.376485 },
		Burgenland: { wasserkraft: 5605.2, windkraft: 3.552028, pv: 0.376485 },
		Niederösterreich: { wasserkraft: 8.468411, windkraft: 5.067009, pv: 1.016531 },
		Oberösterreich: { wasserkraft: 10.958764, windkraft: 0.092487, pv: 1.020865 },
		Salzburg: { wasserkraft: 5.472700, windkraft: 0.50, pv: 0.376485 },
		Steiermark: { wasserkraft: 5.4727, windkraft: 0.615476, pv: 0.841770 },
		Tirol: { wasserkraft: 76.730807, windkraft: 0.31, pv: 0.349151 },
		Vorarlberg: { wasserkraft: 5.472700, windkraft: 0.2, pv: 0.376485 },
		Wien: { wasserkraft: 5.472700, windkraft: 0.028067, pv: 0.376485 }
	}

	let potentiale_2030;
	let potentiale_techn;

	
	let dataset;
	let energyByBundesland;
	let minYear;
	let maxYear;
	let selectedBundesland = "Kärnten";

	let goals;
	let showTechn = false;

	// onMount(() => {
		// https://docs.google.com/spreadsheets/d/16kr90lRgPOteSYTa7hp5gOGA_49WdOqWSwSQty4uSZs/edit?usp=drive_link
		// Potentiale
		Papa.parse(
			// '/data_temp/EE-Potentiale.csv',
			'https://docs.google.com/spreadsheets/u/8/d/16kr90lRgPOteSYTa7hp5gOGA_49WdOqWSwSQty4uSZs/export?format=csv&id=16kr90lRgPOteSYTa7hp5gOGA_49WdOqWSwSQty4uSZs&gid=0',
			{
				download: true,
				dynamicTyping: true,
				skipEmptyLines: true,
				header: true,
				complete: function (results) {
					// TODO: load potentiale data
					if (results) {
						let potentiale_techn_temp = {}
						let potentiale_2030_temp = {}
						Object.keys(bundeslaender).forEach((bundesland) => {
							potentiale_techn_temp[bundesland] = {};
							potentiale_2030_temp[bundesland] = {};

							const water = +results.data.find((row) => row.region === bundesland && row.energy === "water" && row.potential_class == "technical").value_TWh;
							if(water>0) {
								potentiale_techn_temp[bundesland]["wasserkraft"] = water;
							}
							else{
								potentiale_techn_temp[bundesland]["wasserkraft"] = dummy_values[bundesland]["wasserkraft"];
							}
							const wind = +results.data.find((row) => row.region === bundesland && row.energy === "wind" && row.potential_class == "technical").value_TWh;
							if(wind>0) {
								potentiale_techn_temp[bundesland]["windkraft"] = wind;
							}
							else{
								potentiale_techn_temp[bundesland]["windkraft"] = dummy_values[bundesland]["windkraft"];
							}
							const pv = +results.data.find((row) => row.region === bundesland && row.energy === "pv_area" && row.potential_class == "technical").value_TWh +results.data.find((row) => row.region === bundesland && row.energy === "pv_roof" && row.potential_class == "technical").value_TWh;
							if(pv>0){
								potentiale_techn_temp[bundesland]["pv"] = pv;
							}
							else{
								potentiale_techn_temp[bundesland]["pv"] = dummy_values[bundesland]["pv"];
							}
							
							const water_2030 = +results.data.find((row) => row.region === bundesland && row.energy === "water" && row.potential_class == "until_2030").value_TWh;
							if(water_2030>0) {
								potentiale_2030_temp[bundesland]["wasserkraft"] = water_2030;
							}
							else{
								potentiale_2030_temp[bundesland]["wasserkraft"] = dummy_values[bundesland]["wasserkraft"];
							}
							const wind_2030 = +results.data.find((row) => row.region === bundesland && row.energy === "wind" && row.potential_class == "until_2030").value_TWh;
							if(wind_2030>0) {
								potentiale_2030_temp[bundesland]["windkraft"] = wind_2030;
							}
							else{
								potentiale_2030_temp[bundesland]["windkraft"] = dummy_values[bundesland]["windkraft"];
							}
							const pv_2030 = +results.data.find((row) => row.region === bundesland && row.energy === "pv_area" && row.potential_class == "until_2030").value_TWh +results.data.find((row) => row.region === bundesland && row.energy === "pv_roof" && row.potential_class == "until_2030").value_TWh;
							if(pv_2030>0){
								potentiale_2030_temp[bundesland]["pv"] = pv_2030;
							}
							else{
								potentiale_2030_temp[bundesland]["pv"] = dummy_values[bundesland]["pv"];
							}
						});
						potentiale_2030 = potentiale_2030_temp;
						potentiale_techn = potentiale_techn_temp;
					}
				}
			}
		);
		
		// https://docs.google.com/spreadsheets/d/1dK_GAqMHt6treYwaQjjPj_Bn5fFLUBHZ/edit#gid=271008028
		// Energieerzeugung
		Papa.parse(
			// '/data_temp/pvWindWasser_alleBundeslaender_ab1988.csv',
			'https://docs.google.com/spreadsheets/u/8/d/1dK_GAqMHt6treYwaQjjPj_Bn5fFLUBHZ/export?format=csv&id=1dK_GAqMHt6treYwaQjjPj_Bn5fFLUBHZ&gid=271008028',
			{
				download: true,
				dynamicTyping: true,
				skipEmptyLines: true,
				header: true,
				complete: function (results) {
					if (results) {
						dataset = results.data;
						const years = dataset?.map((row) => row.year)
						minYear = Math.min(...years);
						maxYear = Math.max(...years);
						
						energyByBundesland = _.groupBy(dataset, (row) => row.region);
						Object.keys(energyByBundesland).forEach((bundesland) => {
							energyByBundesland[bundesland] = energyByBundesland[bundesland].sort((a, b) => {
								return a.year - b.year;
							});
						});
					}
				}
			}
		);
		
		// https://docs.google.com/spreadsheets/d/1PxvyOSjPAl_5UikGPQpqqMyDPxF1GRpV8gb4mUfG9TQ/edit#gid=1951802472
		// Ziele
		Papa.parse(
			'https://docs.google.com/spreadsheets/u/8/d/1PxvyOSjPAl_5UikGPQpqqMyDPxF1GRpV8gb4mUfG9TQ/export?format=csv&id=1PxvyOSjPAl_5UikGPQpqqMyDPxF1GRpV8gb4mUfG9TQ&gid=1951802472',
			{
				download: true,
				dynamicTyping: true,
				skipEmptyLines: true,
				header: true,
				complete: function (results) {
					if (results) {
						goals = results.data;
					}
				}
			}
		);
	// });


	$: views = [
		{
			key: 'overview',
			label: 'Übersicht',
			icon: null,
			color: '#4DB263'
		},
		{
			key: 'details',
			label: 'Details',
			icon: null,
			color: '#4DB263'
		}
	];
	
	$: activeView = 'overview';

	$: selectedStartYear = minYear;
	
</script>

<Switch
	{views}
	{activeView}
	on:itemClick={(event) => {
		activeView = event.detail;
	}}
/>
<label
	class="flex gap-1 text-sm items-center cursor-pointer {showTechn
		? 'text-gray-700'
		: 'text-gray-400'}"
	style=""
>
	<span>Technisch mögliche Potentiale</span>
	<input type="checkbox" bind:checked={showTechn} />
</label>

<div id="renewablePotentialsDiv" class="grid gap-4 my-4">
	{#if energyTypes && potentiale_2030 && energyByBundesland && selectedBundesland && dataset}
		{#if activeView==="overview"}
			<div class="grid grid-cols-3 gap-3 my-3">
				<Chart {energyTypes} {energyByBundesland} {potentiale_2030} {bundeslaender} {potentiale_techn} {showTechn} do_select={false} />
			</div>
		{/if}
		{#if activeView==="details"}
			<div class="grid grid-cols-9 gap-2 my-2">
				<Chart {energyTypes} {energyByBundesland} {potentiale_2030} {bundeslaender} {potentiale_techn} {showTechn} bind:selectedBundesland={selectedBundesland} />
			</div>
			<div class="grid gap-4 p-2">
				{#each energyTypes as type}
					<Details {type} {selectedStartYear}  {showTechn}
						potential_techn={potentiale_techn[selectedBundesland][type.dataKey]}
						potential_2030={potentiale_2030[selectedBundesland][type.dataKey]}
						goals={goals.filter((row) => row.state_name === selectedBundesland && row.energy_data_key === type.dataKey)}
						dataset={energyByBundesland[selectedBundesland]?.map((row) => {
							return {
								year: row.year,
								value: row[type.dataKey]
							};
						}).filter((row) => !isNaN(row.value) && row.value != null)} />
				{/each}
			</div>
			<div id="settings" class="flex items-center gap-2 text-sm mt-2 md:mt-0">
				<span>Startjahr auswählen</span>
				<input
					type="number"
					min={minYear}
					max={maxYear}
					bind:value={selectedStartYear}
					class="px-3 py-1 w-20 bg-gray-100 rounded-full"
				/>
			</div>
		{/if}
	{/if}
</div>


<style>
	
	@media screen and (min-width: 1024px) {
		#renewablePotentialsDiv{
			/* grid-template-areas: 'overview overview overview overview details details details'; */
			/*grid-template-columns: 60% 40%;*/
			padding-left: 10%;
			padding-right: 10%;
		}
	}
</style>