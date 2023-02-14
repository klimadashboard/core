<script>
	import BarChart from '../chartBar.svelte';
	import Papa from 'papaparse';
	import Switch from '$lib/components/Switch.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { fade } from 'svelte/transition';
	import formatNumber from '$lib/stores/formatNumber';
	import formatPercentage from '$lib/stores/formatPercentage';

	$: rawDataFederalStates = [];
	$: rawDataAustria = [];

	Papa.parse(
		'https://data.klimadashboard.org/at/emissions/Emission_All_sectors_Bundeslaender_Austria_1990-2019.csv',
		{
			download: true,
			dynamicTyping: true,
			header: true,
			skipEmptyLines: true,
			complete: function (results) {
				if (results) {
					rawDataFederalStates = results.data;
				}
			}
		}
	);

	Papa.parse(
		'https://data.klimadashboard.org/at/emissions/Emission_All_sectors_Austria_1990-2020.csv',
		{
			download: true,
			dynamicTyping: true,
			header: true,
			skipEmptyLines: true,
			complete: function (results) {
				if (results) {
					rawDataAustria = results.data;
				}
			}
		}
	);

	const aggregatedViews = [
		{
			key: 'total_co2e_t',
			label: 'Gesamt',
			icon: null,
			color: '#4DB263'
		},
		{
			key: 'sector_overview',
			label: 'Sektoren',
			icon: null,
			color: '#4DB263'
		}
	];

	const sectors = [
		{
			key: 'energy_co2e_t',
			label: 'Energie',
			color: '#BD3737',
			icon: "<svg width='16' height='20' viewBox='0 0 16 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M9 1V8H15L7 19V12H1L9 1Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'industry_co2e_t',
			label: 'Industrie',
			color: '#373949',
			icon: "<svg width='20' height='18' viewBox='0 0 20 18' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M19 17H1L1.00017 5.75676L8.10537 9.21622V5.75676L14.7369 9.21622V1H19V17Z' stroke='currentColor' stroke-width='2' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'buildings_co2e_t',
			label: 'Gebäude',
			color: '#4880A8',
			icon: "<svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 10H1L10 1L19 10H17' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M3 10V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19H15C15.5304 19 16.0391 18.7893 16.4142 18.4142C16.7893 18.0391 17 17.5304 17 17V10' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M12 10H8V14H12V10Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'traffic_co2e_t',
			label: 'Verkehr',
			color: '#F5AF4A',
			icon: "<svg width='20' height='15' viewBox='0 0 20 15' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M5 14C6.10457 14 7 13.1046 7 12C7 10.8954 6.10457 10 5 10C3.89543 10 3 10.8954 3 12C3 13.1046 3.89543 14 5 14Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M15 14C16.1046 14 17 13.1046 17 12C17 10.8954 16.1046 10 15 10C13.8954 10 13 10.8954 13 12C13 13.1046 13.8954 14 15 14Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M3 12H1V6M1 6L3 1H12L16 6M1 6H16M16 6H17C17.5304 6 18.0391 6.21071 18.4142 6.58579C18.7893 6.96086 19 7.46957 19 8V12H17M10 6V1' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7 12H13' stroke='currentColor' stroke-width='2' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'agriculture_co2e_t',
			label: 'Landwirtschaft',
			color: '#65987D',
			icon: "<svg width='20' height='16' viewBox='0 0 20 16' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M5 15C7.20914 15 9 13.2091 9 11C9 8.79086 7.20914 7 5 7C2.79086 7 1 8.79086 1 11C1 13.2091 2.79086 15 5 15Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M5 11V11.01' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M17 15C18.1046 15 19 14.1046 19 13C19 11.8954 18.1046 11 17 11C15.8954 11 15 11.8954 15 13C15 14.1046 15.8954 15 17 15Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M8.5 13H15' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M18 11.2V7C18 6.73478 17.8946 6.48043 17.7071 6.29289C17.5196 6.10536 17.2652 6 17 6H11L9 1H3V7.5' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M16 1H15C14.7348 1 14.4804 1.10536 14.2929 1.29289C14.1054 1.48043 14 1.73478 14 2V6' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'waste_co2e_t',
			label: 'Abfallwirtschaft',
			color: '#B7693D',
			icon: "<svg width='22' height='21' viewBox='0 0 22 21' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M10 18H19C19.3186 17.9836 19.6287 17.8912 19.9043 17.7305C20.1799 17.5698 20.4131 17.3456 20.5843 17.0764C20.7556 16.8073 20.86 16.501 20.8888 16.1833C20.9177 15.8656 20.8701 15.5456 20.75 15.25L20.2 14.25M12 16L10 18L12 20V16Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7.80319 7.26807L3.30319 15.0623C3.15811 15.3464 3.08311 15.6611 3.08444 15.9802C3.08578 16.2992 3.16342 16.6133 3.31087 16.8962C3.45832 17.1791 3.67131 17.4226 3.93206 17.6064C4.19281 17.7903 4.49375 17.909 4.80976 17.9528L5.95078 17.9765M8.53524 10.0001L7.80319 7.26807L5.07114 8.00012L8.53524 10.0001Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M18.1968 10.7319L13.6968 2.93771C13.5233 2.67 13.2882 2.44769 13.0113 2.28933C12.7343 2.13098 12.4235 2.04117 12.1048 2.02742C11.7861 2.01366 11.4687 2.07635 11.1791 2.21026C10.8895 2.34417 10.6362 2.5454 10.4402 2.79716L9.84922 3.77347M15.4648 9.99988L18.1968 10.7319L18.9289 7.99988L15.4648 9.99988Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'fluorinated_gases_co2e_t',
			label: 'Fluorierte Gase',
			color: '#7CAFBA',
			icon: "<svg width='21' height='20' viewBox='0 0 21 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 6.00003H11.5C11.9644 6.00892 12.4222 5.88823 12.8218 5.65152C13.2215 5.4148 13.5473 5.07141 13.7627 4.65986C13.9782 4.24832 14.0747 3.78489 14.0414 3.32156C14.0082 2.85824 13.8465 2.41334 13.5745 2.03676C13.3026 1.66019 12.931 1.36683 12.5017 1.1896C12.0723 1.01237 11.602 0.958278 11.1436 1.03338C10.6852 1.10849 10.2568 1.30982 9.90643 1.6148C9.55606 1.91979 9.29758 2.31636 9.16 2.76003' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M1 9.99997H16.5C16.9644 9.99108 17.4222 10.1118 17.8218 10.3485C18.2215 10.5852 18.5473 10.9286 18.7627 11.3401C18.9782 11.7517 19.0747 12.2151 19.0414 12.6784C19.0082 13.1418 18.8465 13.5867 18.5745 13.9632C18.3026 14.3398 17.931 14.6332 17.5017 14.8104C17.0723 14.9876 16.602 15.0417 16.1436 14.9666C15.6852 14.8915 15.2568 14.6902 14.9064 14.3852C14.5561 14.0802 14.2976 13.6836 14.16 13.24' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M2 14H7.5C7.96443 13.9911 8.42216 14.1118 8.82183 14.3485C9.22151 14.5852 9.54733 14.9286 9.76274 15.3401C9.97816 15.7517 10.0747 16.2151 10.0414 16.6784C10.0082 17.1418 9.8465 17.5867 9.57453 17.9632C9.30256 18.3398 8.93105 18.6332 8.50167 18.8104C8.07229 18.9876 7.60203 19.0417 7.14362 18.9666C6.68522 18.8915 6.2568 18.6902 5.90643 18.3852C5.55605 18.0802 5.29758 17.6836 5.16 17.24' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		}
	];

	const views = aggregatedViews.concat(sectors);

	$: activeView = 'total_co2e_t';

	$: selectedRegion = 'Austria';

	$: selectedSectors =
		activeView == 'sector_overview' ? sectors : views.filter((e) => e.key == activeView);

	$: selectedDataset = rawDataAustria;
	$: if (selectedRegion !== 'Austria') {
		selectedDataset = rawDataFederalStates;
	} else {
		selectedDataset = rawDataAustria;
	}

	$: reducer = function (result, entry) {
		var perCapitaString = showPerCapita ? '_percapita' : '';
		if (entry.region == selectedRegion) {
			result.push({
				label: entry.year,
				categories: selectedSectors?.map(function (item, index) {
					return {
						label: item.label,
						value: showPerCapita
							? Math.round(entry[item.key + perCapitaString] * 1000) / 1000
							: Math.round(entry[item.key]),
						color: item.color
					};
				})
			});
		}
		return result;
	};

	$: dataset = selectedDataset?.reduce(reducer, []);

	// variables for dynamic text generation
	let lastYear;
	let firstYearEmissions;
	let lastYearEmissions;
	let percentage1990lastYear;

	function getPercentageChange(oldNumber, newNumber) {
		var decreaseValue = oldNumber - newNumber;

		return (decreaseValue / oldNumber) * 100;
	}

	$: showPerCapita = false;

	let showFlightEmissions = false;
	$: allowFlightEmissions =
		selectedRegion == 'Austria' &&
		(activeView == 'sector_overview' || activeView == 'total_co2e_t') &&
		!showPerCapita;

	$: if (showFlightEmissions == true && allowFlightEmissions) {
		dataset = dataset.map((d) => {
			var categories = d.categories;
			categories.push({
				label: 'Flug',
				value: Math.round(
					rawDataAustria.findIndex((e) => e.year == d.label) > -1
						? rawDataAustria.find((e) => e.year == d.label).international_flight_co2e_t
						: 0
				),
				color: '#7586C1'
			});
			return {
				label: d.label,
				categories
			};
		});
	} else if (showFlightEmissions == false) {
		dataset = selectedDataset?.reduce(reducer, []);
	}

	$: if (rawDataAustria.length > 0) {
		lastYear = rawDataAustria[rawDataAustria.length - 1]['year'];
		firstYearEmissions = Math.round(rawDataAustria[0]['total_co2e_t']);
		lastYearEmissions = Math.round(rawDataAustria[rawDataAustria.length - 1]['total_co2e_t']);
		percentage1990lastYear = getPercentageChange(firstYearEmissions, lastYearEmissions) / 100;
	}

	$: if (
		dataset.findIndex((x) => x.label == 2021) < 0 &&
		selectedRegion == 'Austria' &&
		(activeView == 'sector_overview' || activeView == 'total_co2e_t') &&
		!showPerCapita
	) {
		dataset.push(
			{
				label: 2021,
				categories: [
					{
						label: 'Gesamt',
						value: 77500000,
						estimate: false
					}
				],
				estimate: false
			},
			{
				label: 2022,
				annotation: 'Prognose 2022',
				categories: [
					{
						label: 'Prognose 2022',
						value: 73600000,
						estimate: true
					}
				],
				estimate: true
			}
		);
	}

	let freezeYAxis = false;
</script>

<div class="flex flex-wrap gap-4 items-center sm:justify-between">
	<div class="relative text-gray-600">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="absolute pointer-events-none top-3 h-6 right-2 transform -translate-y-0.5 icon-tabler-selector"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			stroke-width="2"
			stroke="currentColor"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<polyline points="8 9 12 5 16 9" />
			<polyline points="16 15 12 19 8 15" />
		</svg>
		<select
			bind:value={selectedRegion}
			class="block appearance-none w-full bg-gray-200 border border-gray-100   py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 max-w-sm"
		>
			<option value="Austria">Österreich</option>
			<option value="Burgenland">Burgenland</option>
			<option value="Wien">Wien</option>
			<option value="Vorarlberg">Vorarlberg</option>
			<option value="Steiermark">Steiermark</option>
			<option value="Salzburg">Salzburg</option>
			<option value="Oberösterreich">Oberösterreich</option>
			<option value="Niederösterreich">Niederösterreich</option>
			<option value="Kärnten">Kärnten</option>
			<option value="Tirol">Tirol</option>
		</select>
	</div>
	{#if allowFlightEmissions}
		<label
			class="flex gap-1 text-sm items-center {showFlightEmissions
				? 'text-blue-700'
				: 'text-gray-400'}"
			transition:fade
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="w-5 h-5 icon icon-tabler icon-tabler-plane"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path stroke="none" d="M0 0h24v24H0z" fill="none" />
				<path d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3z" />
			</svg>
			<span>Internationaler Flugverkehr</span>
			<input type="checkbox" bind:checked={showFlightEmissions} />
		</label>
	{/if}
	<label
		class="flex gap-1 text-sm items-center {freezeYAxis ? 'text-gray-700' : 'text-gray-400'}"
		transition:fade
	>
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M4 7L7 4L10 7"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M7 20V4"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M17 14.4444H12C11.4477 14.4444 11 14.9419 11 15.5556V18.8889C11 19.5025 11.4477 20 12 20H17C17.5523 20 18 19.5025 18 18.8889V15.5556C18 14.9419 17.5523 14.4444 17 14.4444Z"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M12.5 14.4444V12.2222C12.5 11.6329 12.7107 11.0676 13.0858 10.6509C13.4609 10.2341 13.9696 10 14.5 10C15.0304 10 15.5391 10.2341 15.9142 10.6509C16.2893 11.0676 16.5 11.6329 16.5 12.2222V14.4444"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
		<span>Y-Achse fixieren?</span>
		<input type="checkbox" bind:checked={freezeYAxis} />
	</label>
	<label
		class="flex gap-1 text-sm items-center {showPerCapita ? 'text-gray-700' : 'text-gray-400'}"
		transition:fade
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5 icon icon-tabler icon-tabler-users"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			stroke-width="2"
			stroke="currentColor"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<circle cx="9" cy="7" r="4" />
			<path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
			<path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
		</svg>
		<span>Pro-Kopf Emissionen?</span>
		<input type="checkbox" bind:checked={showPerCapita} />
	</label>
</div>
<div class="h-80">
	{#if dataset.length > 0}
		<BarChart
			data={dataset}
			xAxixInterval="5"
			unit={'t THG'}
			visualisation={'stacked'}
			{freezeYAxis}
		/>
	{:else}
		<Loader />
	{/if}
</div>

<Switch
	{views}
	{activeView}
	on:itemClick={(event) => {
		activeView = event.detail;
	}}
/>
