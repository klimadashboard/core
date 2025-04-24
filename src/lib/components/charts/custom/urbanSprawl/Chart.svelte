<script>
	import ChartBar from '$lib/components/charts/chartBar.svelte';
	export let data;

	let years = [];
	let chartData = [];

	$: if (data && data.length > 0) {
		years = Array.from(new Set(data.map((d) => d.period))).sort();

		chartData = years.map((year) => {
			const yearData = data.filter((d) => d.period === year);

			const getValue = (category) =>
				parseFloat(yearData.find((d) => d.category === category)?.value ?? 0);

			return {
				x: year,
				label: year,
				categories: [
					{ label: 'Geringe Zersiedelung', value: getValue('pop1'), color: '#7fcdbb' },
					{ label: 'Mittlere Zersiedelung', value: getValue('pop2'), color: '#1d91c0' },
					{ label: 'Starke Zersiedelung', value: getValue('pop3'), color: '#253494' }
				]
			};
		});
	}
</script>

<div class="h-80 mt-4">
	<ChartBar data={chartData} visualisation="stacked" marginLeft={50} />
</div>
