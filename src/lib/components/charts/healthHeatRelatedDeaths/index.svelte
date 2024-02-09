<script>
	import Papa from 'papaparse';

	let historicalDataset;
	const yearInterval = 30;
	const unit = '°C';

	let heatDeathData = [];

	// $: Papa.parse(
	// 	// `localpath/data/de/health/heat_deaths.csv`,
	// 	`https://data.klimadashboard.org/de/health/heat_deaths.csv`,
	// 	{
	// 		download: true,
	// 		dynamicTyping: true,
	// 		skipEmptyLines: true,
	// 		header: true,
	// 		complete: function (results) {
	// 			if (results) {
	// 				heatDeathData = results.data;
	// 			}
	// 		}
	// 	}
	// );

	$: currentYear = 2024;
</script>

{#if heatDeathData}
	<div class="w-full my-4 relative">
		Wir schreiben das Jahr {currentYear}.
	</div>
{/if}
