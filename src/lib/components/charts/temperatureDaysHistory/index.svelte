<script>
	import { selectedStation } from '$lib/stores/weather';
	import { page } from '$app/stores';
	import Papa from 'papaparse';
	import { types } from '$lib/stores/weather';
	import Loader from '$lib/components/Loader.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	$: if ($page.url.searchParams.get('weatherStation')) {
		$selectedStation = $page.url.searchParams.get('weatherStation');
	} else {
		$selectedStation = 427;
	}

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
				selectedStationName = results.data.find((d) => d.id == selectedStation).name;
			}
		}
	});
</script>

<p>Temperaturtageverlauf für {selectedStationName}:</p>


