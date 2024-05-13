<script>
	import Map from './Map.svelte';
	import Papa from 'papaparse';
	import _ from 'lodash';

	let data;

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

	const keys = ['pv', 'wasserkraft', 'windkraft'];
	const colorRanges = [
		['#F6E5B4', '#E0A906'],
		['#B5CBE1', '#08519C'],
		['#C9DDE8', '#4C8EB3']
	];
</script>

<h3>Potentiale der Bundesländer im Vergleich</h3>
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
