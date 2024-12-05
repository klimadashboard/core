<script>
	export let chart;

	const chartComponents = import.meta.glob('./*/index.svelte', {
		import: 'default',
		eager: true
	});

	let ChartComponent;

	$: getChart = async function () {
		ChartComponent = await chartComponents['./' + chart.custom_sveltestring + '/index.svelte'];
	};

	$: promise = getChart();

	const createVariables = function (input) {
		if (input) {
			const variable = {};
			for (var i = 0; i < input.length; i++) {
				variable[input[i].label] = input[i].text;
			}
			return variable;
		} else {
			return '';
		}
	};
</script>

{#await promise then}
	<svelte:component this={ChartComponent} v={createVariables(chart.variables)} />
{:catch error}
	{error}
{/await}
