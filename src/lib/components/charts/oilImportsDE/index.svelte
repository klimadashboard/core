<script>
	import ChartLine from '../chartLine.svelte';
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
				rawData = results.data;
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
		<ChartLine {data} {labels} {keys} {colors} xTicksInterval={10} unit={'Tonnen'} />
	{/if}
</div>
