<script>
	import LineChart from '../chartLine.svelte';
	import Papa from 'papaparse';
	import Loader from '$lib/components/Loader.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	let rawData;
	let unit;

	Papa.parse(
		'https://data.klimadashboard.org/' +
			PUBLIC_VERSION +
			'/emissions/emissions_consumption_based.csv',
		{
			download: true,
			dynamicTyping: true,
			header: true,
			skipEmptyLines: true,
			complete: function (results) {
				if (results) {
					rawData = results.data;
					unit = rawData[0].unit;
				}
			}
		}
	);

	const keys = ['consumption_based', 'production_based'];
	const colors = ['#E59E1A', '#4DB263'];
	const labels = ['Konsumbasiert', 'Produktionsbasiert'];

	$: dataset = rawData?.map((entry, i) => {
		return {
			...entry,
			x: i,
			label: entry.year
		};
	});
</script>

<div class="h-80">
	{#if dataset}
		<LineChart
			data={dataset}
			{keys}
			{labels}
			{colors}
			unit={'t ' + unit}
			showPulse={'consumption_based'}
			showTotal={false}
			preselectedIndex={30}
			showZeroValuesInLegend={false}
			marginTop={PUBLIC_VERSION == 'at' ? 0 : 10}
		/>
	{:else}
		<Loader />
	{/if}
</div>
