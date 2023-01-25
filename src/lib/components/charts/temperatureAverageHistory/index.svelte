<script>
	import ChartDots from '../chartDots.svelte';
	import { selectedStation } from '$lib/stores/weather';
	import { theme } from '$lib/stores/theme';
	import Papa from 'papaparse';

	let historicalDataset;
	const yearInterval = 30;
	const unit = '°C';

	$: Papa.parse(
		'https://data.klimadashboard.org/at/zamg/stations/' + $selectedStation + '/yearly.csv',
		{
			download: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			header: true,
			complete: function (results) {
				if (results) {
					historicalDataset = results.data.filter(d => d.averageTemperature !== "null");
				}
			}
		}
	);

	$: rollingAverageSum = 0;

	$: historicalData = historicalDataset?.map((entry, index) => {
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

	$: Papa.parse('https://data.klimadashboard.org/at/zamg/stations.csv', {
		download: true,
		dynamicTyping: true,
		skipEmptyLines: true,
		header: true,
		complete: function (results) {
			if (results) {
				selectedStationName = results.data.find((d) => d.id == $selectedStation).name;
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

		<div class="text-sm text-gray-600  absolute top-9 md:top-11 w-full pointer-events-none">
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
