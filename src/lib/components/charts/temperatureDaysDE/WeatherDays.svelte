<script>
	import { types } from '$lib/stores/weather';
	import Papa from 'papaparse';
	import WeatherDayCard from './WeatherDayCard.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let selectedStation = 427;
	const wetterdienst = PUBLIC_VERSION == 'at' ? 'geosphere' : 'impact';

	let selectedYearDefinition = 'current';

	$: earliestPossibleYear = 1961;
	$: currentYear = new Date().getFullYear();
	let latestPossibleYear =
		selectedYearDefinition == 'last-full' ? new Date().getFullYear() - 1 : new Date().getFullYear();
	$: selectedReferenceYears = 1961;

	$: selectedStationData = [];

	$: Papa.parse(
		// `../data/${PUBLIC_VERSION}/${wetterdienst}/stations/${selectedStation}/${
		// 	selectedYearDefinition == 'last-full' ? 'yearly' : 'yearly-today'
		// }.csv`,
		`https://data.klimadashboard.org/${PUBLIC_VERSION}/${wetterdienst}/stations/${selectedStation}/${
			selectedYearDefinition == 'last-full' ? 'yearly' : 'yearly-today'
		}.csv`,
		{
			download: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			header: true,
			complete: function (results) {
				if (results) {
					selectedStationData = results.data;
					earliestPossibleYear = results.data[0].year;
					latestPossibleYear =
						selectedYearDefinition == 'last-full'
							? results.data[results.data.length - 1].year - 1
							: results.data[results.data.length - 1].year;
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
				selectedStationName = results.data.find((d) => d.id == selectedStation).name;
			}
		}
	});
</script>

{#if selectedStationData.length > 0 && selectedStationName !== 'station'}
	<div
		class="inline-flex flex-wrap gap-2 items-center bg-gray-100 rounded-2xl py-1 px-3 mb-3 max-w-max"
	>
		<span class="font-bold">Jahr</span>
		<label
			class="flex items-center gap-1 w-max {selectedYearDefinition == 'last-full'
				? 'font-bold'
				: ''}"
		>
			<input type="radio" value={'last-full'} bind:group={selectedYearDefinition} />
			<span>{currentYear - 1}</span>
		</label>
		<label
			class="flex items-center gap-1 w-max {selectedYearDefinition == 'current' ? 'font-bold' : ''}"
		>
			<input type="radio" value={'current'} bind:group={selectedYearDefinition} />
			<span>{currentYear} bisher</span>
		</label>
	</div>

	<div
		class="inline-flex flex-wrap gap-2 items-center bg-gray-100 rounded-2xl py-1 px-3 mb-3 max-w-max"
	>
		<span class="font-bold">Klimareferenzperiode</span>
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
