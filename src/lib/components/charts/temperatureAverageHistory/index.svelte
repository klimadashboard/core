<script>
	import ChartDots from '../chartDots.svelte';
	import BarChart from '../chartBar.svelte';
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

	const wetterdienst = PUBLIC_VERSION == 'at' ? 'zamg' : 'impact';
	$: Papa.parse(
		// `https://data.klimadashboard.org/${PUBLIC_VERSION}/zamg/stations/${$selectedStation}/yearly.csv`,
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
					// console.log(results.data);
					historicalDataset = results.data.filter(
						(d) => d.averageTemperature !== 'null' && d.averageTemperature > -999
					);
				}
			}
		}
	);

	$: rollingAverageSum = 0;

	$: historicalData = historicalDataset?.map((entry, index) => {
		// TODO: use arrays for the last 30 years, not containing null values, for less-error-prone averaging
		const lowerBoundYear = Math.max(historicalDataset[0].year, entry.year - yearInterval);
		const lowerBoundIndex = historicalDataset.findIndex((d) => d.year == lowerBoundYear);
		const upperBoundYear = Math.min(entry.year, lowerBoundYear + yearInterval);
		const upperBoundIndex = historicalDataset.findIndex((d) => d.year == upperBoundYear);

		const rollingAverageDataset = [...historicalDataset].slice(lowerBoundIndex, upperBoundIndex);
		rollingAverageSum = 0;
		for (var i = 0; i < rollingAverageDataset.length; i++) {
			rollingAverageSum += rollingAverageDataset[i].averageTemperature;
		}
		const rollingAverageYears = upperBoundYear - lowerBoundYear;
		const rollingAverage = rollingAverageSum / rollingAverageYears;

		return {
			x: entry.year,
			y: Math.round(entry.averageTemperature * 10) / 10,
			path: rollingAverage
		};
	});

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

{#if historicalData}
	<div class="w-full my-4 relative" style="height: 50vh;">
		<ChartDots
			data={historicalData}
			{unit}
			colors={$theme == 'dark' ? ['#333BCC', '#D9264F'] : ['#313695', '#a50026']}
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
