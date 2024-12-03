<script>
	import ChartBuilder from '$lib/components/ChartBuilder.svelte';
	import { scaleTime } from 'd3-scale';
	export let data;

	let layers = [
		{
			type: 'bar',
			label: 'Snow days',
			data: data
		},
		{
			type: 'line',
			label: 'Snow height',
			data: data
		}
	];

	let config = [
		{
			scale: scaleTime
		}
	];
</script>

<ChartBuilder {layers} {config} />
