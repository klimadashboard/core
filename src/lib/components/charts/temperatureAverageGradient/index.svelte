<script>
	import GradientBarChart from './GradientBarChart.svelte';
	import { selectedStation } from '$lib/stores/weather';
	import { theme } from '$lib/stores/theme';
	import Papa from 'papaparse';
	import { PUBLIC_VERSION } from '$env/static/public';

	let historicalDataset;
	const yearInterval = 30;
	const unit = '°C';

	let historicalPrecipitationData;
	$: historicalPrecipitation = historicalPrecipitationData?.map((entry) => {
		return {
			x: entry.year,
			y: entry.totalPrecipitation
		};
	});

	const wetterdienst = PUBLIC_VERSION == 'at' ? 'geosphere' : 'impact';
	$: Papa.parse(
		`https://data.klimadashboard.org/${PUBLIC_VERSION}/${wetterdienst}/stations/${$selectedStation}/yearly.csv`,
		{
			download: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			header: true,
			complete: function (results) {
				if (results) {
					historicalPrecipitationData = results.data.filter(
						(entry) => entry.totalPrecipitation >= 0
					);
					historicalDataset = results.data
						.filter((d) => d.averageTemperature !== 'null' && d.averageTemperature > -999)
						.filter((d) => d.year < new Date().getFullYear());
				}
			}
		}
	);

	// $: rollingAverageSum = 0;

	// $: historicalData = historicalDataset?.map((entry, index) => {
	// 	// const lowerBoundYear = Math.max(historicalDataset[0].year, entry.year - yearInterval);
	// 	// const lowerBoundIndex = historicalDataset.findIndex((d) => d.year == lowerBoundYear);
	// 	// const upperBoundYear = Math.min(entry.year, lowerBoundYear + yearInterval);
	// 	// const upperBoundIndex = historicalDataset.findIndex((d) => d.year == upperBoundYear);
	// 	return {
	// 		x: entry.year,
	// 		y: entry.averageTemperature,
	// 	};
	// });

	$: historicalAverageTemperature = historicalDataset?.reduce((averageSum, entry, index) => {
		// const lowerBoundYear = Math.max(historicalDataset[0].year, entry.year - yearInterval);
		// const lowerBoundIndex = historicalDataset.findIndex((d) => d.year == lowerBoundYear);
		// const upperBoundYear = Math.min(entry.year, lowerBoundYear + yearInterval);
		// const upperBoundIndex = historicalDataset.findIndex((d) => d.year == upperBoundYear);
		return averageSum + entry.averageTemperature / historicalDataset.length;
	}, 0);

	$: selectedStationName = 'station';

	// $: Papa.parse(`../data/${PUBLIC_VERSION}/${wetterdienst}/stations.csv`, {
	$: Papa.parse(`https://data.klimadashboard.org/${PUBLIC_VERSION}/${wetterdienst}/stations.csv`, {
		download: true,
		dynamicTyping: true,
		skipEmptyLines: true,
		header: true,
		complete: function (results) {
			if (results) {
				selectedStationName = results.data.find((d) => d.id == $selectedStation)?.name;
			}
		}
	});
</script>

{#if historicalDataset}
	<div class="w-full my-4 relative" style="height: 50vh;">
		<GradientBarChart
			data={historicalDataset}
			averageTemperature={historicalAverageTemperature}
			{unit}
		/>

		<div class="text-sm text-gray-600 absolute top-9 md:top-11 w-full pointer-events-none">
			<div
				class="container flex flex-col sm:flex-row sm:items-center sm:space-x-4 transform translate-y-2"
			>
				<div class="flex items-center space-x-1">
					<div class="w-3 h-3 rounded-full" style="background-color: #AD0826" />
					<p>Jahresdurchschnittstemperatur</p>
				</div>
				<div class="flex items-center space-x-1">
					<div class="w-8 h-1 rounded-full bg-gray-200" />
					<p>30-jähriger Durchschnitt</p>
				</div>

				<p>ID{$selectedStation} – {selectedStationName}</p>
			</div>
		</div>
	</div>
{/if}
