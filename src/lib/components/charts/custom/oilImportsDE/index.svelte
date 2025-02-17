<script>
	import LineChart from '$lib/components/charts/chartLine.svelte';
	import Papa from 'papaparse';
	import dayjs from 'dayjs';

	let rawData;

	Papa.parse('https://data.klimadashboard.org/de/energy/fossil/oil_imports-destatis.csv', {
		download: true,
		dynamicTyping: true,
		header: true,
		skipEmptyLines: true,
		complete: function (results) {
			if (results) {
				rawData = results.data.sort((a, b) => a.Jahr - b.Jahr);
			}
		}
	});

	const keys = ['Tonnen'];
	const labels = ['Importe'];
	const colors = ['#575C75'];

	$: data = rawData?.map((e, i) => {
		return {
			...e,
			x: i,
			label: e.Jahr
		};
	});
</script>

<div class="h-80">
	{#if data}
		<LineChart
			{data}
			{labels}
			{keys}
			{colors}
			xTicksInterval={10}
			unit={'Tonnen'}
			showTotal={false}
		/>
	{/if}
</div>
