<script>
	import LineChart from '$lib/components/charts/chartLine.svelte';
	import Papa from 'papaparse';
	import dayjs from 'dayjs';

	let rawData;

	Papa.parse('https://data.klimadashboard.org/de/energy/fossil/gas_imports-bundesnetzagentur.csv', {
		download: true,
		dynamicTyping: true,
		header: true,
		skipEmptyLines: true,
		complete: function (results) {
			if (results) {
				rawData = results.data;
			}
		}
	});

	const keys = [
		'Tschechien',
		'Niederlande',
		'Belgien',
		'Polen',
		'Norwegen',
		'Dänemark',
		'Frankreich',
		'Österreich',
		'Schweiz',
		'Russland',
		'LNG',
		'Deutschland Import'
	];
	const labels = [
		'Tschechien',
		'Niederlande',
		'Belgien',
		'Polen',
		'Norwegen',
		'Dänemark',
		'Frankreich',
		'Österreich',
		'Schweiz',
		'Russland',
		'LNG',
		'Deutschland Import'
	];
	const colors = [
		'#4e79a7',
		'#f28e2c',
		'#e15759',
		'#76b7b2',
		'#59a14f',
		'#edc949',
		'#af7aa1',
		'#ff9da7',
		'#9c755f',
		'#bab0ab',
		'#8CAED9',
		'#A56BC8',
		'#072F58'
	];

	$: data = rawData?.splice(rawData.length - 365).map((e, i) => {
		return {
			...e,
			x: i,
			label: e['                     .']
		};
	});
</script>

<div class="h-80">
	{#if data}
		<LineChart
			showZeroValuesInLegend={false}
			{data}
			{labels}
			{keys}
			{colors}
			xTicksInterval={52}
			unit={'GWh/Tag'}
			showTotal={false}
		/>
	{/if}
</div>
