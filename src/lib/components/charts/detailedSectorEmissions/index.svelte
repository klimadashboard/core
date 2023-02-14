<script>
	import Chart from './Chart.svelte';

	let data = [
		{
			key: 'energy',
			value: 49929237
		},
		{
			key: 'industry',
			value: 15489292
		},
		{
			key: 'mobility',
			value: 21183028
		},
		{
			key: 'buildings',
			value: 0
		},
		{
			key: 'agriculture',
			value: 6964251
		},
		{
			key: 'waste',
			value: 0
		},
		{
			key: 'fluorinatedGases',
			value: 0
		},
		{
			key: 'memo',
			value: 0
		},
		{
			key: 'LULUCF',
			value: -100
		}
	];
</script>

{#if data}
	<Chart {data} />
{/if}
