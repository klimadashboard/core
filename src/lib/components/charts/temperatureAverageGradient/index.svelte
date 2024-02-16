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
</script>

{#if historicalDataset}
	<div class="w-full my-4 relative" style="height: 50vh;">
		<GradientBarChart
			data={historicalDataset}
			averageTemperature={historicalAverageTemperature}
			{unit}
		/>
	</div>
{/if}
