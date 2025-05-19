<script context="module" lang="ts">
	// Directive to handle clicks outside of an element
	function clickOutside(node: HTMLElement, handler: (event: MouseEvent) => void) {
		const handleClick = (event: MouseEvent) => {
			if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
				handler(event);
			}
		};

		document.addEventListener('click', handleClick, true);

		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}
</script>

<script lang="ts">
	import {
		AsyncGetMobilityRenewableShare,
		AsyncGetCountries,
		type GetMobilityRenewableShareQuery,
		type GetCountriesQuery
	} from './__generated__/getData.generated';
	import ChartLine from '$lib/components/charts/chartLine.svelte';
	import { onMount } from 'svelte';
	import { transformDataForChart, type LineChartData } from './transformData';
	import { FOSSIL_COLOR } from './constants';

	let loading = true;
	let error: Error | null = null;
	let lineChartData: LineChartData = {
		chartData: [],
		keys: [],
		labels: [],
		colors: []
	};
	let compareCountries: boolean = false;

	// Detect country from domain
	let currentCountry = 'DE'; // Default to DE

	function getCountryFromDomain(): string {
		const hostname = window.location.hostname;
		if (hostname.includes('.at')) {
			return 'AT';
		} else if (hostname.includes('.de')) {
			return 'DE';
		}
		// Default fallback
		return 'DE';
	}

	currentCountry = getCountryFromDomain();

	// Country selection functionality
	let availableCountries: { id: string; name: string | null | undefined; selected: boolean }[] = [];
	let data: GetMobilityRenewableShareQuery['mobility'];
	let countries: GetCountriesQuery['countries'];
	let selectedCountries: string[] = [];
	let isDropdownOpen = false;

	// Create a reactive declaration for defaultCountries based on compareCountries
	$: defaultCountries = compareCountries ? [currentCountry, 'SE', 'FR', 'PL'] : [currentCountry];

	// Update chart data based on selected countries
	function updateChartData() {
		if (data.length === 0 || countries.length === 0) return;

		selectedCountries = availableCountries
			.filter((country) => country.selected)
			.map((country) => country.id);

		lineChartData = transformDataForChart(
			// Filter data to only include selected countries
			data.filter((item) => selectedCountries.includes(item.region ?? '')),
			countries,
			currentCountry
		);

		// If only one country is selected, add the fossil category
		if (selectedCountries.length === 1) {
			const chartDataWithFossil = [...lineChartData.chartData];
			const singleCountryKey = selectedCountries[0];

			// Add the fossil category to each data point
			chartDataWithFossil.forEach((dataPoint) => {
				const renewableValue = dataPoint[singleCountryKey] ?? 0;
				// Calculate the fossil value (remaining percentage)
				dataPoint['fossil'] = Math.max(0, 100 - renewableValue);
			});

			lineChartData.labels[0] = 'Erneuerbar';

			// Update the chart data with the new data points
			lineChartData = {
				chartData: chartDataWithFossil,
				keys: [...lineChartData.keys, 'fossil'],
				labels: [...lineChartData.labels, 'Fossil'],
				colors: [...lineChartData.colors, FOSSIL_COLOR]
			};
		}
	}

	// Toggle country selection
	function toggleCountry(countryId: string) {
		const index = availableCountries.findIndex((c) => c.id === countryId);
		if (index !== -1) {
			availableCountries[index].selected = !availableCountries[index].selected;
			availableCountries = [...availableCountries]; // Trigger reactivity
			updateChartData();
		}
	}

	// Select all countries
	function selectAllCountries() {
		availableCountries = availableCountries.map((c) => ({ ...c, selected: true }));
		updateChartData();
	}

	// Deselect all countries
	function deselectAllCountries() {
		availableCountries = availableCountries.map((c) => ({ ...c, selected: false }));
		updateChartData();
	}

	// Toggle dropdown visibility
	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const dropdown = document.getElementById('country-dropdown');
		const button = document.getElementById('dropdown-button');

		if (dropdown && button && !dropdown.contains(target) && !button.contains(target)) {
			isDropdownOpen = false;
		}
	}

	onMount(async () => {
		try {
			loading = true;
			const [mobilityData, countriesData] = await Promise.all([
				AsyncGetMobilityRenewableShare({}),
				AsyncGetCountries({})
			]);

			data = mobilityData.data.mobility;
			countries = countriesData.data.countries;

			// Initialize available countries with default selections
			availableCountries = countries
				.filter((country) => data.some((item) => item.region === country.id)) // Only include countries with data
				.map((country) => ({
					id: country.id,
					name: country.name_de,
					selected: defaultCountries.includes(country.id)
				}))
				.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')); // Sort alphabetically

			updateChartData();
		} catch (e) {
			error = e as Error;
		} finally {
			loading = false;
		}
	});
