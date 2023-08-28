<script>
	import ChartLine from '../chartLine.svelte';
	import Papa from 'papaparse';

	let rawData;

	Papa.parse('https://data.klimadashboard.org/de/energy/fossil/gas_usage-bundesnetzagentur.csv', {
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

	const keys = ['2021', '2022', '2023'];
	const labels = ['2021', '2022', '2023'];
	const colors = ['#BBE5CC', '#7CBAB3', '#347C86'];

	$: data = rawData?.map((e) => {
		return {
			x: e['.'] - 1,
			2021: e['2021'],
			2022: e['2022'],
			2023: e['2023'],
			label: 'KW' + e['.']
		};
	});
</script>

<div class="h-80">
	{#if data}
		<ChartLine
			{data}
			{labels}
			{keys}
			{colors}
			preselectedIndex={32}
			unit={'GWh/Tag'}
			showTotal={false}
			showPulse={'2023'}
		/>
	{/if}
</div>
