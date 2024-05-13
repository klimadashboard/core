<script>
	import Map from './Map.svelte';
	import Papa from 'papaparse';

	let data = [];

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
					data = results.data;
				}
			}
		}
	);

	const keys = ['pv_area', 'water', 'wind'];
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