</script>

<div class="w-full h-[400px] p-4">
	{#if loading}
		<div class="flex items-center justify-center h-full">
			<p class="text-gray-500">Loading chart data...</p>
		</div>
	{:else if error}
		<div class="flex items-center justify-center h-full">
			<p class="text-red-500">Error loading chart data: {error.message}</p>
		</div>
	{:else if data && data.length > 0}
		<!-- Country selection dropdown -->
		<div class="flex flex-col sm:flex-row gap-2 mb-4 items-center justify-between relative">
			<label class="flex items-center gap-2 cursor-pointer py-1.5">
				<input
					type="checkbox"
					class="cursor-pointer"
					bind:checked={compareCountries}
					on:change={() => {
						// Update available countries selection based on new defaultCountries
						availableCountries = availableCountries.map((country) => ({
							...country,
							selected: defaultCountries.includes(country.id)
						}));
						updateChartData();
					}}
				/>
				<span>Mit anderen Ländern vergleichen</span>
			</label>
			{#if compareCountries}
				<div class="flex items-center gap-2 relative">
					<span class="text-sm text-gray-600">
						{selectedCountries.length} von {availableCountries.length} ausgewählt
					</span>
					<button
						id="dropdown-button"
						class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-2 border border-gray-300"
						on:click={toggleDropdown}
					>
						<span class="font-medium">Länderauswahl</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>
				</div>
			{/if}

			{#if isDropdownOpen}
				<div
					id="country-dropdown"
					class="absolute z-10 top-full right-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 max-h-80 overflow-y-auto"
					use:clickOutside={handleClickOutside}
				>
					<div class="p-2 border-b border-gray-200">
						<div class="flex justify-between items-center">
							<span class="font-medium">Länder</span>
							<div class="flex gap-2">
								<button
									class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
									on:click={selectAllCountries}
								>
									Alle
								</button>
								<button
									class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
									on:click={deselectAllCountries}
								>
									Keine
								</button>
							</div>
						</div>
					</div>
					<div class="p-2">
						{#each availableCountries as country}
							<div class="py-1">
								<label class="flex items-center gap-2 hover:bg-gray-100 p-1 rounded cursor-pointer">
									<input
										type="checkbox"
										checked={country.selected}
										on:change={() => toggleCountry(country.id)}
									/>
									<span>{country.name}</span>
								</label>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		{#if lineChartData.chartData.length > 0}
			{@const { chartData, keys, labels, colors } = lineChartData}
			<ChartLine
				data={chartData}
				{keys}
				{labels}
				{colors}
				visualisation="normal"
				unit="%"
				showAreas={keys.includes('fossil') ? true : false}
				showDots={true}
				showLegend={true}
				lineWidth={2}
				circleRadius={3}
				xTicksInterval={2}
				showTotal={false}
				maxValue={100}
				marginTop={20}
			/>
		{:else}
			<div class="flex items-center justify-center h-full">
				<p class="text-gray-500">No chart data available after transformation</p>
			</div>
		{/if}
	{:else}
		<div class="flex items-center justify-center h-full">
			<p class="text-gray-500">No data available</p>
		</div>
	{/if}
</div>
