<script>
	import Papa from 'papaparse';
	import { locale } from '$lib/stores/i18n';
	import MultiSelect from '$lib/components/MultiSelect.svelte';
	import BarChart from '../chartBar.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	let countryData;

	Papa.parse('https://data.klimadashboard.org/global/emissions/emissions_global.csv', {
		download: true,
		dynamicTyping: true,
		header: true,
		skipEmptyLines: true,
		complete: function (results) {
			if (results) {
				countryData = results.data;
			}
		}
	});

	let countryNames;

	Papa.parse('https://data.klimadashboard.org/global/world.csv', {
		download: true,
		dynamicTyping: false,
		header: true,
		skipEmptyLines: true,
		complete: function (results) {
			if (results) {
				countryNames = results.data;
			}
		}
	});

	$: selectedCountries = [PUBLIC_VERSION.toUpperCase(), 'CN', 'US', 'UK', 'SE', 'IT'];

	$: getIconString = function (iso) {
		var string = '';
		for (var i = 0; i < iso.length / 2; i++) {
			string +=
				'<image x=' +
				i * 30 +
				" height=15 href='https://data.klimadashboard.org/global/flags/" +
				iso.substring(i * 2, i * 2 + 2).toLowerCase() +
				".svg' class='shadow' />";
		}
		return string;
	};

	$: dataset = countryData?.reduce((result, entry) => {
		if (selectedCountries.includes(entry.state_iso)) {
			result.push({
				label: getCountryName(entry.state_iso),
				value: entry.co2_percapita,
				highlight: entry.state_iso == PUBLIC_VERSION.toUpperCase() ? true : false,
				icon: getIconString(entry.state_iso)
			});
		}
		return result;
	}, []);

	$: worldwideAverage =
		Math.round(countryData?.find((d) => d.state_name == 'World').co2_percapita * 10) / 10;
	$: lastYear = 2018;
	$: lastYearEmissions = countryData?.find((d) => d.state_iso == PUBLIC_VERSION.toUpperCase()).co2_percapita;

	$: lines = [
		{
			label: 'Weltweiter Durchschnitt' + ' ' + worldwideAverage + 't',
			value: worldwideAverage
		}
	];

	$: currentLocale = $locale;

	$: getCountryName = function (name, selectedLocale) {
		var countryName = name;

		if (countryData && countryNames && selectedLocale !== 'en') {
			if (countryNames.find((d) => d.en == name)) {
				countryName = countryNames.find((d) => d.en == name)[selectedLocale];
			}
		}
		return countryName;
	};
</script>

{#if countryData && countryNames}
	<MultiSelect id="countries" bind:value={selectedCountries}>
		<option value="" />
		{#each countryData.sort(function (a, b) {
			var nameA = getCountryName(a.state_name, currentLocale).toLowerCase(),
				nameB = getCountryName(b.state_name, currentLocale).toLowerCase();
			if (nameA < nameB) //sort string ascending
				return -1;
			if (nameA > nameB) return 1;
			return 0; //default return value (no sorting)
		}) as country}
			<option value={country.state_iso}>{getCountryName(country.state_name, currentLocale)}</option>
		{/each}
	</MultiSelect>

	<div class="h-80">
		{#if dataset}
			<BarChart
				data={dataset}
				sort={'descending'}
				label={'Pro-Kopf-Emissionen'}
				{lines}
				unit={'t THG'}
			/>
		{/if}
	</div>
{/if}
