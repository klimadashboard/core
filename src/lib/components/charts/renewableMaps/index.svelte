<script>
	import Map from './Map.svelte';
	import Papa from 'papaparse';
	import _ from 'lodash';

	let data;
	let potentiale_2030;
	let potentiale_techn;

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
	};

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
					const dataset = results.data;
					const energyByBundesland = _.groupBy(dataset, (row) => row.region);
					Object.keys(energyByBundesland).forEach((bundesland) => {
						const sorted = energyByBundesland[bundesland].sort((a, b) => {
							return a.year - b.year;
						});
						energyByBundesland[bundesland] = sorted[sorted.length - 1];
					});
					data = energyByBundesland;
				}
			}
		}
	);
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
				if (results) {
					let potentiale_techn_temp = {};
					let potentiale_2030_temp = {};
					Object.keys(bundeslaender).forEach((bundesland) => {
						potentiale_techn_temp[bundesland] = {};
						potentiale_2030_temp[bundesland] = {};

						const water = +results.data.find(
							(row) =>
								row.region === bundesland &&
								row.energy === 'water' &&
								row.potential_class == 'technical'
						).value_TWh;
						potentiale_techn_temp[bundesland]['wasserkraft'] = water;
						const wind = +results.data.find(
							(row) =>
								row.region === bundesland &&
								row.energy === 'wind' &&
								row.potential_class == 'technical'
						).value_TWh;
						potentiale_techn_temp[bundesland]['windkraft'] = wind;
						const pv =
							+results.data.find(
								(row) =>
									row.region === bundesland &&
									row.energy === 'pv_area' &&
									row.potential_class == 'technical'
							).value_TWh +
							results.data.find(
								(row) =>
									row.region === bundesland &&
									row.energy === 'pv_roof' &&
									row.potential_class == 'technical'
							).value_TWh;
						potentiale_techn_temp[bundesland]['pv'] = pv;

						const water_2030 = +results.data.find(
							(row) =>
								row.region === bundesland &&
								row.energy === 'water' &&
								row.potential_class == 'until_2030'
						).value_TWh;
						potentiale_2030_temp[bundesland]['wasserkraft'] = water_2030;
						const wind_2030 = +results.data.find(
							(row) =>
								row.region === bundesland &&
								row.energy === 'wind' &&
								row.potential_class == 'until_2030'
						).value_TWh;
						potentiale_2030_temp[bundesland]['windkraft'] = wind_2030;
						const pv_2030 =
							+results.data.find(
								(row) =>
									row.region === bundesland &&
									row.energy === 'pv_area' &&
									row.potential_class == 'until_2030'
							).value_TWh +
							results.data.find(
								(row) =>
									row.region === bundesland &&
									row.energy === 'pv_roof' &&
									row.potential_class == 'until_2030'
							).value_TWh;
						potentiale_2030_temp[bundesland]['pv'] = pv_2030;
					});
					potentiale_2030 = potentiale_2030_temp;
					potentiale_techn = potentiale_techn_temp;
				}
			}
		}
	);

	const keys = ['pv', 'wasserkraft', 'windkraft'];
	const colorRanges = [
		['#F6E5B4', '#E0A906'],
		['#B5CBE1', '#08519C'],
		['#C9DDE8', '#4C8EB3']
	];
</script>

<h3>Ist-Erzeugung der Bundesländer im Vergleich</h3>
<div class="grid md:grid-cols-3 gap-4">
	{#if data}
		{#each keys as key, i}
			<div>
				<p>{key}</p>
				<Map {data} {key} colorRange={colorRanges[i]} />
			</div>
		{/each}
	{/if}
</div>

<h3>Potentiale der Bundesländer im Vergleich</h3>
<div class="grid md:grid-cols-3 gap-4">
	{#if potentiale_2030}
		{#each keys as key, i}
			<div>
				<p>{key}</p>
				<Map data={potentiale_2030} {key} colorRange={colorRanges[i]} />
			</div>
		{/each}
	{/if}
</div>
