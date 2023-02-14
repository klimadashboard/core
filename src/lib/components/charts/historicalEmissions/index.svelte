<script>
	import LineChart from '../chartLine.svelte';
	import Papa from 'papaparse';

	$: rawData = [];
	$: readMore = false;

	let chartWidth;

	Papa.parse(
		'https://data.klimadashboard.org/at/emissions/AT_Historical-Emissions_PIK-PRIMAP.csv',
		{
			download: true,
			dynamicTyping: true,
			header: true,
			skipEmptyLines: true,
			complete: function (results) {
				if (results) {
					rawData = results.data.filter((d) => d.year > 1799);
				}
			}
		}
	);

	const keys = ['energy', 'industry', 'agriculture', 'waste', 'other'];
	const labels = ['Energie', 'Industrie', 'Landwirtschaft', 'Abfall', 'Andere'];
	const colors = ['#BD3737', '#373949', '#65987D', '#B7693D', '#A4A4A4'];

	$: dataset = rawData?.map((entry, i) => {
		return {
			x: i,
			label: entry.year,
			energy: Math.round(entry.energy_ipc1_Mt_CO2e * 100) / 100,
			industry: Math.round(entry.industrial_processes_and_product_use_ipc2_Mt_CO2e * 100) / 100,
			waste: Math.round(entry.waste_ipc4_Mt_CO2e * 100) / 100,
			agriculture: Math.round(entry.agriculture_and_livestock_ipcmag_Mt_CO2e * 100) / 100,
			other: Math.round(entry.other_ipc5_Mt_CO2e * 100) / 100
			// total: entry.energy_ipc1_Mt_CO2e + entry.industrial_processes_and_product_use_ipc2_Mt_CO2e + entry.waste_ipc4_Mt_CO2e + entry.agriculture_and_livestock_ipcmag_Mt_CO2e + entry.other_ipc5_Mt_CO2e
		};
	});

	let lastYear;
	let lastYearEmissions;
	$: if (dataset.length > 0) {
		lastYear = dataset[dataset.length - 1].label;
		lastYearEmissions =
			dataset[dataset.length - 1].energy +
			dataset[dataset.length - 1].industry +
			dataset[dataset.length - 1].waste +
			dataset[dataset.length - 1].agriculture +
			dataset[dataset.length - 1].other;
	}
</script>

<div class="h-80">
	<div bind:clientWidth={chartWidth} />
	{#if dataset.length > 0}
		<LineChart
			showAreas={true}
			data={dataset}
			{keys}
			{labels}
			{colors}
			lineWidth="2"
			xTicksInterval={chartWidth > 600 ? 10 : 50}
			visualisation="stacked"
			unit=" Mio t THG"
		/>
	{/if}
</div>
