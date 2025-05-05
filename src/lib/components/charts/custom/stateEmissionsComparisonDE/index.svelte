<script>
	import BarChart from '$lib/components/charts/chartBar.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import Papa from 'papaparse';
	import { onMount } from 'svelte';

	// This data prop is passed from the chart system - keep it even if not used
	export let data;

	let chartData = [];
	let selectedState = 'de-bayern'; // Default selected state
	let years = [];
	let regions = [];
	let rawData = [];
	let yAxisFixed = false;
	let perCapita = false;

	// Predefined display sectors with fixed order

	const sectors = [
		{
			key: 'Gesamt',
			label: 'Gesamt',
			icon: null,
			color: '#4DB263'
		},
		{
			key: 'Sektoren',
			label: 'Sektoren',
			icon: null,
			color: '#4DB263'
		},
		{
			key: 'Emissions|Kyoto Gases|Energy',
			label: 'Energie',
			color: '#BD3737',
			icon: "<svg width='16' height='20' viewBox='0 0 16 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M9 1V8H15L7 19V12H1L9 1Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'Emissions|Kyoto Gases|Industrial Processes',
			label: 'Industrie',
			color: '#373949',
			icon: "<svg width='20' height='18' viewBox='0 0 20 18' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M19 17H1L1.00017 5.75676L8.10537 9.21622V5.75676L14.7369 9.21622V1H19V17Z' stroke='currentColor' stroke-width='2' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'Gebäude',
			label: 'Gebäude',
			color: '#4880A8',
			icon: "<svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 10H1L10 1L19 10H17' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M3 10V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19H15C15.5304 19 16.0391 18.7893 16.4142 18.4142C16.7893 18.0391 17 17.5304 17 17V10' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M12 10H8V14H12V10Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'Verkehr',
			label: 'Verkehr',
			color: '#F5AF4A',
			icon: "<svg width='20' height='15' viewBox='0 0 20 15' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M5 14C6.10457 14 7 13.1046 7 12C7 10.8954 6.10457 10 5 10C3.89543 10 3 10.8954 3 12C3 13.1046 3.89543 14 5 14Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M15 14C16.1046 14 17 13.1046 17 12C17 10.8954 16.1046 10 15 10C13.8954 10 13 10.8954 13 12C13 13.1046 13.8954 14 15 14Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M3 12H1V6M1 6L3 1H12L16 6M1 6H16M16 6H17C17.5304 6 18.0391 6.21071 18.4142 6.58579C18.7893 6.96086 19 7.46957 19 8V12H17M10 6V1' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7 12H13' stroke='currentColor' stroke-width='2' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'Landwirtschaft',
			label: 'Landwirtschaft',
			color: '#65987D',
			icon: "<svg width='20' height='16' viewBox='0 0 20 16' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M5 15C7.20914 15 9 13.2091 9 11C9 8.79086 7.20914 7 5 7C2.79086 7 1 8.79086 1 11C1 13.2091 2.79086 15 5 15Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M5 11V11.01' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M17 15C18.1046 15 19 14.1046 19 13C19 11.8954 18.1046 11 17 11C15.8954 11 15 11.8954 15 13C15 14.1046 15.8954 15 17 15Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M8.5 13H15' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M18 11.2V7C18 6.73478 17.8946 6.48043 17.7071 6.29289C17.5196 6.10536 17.2652 6 17 6H11L9 1H3V7.5' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M16 1H15C14.7348 1 14.4804 1.10536 14.2929 1.29289C14.1054 1.48043 14 1.73478 14 2V6' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'Müll',
			label: 'Abfallwirtschaft',
			color: '#B7693D',
			icon: "<svg width='22' height='21' viewBox='0 0 22 21' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M10 18H19C19.3186 17.9836 19.6287 17.8912 19.9043 17.7305C20.1799 17.5698 20.4131 17.3456 20.5843 17.0764C20.7556 16.8073 20.86 16.501 20.8888 16.1833C20.9177 15.8656 20.8701 15.5456 20.75 15.25L20.2 14.25M12 16L10 18L12 20V16Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M7.80319 7.26807L3.30319 15.0623C3.15811 15.3464 3.08311 15.6611 3.08444 15.9802C3.08578 16.2992 3.16342 16.6133 3.31087 16.8962C3.45832 17.1791 3.67131 17.4226 3.93206 17.6064C4.19281 17.7903 4.49375 17.909 4.80976 17.9528L5.95078 17.9765M8.53524 10.0001L7.80319 7.26807L5.07114 8.00012L8.53524 10.0001Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M18.1968 10.7319L13.6968 2.93771C13.5233 2.67 13.2882 2.44769 13.0113 2.28933C12.7343 2.13098 12.4235 2.04117 12.1048 2.02742C11.7861 2.01366 11.4687 2.07635 11.1791 2.21026C10.8895 2.34417 10.6362 2.5454 10.4402 2.79716L9.84922 3.77347M15.4648 9.99988L18.1968 10.7319L18.9289 7.99988L15.4648 9.99988Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		},
		{
			key: 'F-Gase',
			label: 'Fluorierte Gase',
			color: '#7CAFBA',
			icon: "<svg width='21' height='20' viewBox='0 0 21 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 6.00003H11.5C11.9644 6.00892 12.4222 5.88823 12.8218 5.65152C13.2215 5.4148 13.5473 5.07141 13.7627 4.65986C13.9782 4.24832 14.0747 3.78489 14.0414 3.32156C14.0082 2.85824 13.8465 2.41334 13.5745 2.03676C13.3026 1.66019 12.931 1.36683 12.5017 1.1896C12.0723 1.01237 11.602 0.958278 11.1436 1.03338C10.6852 1.10849 10.2568 1.30982 9.90643 1.6148C9.55606 1.91979 9.29758 2.31636 9.16 2.76003' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M1 9.99997H16.5C16.9644 9.99108 17.4222 10.1118 17.8218 10.3485C18.2215 10.5852 18.5473 10.9286 18.7627 11.3401C18.9782 11.7517 19.0747 12.2151 19.0414 12.6784C19.0082 13.1418 18.8465 13.5867 18.5745 13.9632C18.3026 14.3398 17.931 14.6332 17.5017 14.8104C17.0723 14.9876 16.602 15.0417 16.1436 14.9666C15.6852 14.8915 15.2568 14.6902 14.9064 14.3852C14.5561 14.0802 14.2976 13.6836 14.16 13.24' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M2 14H7.5C7.96443 13.9911 8.42216 14.1118 8.82183 14.3485C9.22151 14.5852 9.54733 14.9286 9.76274 15.3401C9.97816 15.7517 10.0747 16.2151 10.0414 16.6784C10.0082 17.1418 9.8465 17.5867 9.57453 17.9632C9.30256 18.3398 8.93105 18.6332 8.50167 18.8104C8.07229 18.9876 7.60203 19.0417 7.14362 18.9666C6.68522 18.8915 6.2568 18.6902 5.90643 18.3852C5.55605 18.0802 5.29758 17.6836 5.16 17.24' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		}
	];

	// Mapping between actual data categories and user-friendly display names
	const sectorMapping = {
		'Emissions|Kyoto Gases': 'Gesamt',
		'Emissions|CO2': 'CO2',
		'Emissions|Kyoto Gases|Energy': 'Energie',
		'Emissions|Kyoto Gases|Industrial Processes': 'Industrie',
		'Emissions|Kyoto Gases|Buildings': 'Gebäude',
		'Emissions|Kyoto Gases|Mobility': 'Verkehr',
		'Emissions|Kyoto Gases|Agriculture': 'Landwirtschaft',
		'Emissions|Kyoto Gases|Waste and Other': 'Abfallwirtschaft'
	};

	// Reverse mapping from display names to actual data categories
	const reverseSectorMapping = {
		Gesamt: 'Emissions|Kyoto Gases',
		Sektoren: 'Emissions|Kyoto Gases',
		CO2: 'Emissions|CO2',
		Energie: 'Emissions|Kyoto Gases|Energy',
		Industrie: 'Emissions|Kyoto Gases|Industrial Processes',
		Gebäude: 'Emissions|Kyoto Gases|Buildings',
		Verkehr: 'Emissions|Kyoto Gases|Mobility',
		Landwirtschaft: 'Emissions|Kyoto Gases|Agriculture',
		Abfallwirtschaft: 'Emissions|Kyoto Gases|Waste and Other'
	};

	// Mapping for sector colors in the UI
	const sectorColorMapping = {
		Energie: 'energy',
		Industrie: 'industry',
		Gebäude: 'building',
		Verkehr: 'mobility',
		Landwirtschaft: 'agriculture',
		Abfallwirtschaft: 'waste'
	};

	let selectedDisplaySector = 'Gesamt'; // Default sector
	let selectedSector = reverseSectorMapping[selectedDisplaySector]; // Actual data category

	onMount(() => {
		loadCsvData();
	});

	function loadCsvData() {
		Papa.parse('/de-federal-states-emissions.csv', {
			download: true,
			header: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			complete: function (results) {
				if (results && results.data) {
					// Filter out any rows with invalid values
					rawData = results.data.filter(
						(row) => row && typeof row.value === 'number' && !isNaN(row.value)
					);

					// Extract unique years, regions and sectors
					years = [...new Set(rawData.map((d) => d.period))].sort();

					// Only include regions that have emissions data, not just population data
					const emissionsData = rawData.filter(
						(row) => row.category && row.category.startsWith('Emissions')
					);
					regions = [...new Set(emissionsData.map((d) => d.region))];

					// Get available sectors and filter out those not in our mapping
					const availableSectors = [...new Set(rawData.map((d) => d.category))];
					console.log('Available data categories:', availableSectors);

					// Update chart for the default state
					updateChartForState(selectedState);
				}
			},
			error: function (error) {
				console.error('Error loading CSV:', error);
			}
		});
	}

	function updateChartForState(state) {
		// Get all data for the selected state and sector
		const stateData = rawData.filter(
			(d) =>
				d.region === state &&
				d.category === selectedSector &&
				typeof d.value === 'number' &&
				!isNaN(d.value)
		);

		// Create a simplified data structure compatible with the chart component
		chartData = stateData.map((d) => {
			// Check if this is a target year (2030 or 2040)
			const isTargetYear = d.period === 2030 || d.period === 2040;
			console.log(d.category);

			return {
				label: String(d.period),
				categories: [
					{
						label: '',
						value: Number(d.value),
						// Assign color based on whether it's a target year
						color: isTargetYear
							? '#E31A1C'
							: sectors.find((s) => s.key == d.category)?.color || 'grey', // Match the green from the example for historical data
						estimate: false
					}
				]
			};
		});

		// Sort by year
		chartData.sort((a, b) => parseInt(a.label) - parseInt(b.label));

		console.log('Chart data:', chartData);
		console.log(
			'Target years:',
			chartData.filter((d) => d.label === '2030' || d.label === '2040')
		);
	}

	function formatRegionName(regionCode) {
		// Convert region codes to readable names
		const regionNames = {
			'de-bayern': 'Bayern',
			'de-baden-wuerttemberg': 'Baden-Württemberg',
			'de-brandenburg': 'Brandenburg',
			'de-hessen': 'Hessen',
			'de-niedersachsen': 'Niedersachsen',
			'de-nordrhein-westfalen': 'Nordrhein-Westfalen',
			'de-rheinland-pfalz': 'Rheinland-Pfalz',
			'de-saarland': 'Saarland',
			'de-sachsen': 'Sachsen',
			'de-sachsen-anhalt': 'Sachsen-Anhalt',
			'de-schleswig-holstein': 'Schleswig-Holstein',
			'de-stadtstaaten': 'Stadtstaaten'
		};

		return regionNames[regionCode] || regionCode;
	}

	function getSectorIcon(sector) {
		const icons = {
			Gesamt: '',
			Sektoren: '',
			Energie:
				"<svg width='16' height='20' viewBox='0 0 16 20' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M9 1V8H15L7 19V12H1L9 1Z' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>",
			Industrie:
				"<svg width='20' height='18' viewBox='0 0 20 18' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M19 17H1L1.00017 5.75676L8.10537 9.21622V5.75676L14.7369 9.21622V1H19V17Z' stroke='currentColor' stroke-width='2' stroke-linejoin='round'/></svg>",
			Gebäude:
				"<svg width='20' height='18' viewBox='0 0 20 18' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M1 17H19V7L10 1L1 7V17Z' stroke='currentColor' stroke-width='2' stroke-linejoin='round'/><path d='M7 17V10H13V17' stroke='currentColor' stroke-width='2' stroke-linejoin='round'/></svg>",
			Verkehr:
				"<svg width='20' height='18' viewBox='0 0 20 18' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M15 17H13V15H7V17H5V9L6.5 5H13.5L15 9V17Z' stroke='currentColor' stroke-width='2' stroke-linejoin='round'/><circle cx='7' cy='12' r='1' stroke='currentColor' stroke-width='2'/><circle cx='13' cy='12' r='1' stroke='currentColor' stroke-width='2'/></svg>",
			Landwirtschaft:
				"<svg width='20' height='18' viewBox='0 0 20 18' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M13 13C13 14.3594 12.6839 15.5134 11.9497 16.2426C11.2155 16.9718 10.0616 17.2857 8.7 17.3V6.50001C10.0616 6.53571 11.2155 6.90766 11.9497 7.63688C12.6839 8.36609 13 9.51999 13 11V13Z' stroke='currentColor' stroke-width='2'/><path d='M13 11C17 10.5 18 8.5 18 5C14.5 5.5 13 7.5 13 11Z' stroke='currentColor' stroke-width='2' stroke-linejoin='round'/><path d='M8.7 6.5C8.7 6.5 8.7 5.9 8.7 4.9C8.7 3.9 9.2 1 5 1C5 5.5 8.7 5.8 8.7 6.5Z' stroke='currentColor' stroke-width='2' stroke-linejoin='round'/></svg>",
			Abfallwirtschaft:
				"<svg width='20' height='18' viewBox='0 0 20 18' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M1 4L19 4' stroke='currentColor' stroke-width='2' stroke-linecap='round'/><path d='M7 8V14' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M13 8V14' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M3.85714 4L5.27778 16.5714C5.27778 16.5714 6.00001 17.5714 10 17.5714C14 17.5714 14.6667 16.5714 14.6667 16.5714L16.1429 4' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M6.66667 4L7.15757 2.07142C7.44486 0.904755 8.1222 0 10 0C11.8778 0 12.5551 0.904765 12.8424 2.07143L13.3333 4' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
		};

		return icons[sector] || '';
	}

	function getSectorColorClass(sector) {
		if (sector === 'Gesamt' || sector === 'Sektoren') {
			return 'bg-gray-200 dark:bg-gray-900';
		}
		return `bg-${sectorColorMapping[sector] || 'gray-200'} text-white`;
	}

	$: if (selectedState) {
		updateChartForState(selectedState);
	}

	$: if (selectedDisplaySector) {
		selectedSector = reverseSectorMapping[selectedDisplaySector];
		if (selectedSector) {
			updateChartForState(selectedState);
		} else {
			console.warn(`No mapping found for display sector: ${selectedDisplaySector}`);
		}
	}
</script>

<div class="my-4">
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
				<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
				<polyline points="8 9 12 5 16 9"></polyline>
				<polyline points="16 15 12 19 8 15"></polyline>
			</svg>
			<select
				class="block appearance-none w-full bg-gray-200 border border-gray-100 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 max-w-sm"
				bind:value={selectedState}
				on:change={() => updateChartForState(selectedState)}
			>
				{#each regions as region}
					<option value={region}>{formatRegionName(region)}</option>
				{/each}
			</select>
		</div>

		<label class="flex gap-1 text-sm items-center text-gray-400">
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M4 7L7 4L10 7"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				></path>
				<path
					d="M7 20V4"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				></path>
				<path
					d="M17 14.4444H12C11.4477 14.4444 11 14.9419 11 15.5556V18.8889C11 19.5025 11.4477 20 12 20H17C17.5523 20 18 19.5025 18 18.8889V15.5556C18 14.9419 17.5523 14.4444 17 14.4444Z"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				></path>
				<path
					d="M12.5 14.4444V12.2222C12.5 11.6329 12.7107 11.0676 13.0858 10.6509C13.4609 10.2341 13.9696 10 14.5 10C15.0304 10 15.5391 10.2341 15.9142 10.6509C16.2893 11.0676 16.5 11.6329 16.5 12.2222V14.4444"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				></path>
			</svg>
			<span>Y-Achse fixieren?</span>
			<input type="checkbox" bind:checked={yAxisFixed} />
		</label>

		<label class="flex gap-1 text-sm items-center text-gray-400">
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
				<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
				<circle cx="9" cy="7" r="4"></circle>
				<path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"></path>
				<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
				<path d="M21 21v-2a4 4 0 0 0 -3 -3.85"></path>
			</svg>
			<span>Pro-Kopf Emissionen?</span>
			<input type="checkbox" bind:checked={perCapita} />
		</label>
	</div>
</div>

<!-- Chart container -->
<div class="h-80">
	{#if chartData?.length > 0}
		<BarChart
			data={chartData}
			unit=" Mt CO₂e"
			xAxixInterval={2}
			useDataColors={true}
			freezeYAxis={yAxisFixed}
			visualisation={'stacked'}
		/>
	{:else}
		<Loader />
	{/if}
</div>

<!-- Category selector -->

<Switch
	views={sectors}
	activeView={selectedDisplaySector}
	on:itemClick={(event) => {
		selectedDisplaySector = event.detail;
	}}
/>

<!-- Legend and additional information -->
<div class="text-sm text-gray-600 flex flex-wrap gap-4 mt-4">
	<p>Datenquellen: Regionalstatistik (Tabelle 86431-Z-01)</p>
	<div class="flex items-center">
		<span class="inline-block w-4 h-4 mr-1 bg-[#4DB263]"></span>
		<span>Historische Emissionen</span>
	</div>
	<div class="flex items-center">
		<span class="inline-block w-4 h-4 mr-1 bg-[#E31A1C]"></span>
		<span>Klimaziele</span>
	</div>
</div>

<!-- Description -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-4 pb-10 mt-6">
	<div class="text-lg col-span-2">
		<p>
			Dieses Diagramm zeigt den jährlichen Ausstoß aller Treibhausgase der deutschen Bundesländer.
			Die Daten beinhalten sowohl historische Emissionen als auch die offiziellen Klimaziele, die
			bis 2040 erreicht werden sollen.
		</p>
		<p>
			Die Emissionsdaten stammen aus der offiziellen Regionalstatistik. Die Klimaziele für 2030 und
			2040 basieren auf den angekündigten Reduktionszielen der jeweiligen Landesregierungen.
		</p>
	</div>

	<div class="text-sm">
		<div class="flex items-center gap-0.5 font-bold -mb-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="icon icon-tabler icon-tabler-table"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
				<rect x="4" y="4" width="16" height="16" rx="2"></rect>
				<line x1="4" y1="10" x2="20" y2="10"></line>
				<line x1="10" y1="4" x2="10" y2="20"></line>
			</svg>
			<h3>Datenquellen</h3>
		</div>
		<div class="text">
			<p>Regionalstatistik (Tabelle 86431-Z-01)</p>
			<p>Klimaziele: Offizielle Mitteilungen der Landesregierungen</p>
		</div>
	</div>
</div>
