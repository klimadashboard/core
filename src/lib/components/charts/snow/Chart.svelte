<script>
	import ChartBuilder from '$lib/components/ChartBuilder.svelte';
	import { scaleTime } from 'd3-scale';
	export let winters;

	$: console.log(winters);

	let layers = [
		{
			type: 'bar',
			label: 'Snow days',
			color: '#11998E',
			data: winters.map((d, i) => {
				return {
					x: i,
					y: d.daysWithSnow
				};
			})
		},
		{
			type: 'line',
			label: 'Snow height',
			color: '#0D22B6',
			data: winters.map((d, i) => {
				return {
					x: i,
					y: d.totalSnowAccumulation
				};
			})
		}
	];

	let config = {
		barGap: 2
	};
</script>

<ChartBuilder {layers} {config} />
