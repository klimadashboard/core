<script>
	import { types } from '$lib/stores/weather';
	import Papa from 'papaparse';
	import WeatherDayCard from './WeatherDayCard.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let selectedStation = 427;
	const wetterdienst = PUBLIC_VERSION == 'at' ? 'geosphere' : 'impact';

	$: earliestPossibleYear = 1961;
	$: latestPossibleYear = 2022;
	$: selectedReferenceYears = 1961;

	$: selectedStationData = [];

	$: Papa.parse(
		`https://data.klimadashboard.org/${PUBLIC_VERSION}/${wetterdienst}/stations/${selectedStation}/yearly-today.csv`,
		{
			download: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			header: true,
			complete: function (results) {
				if (results) {
					selectedStationData = results.data;
					earliestPossibleYear = results.data[0].year;
					latestPossibleYear = results.data[results.data.length - 1].year;
				}
			}
		}
	);

	$: selectedStationName = 'station';

	$: Papa.parse(`https://data.klimadashboard.org/${PUBLIC_VERSION}/${wetterdienst}/stations.csv`, {
		download: true,
		dynamicTyping: true,
		skipEmptyLines: true,
		header: true,
		complete: function (results) {
			if (results) {
				// console.log('dwd data', results.data, selectedStation);
				selectedStationName = results.data.find((d) => d.id == selectedStation).name;
			}
		}
	});
</script>

{#if selectedStationData.length > 0 && selectedStationName !== 'station'}
	<div class="flex flex-wrap gap-2 items-center bg-gray-100 rounded-2xl py-1 px-3 mb-3 max-w-max">
		<span class="font-bold">Referenzzeitraum</span>
		<label
			class="flex items-center gap-1 w-max {selectedReferenceYears == earliestPossibleYear
				? 'font-bold'
				: ''}"
		>
			<input type="radio" value={earliestPossibleYear} bind:group={selectedReferenceYears} />
			<span>langjähriger Schnitt ({earliestPossibleYear}-{latestPossibleYear})</span>
		</label>
		<label
			class="flex items-center gap-1 w-max {selectedReferenceYears == 1961 ? 'font-bold' : ''}"
		>
			<input type="radio" value={1961} bind:group={selectedReferenceYears} />
			<span>Klimareferenzperiode 1961-1990</span>
		</label>
		<label
			class="flex items-center gap-1 w-max {selectedReferenceYears == 1991 ? 'font-bold' : ''}"
		>
			<input type="radio" value={1991} bind:group={selectedReferenceYears} />
			<span>Klimareferenzperiode 1991-2020</span>
		</label>
	</div>

	<div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
		{#each $types as type}
			<WeatherDayCard
				key={type.key + 's'}
				title={type.label}
				description={type.description}
				color={type.color}
				icon={type.icon}
				{selectedStation}
				{selectedStationName}
				{selectedStationData}
				{selectedReferenceYears}
				{earliestPossibleYear}
				{latestPossibleYear}
			/>
		{/each}
	</div>
{/if}
