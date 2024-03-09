<script>
	import Chart from './Chart.svelte';
	import Papa from 'papaparse';
	import _ from 'lodash';
	import Details from './Details.svelte';


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
	
	let dataset;
	let selectedBundesland = Object.keys(potentiale_2030)[0];
	
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
				}
			}
		}
	);

	$: energyByBundesland = _.groupBy(dataset?.sort((row) => row.year), (row) => row.region);
	$: console.log(potentiale_2030)
	
</script>

<div class="grid md:grid-cols-2 gap-4 my-4">
	<Chart {energyTypes} {energyByBundesland} {potentiale_2030} bind:selectedBundesland={selectedBundesland} />
	{#if energyTypes && potentiale_2030 && energyByBundesland && selectedBundesland}
	<div class="grid">
		{#each energyTypes as type}
			<Details {type}
				potential={potentiale_2030[selectedBundesland][type.dataKey]}
				dataset={energyByBundesland[selectedBundesland]?.map((row) => {
				return {
					year: row.year,
					value: row[type.dataKey]
				};
			}).filter((row) => !isNaN(row.value) && row.value != null)} />
		{/each}
	</div>
	{/if}
</div>
