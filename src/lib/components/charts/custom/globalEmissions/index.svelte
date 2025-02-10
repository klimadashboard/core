<script>
	import Papa from 'papaparse';
	import { locale } from '$lib/stores/i18n';
	import MultiSelect from '$lib/components/MultiSelect.svelte';
	import Chart from './Chart.svelte';
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

	$: selectedCountries = [PUBLIC_VERSION, 'us', 'cn', 'in', 'ng'];

	$: data = [...selectedCountries]
		.map((c) => {
			return {
				label: getCountryName(c),
				value: countryData?.find((d) => d.state_iso == c.toUpperCase())
					? countryData?.find((d) => d.state_iso == c.toUpperCase()).co2e_percapita
					: false,
				code: c
			};
		})
		.sort((a, b) => b.value - a.value);

	const addToSelectedCountries = function (code) {
		selectedCountries = selectedCountries.concat([code]);
	};

	$: getCountryName = function (code) {
		return countryNames?.find((d) => d.alpha2 == code)
			? countryNames?.find((d) => d.alpha2 == code)[$locale]
			: code;
	};

	$: selectedCountry = 'false';

	$: worldAverage = countryData?.find((d) => d.state_iso == 'WORLD').co2e_percapita;
</script>

{#if countryData && countryNames && selectedCountries && data.length > 0}
	<div class="mt-4 relative">
		<Chart bind:selectedCountries bind:data {worldAverage} />

		<div class="left-4 absolute bottom-4 flex items-center space-x-2">
			<button on:mousedown={addToSelectedCountries(selectedCountry)}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icon icon-tabler icon-tabler-circle-plus"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					fill="none"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
						d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"
					/><path d="M9 12h6" /><path d="M12 9v6" /></svg
				>
			</button>
			<select
				bind:value={selectedCountry}
				class="border rounded-full appearance-none bg-gray-100 dark:bg-gray-800 px-2 text-sm"
			>
				<option value="" disabled selected>Select a country</option>
				{#each countryData
					.sort( (a, b) => getCountryName(a.state_iso.toLowerCase()).localeCompare(getCountryName(b.state_iso.toLowerCase())) )
					.filter((d) => selectedCountries.indexOf(d.state_iso.toLowerCase()) < 0) as country}
					<option
						value={country.state_iso.toLowerCase()}
						class="background-transparent appearance-none"
						>{getCountryName(country.state_iso.toLowerCase())}</option
					>
				{/each}
			</select>
		</div>
	</div>
{/if}
