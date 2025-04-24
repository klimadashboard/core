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
				categories: [
					{ label: 'pop1', value: getValue('pop1'), color: '#11998E' },
					{ label: 'pop2', value: getValue('pop2'), color: '#0D22B6' },
					{ label: 'pop3', value: getValue('pop3'), color: '#01A2D1' }
				]
			};
		});
	}
</script>

<div class="h-80">
	<ChartBar data={chartData} visualisation="stacked" />
</div>
