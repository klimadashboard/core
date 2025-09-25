<script>
	import ChartLine from '$lib/components/charts/chartLine.svelte';
	import Papa from 'papaparse';
	import dayjs from 'dayjs';

	let rawData;

	Papa.parse('https://static.dwcdn.net/data/Qa2I3.csv', {
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

	const keys = ['wilhelmshaven', 'brunsbuettel', 'balticEnergyGate'];
	const labels = ['Wilhelmshaven', 'Brunsbüttel', 'Lubmin (Baltic Energy Gate)'];
	const colors = ['#347C86', '#575C75', '#CF6317'];

	$: data = rawData?.map((e, i) => {
		return {
			wilhelmshaven: e['Wilhelmshaven, LNG-Zone'],
			balticEnergyGate: e['Baltic Energy Gate (Port) (DE)'],
			brunsbuettel: e['BRUNSBUETTEL HAFEN (FSRU) (DE)'],
			x: i,
			label: e['periodFrom']
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
			showAreas={true}
			visualisation={'stacked'}
			xTicksInterval={100}
			unit={'GWh/Tag'}
		/>
	{/if}
</div>
