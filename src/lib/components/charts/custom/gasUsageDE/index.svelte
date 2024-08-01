<script>
	import LineChart from '$lib/components/charts/chartLine.svelte';
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

	const keys = ['2022', '2023', '2024'];
	const labels = ['2022', '2023', '2024'];
	const colors = ['#BBE5CC', '#7CBAB3', '#347C86'];

	$: data = rawData?.map((e) => {
		return {
			x: e['                     .'] - 1,
			2022: e['2022'],
			2023: e['2023'],
			2024: e['2024'],
			label: 'KW' + e['                     .']
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
			preselectedIndex={data.filter((d) => d[2024] !== null).slice(-1)[0].x}
			unit={'GWh/Tag'}
			showTotal={false}
			showPulse={'2024'}
		/>
	{/if}
</div>
