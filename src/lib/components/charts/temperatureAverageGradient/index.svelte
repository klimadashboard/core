<script>
	import GradientBarChart from './GradientBarChart.svelte';
	import { selectedStation } from '$lib/stores/weather';
	import { theme } from '$lib/stores/theme';
	import Papa from 'papaparse';
	import { PUBLIC_VERSION } from '$env/static/public';

	let showMonthly = true;
	let showMonth = 1;

	let selectedReferenceYears = 1900;
	let historicalDatasetYearly;
	let historicalDatasetMonthly;
	$: historicalDataset = showMonthly ? historicalDatasetMonthly?.filter(d => d.month == showMonth) : historicalDatasetYearly;
	const yearInterval = 30;
	const unit = '°C';

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
					historicalDatasetYearly = results.data
						.filter((d) => d.averageTemperature !== 'null' && d.averageTemperature > -999)
						.filter((d) => d.year < new Date().getFullYear());
				}
			}
		}
	);
	$: Papa.parse(
		`https://data.klimadashboard.org/${PUBLIC_VERSION}/${wetterdienst}/stations/${$selectedStation}/monthly.csv`,
		{
			download: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			header: true,
			complete: function (results) {
				if (results) {
					historicalDatasetMonthly = results.data
						.filter((d) => d.averageTemperature !== 'null' && d.averageTemperature > -999)
						.filter((d) => d.year < new Date().getFullYear())
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
		<!-- <div class="flex flex-wrap gap-2 items-center bg-gray-100 rounded-2xl py-1 px-3 mb-3 max-w-max">
			<span class="font-bold">Klimareferenzperiode</span>
			<label
				class="flex items-center gap-1 w-max {selectedReferenceYears == 1900 ? 'font-bold' : ''}"
			>
				<input type="radio" value={1900} bind:group={selectedReferenceYears} />
				<span>ganzer Zeitraum</span>
			</label>
			<label
				class="flex items-center gap-1 w-max {selectedReferenceYears == 1961 ? 'font-bold' : ''}"
			>
				<input type="radio" value={1961} bind:group={selectedReferenceYears} />
				<span>1961-1990</span>
			</label>
			<label
				class="flex items-center gap-1 w-max {selectedReferenceYears == 1991 ? 'font-bold' : ''}"
			>
				<input type="radio" value={1991} bind:group={selectedReferenceYears} />
				<span>1991-2020</span>
			</label>
		</div> -->

		<div class="flex flex-wrap gap-2 items-center bg-gray-100 rounded-2xl py-1 px-3 mb-3 max-w-max">
			<span class="font-bold">Vergleich</span>
			<label
				class="flex items-center gap-1 w-max {showMonthly ? 'font-bold' : ''}"
			>
				<input type="radio" value={false} bind:group={showMonthly} />
				<span>Jährlich</span>
			</label>
			<label
				class="flex items-center gap-1 w-max {showMonthly ? 'font-bold' : ''}"
			>
				<input type="radio" value={true} bind:group={showMonthly} />
				<span>Monatlich</span>
			</label>
			{#if showMonthly}
				{@const months = ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]}
				{@const currentMonth = new Date().getMonth()}
				<select bind:value={showMonth}>
					{#each months as month, m}
						<option value={m}>{month}</option>
					{/each}
				</select>
			{/if}
		</div>


		<GradientBarChart
			data={historicalDataset}
			averageTemperature={historicalAverageTemperature}
			{unit}
		/>
	</div>
{/if}
