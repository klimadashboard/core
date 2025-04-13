<script lang="ts">
	import { getCountries, getMobilityRenewableShare } from './getData';
	import ChartLine from '$lib/components/charts/chartLine.svelte';
	import { onMount } from 'svelte';
	import type { MobilityRenewableShare, Countries } from './schema';
	import { transformDataForChart, type LineChartData } from './transformData';
	import {
		AsyncGetMobilityRenewableShare,
		GetCountries,
		GetMobilityRenewableShare
	} from './__generated__/mobilityRenewableShare.generated';

	let loading = true;
	let error: Error | null = null;
	let data: MobilityRenewableShare = [];
	let countries: Countries = [];
	let lineChartData: LineChartData = {
		chartData: [],
		keys: [],
		labels: [],
		colors: []
	};

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

	onMount(async () => {
		try {
			loading = true;
			const [mobilityData, countriesData] = await Promise.all([
				getMobilityRenewableShare(),
				getCountries()
			]);

			data = mobilityData;
			countries = countriesData;
			lineChartData = transformDataForChart(data, countries);
		} catch (e) {
			error = e as Error;
		} finally {
			loading = false;
		}
	});

	// Test GraphQL data fetching
	$: mobilityRenewableShare = GetMobilityRenewableShare({});
	$: console.log('GraphQL mobilityRenewableShare', $mobilityRenewableShare.data.mobility);

	$: graphQLcountries = GetCountries({});
	$: console.log('GraphQL countries', $graphQLcountries.data.countries);

	// Test async GraphQL data fetching
	onMount(async () => {
		const { data: mobilityData, error, loading } = await AsyncGetMobilityRenewableShare({});
		console.log('Async mobilityRenewableShare', mobilityData, error, loading);
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
		{#if lineChartData.chartData.length > 0}
			{@const { chartData, keys, labels, colors } = lineChartData}
			<ChartLine
				data={chartData}
				{keys}
				{labels}
				{colors}
				visualisation="normal"
				unit="%"
				showAreas={false}
				showDots={true}
				showLegend={true}
				lineWidth={2}
				circleRadius={3}
				xTicksInterval={2}
				showTotal={false}
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
