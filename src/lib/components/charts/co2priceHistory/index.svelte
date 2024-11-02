<script>
	import Papa from 'papaparse';
	import ChartLine from '../chartLine.svelte';
	import dayjs from 'dayjs';

	let data;

	Papa.parse('https://data.klimadashboard.org/eu/ets.csv', {
		download: true,
		dynamicTyping: true,
		skipEmptyLines: true,
		header: true,
		complete: function (results) {
			if (results) {
				data = results.data.slice(-1460).map((e, i) => {
					return {
						etsPrice: e.price,
						x: i,
						label: dayjs(e.timestamp).format('DD.MM.YYYY')
					};
				});
			}
		}
	});

	const keys = ['etsPrice'];
	const labels = ['ETS Preis'];
	const colors = ['#575C75'];
</script>

{#if data}
	<div class="h-80">
		<ChartLine {data} {labels} {keys} {colors} unit={'€'} xTicksInterval={365} />
	</div>
{/if}
