<script>
	import LineChart from '../chartLine.svelte';

	// TODO: Pass in selected companies as prop and filter data based on that

	// TODO: In order to use line chart, data needs to be restructured
	export let data;
	console.log('🚀 ~ file: CompanyEmissionsChart.svelte:3 ~ data:', data);

	const labels = data.map((d) => d.Name);
	const colors = [
		'#ffd700',
		'#ffb14e',
		'#fa8775',
		'#ea5f94',
		'#cd34b5',
		'#9d02d7',
		'#0000ff',
		'#000000',
		'#000000',
		'#000000',
		'#000000',
		'#000000',
		'#000000',
		'#000000',
		'#000000',
		'#000000',
		'#000000',
		'#000000',
		'#000000',
		'#000000'
	];
	const keys = ['2015_scope1'];
</script>

<LineChart {data} {colors} {labels} />
