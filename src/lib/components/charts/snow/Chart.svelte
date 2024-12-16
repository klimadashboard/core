<script>
	import BarChart from '$lib/components/charts/chartBar.svelte';
	import { scaleTime } from 'd3-scale';
	export let winters;

	$: console.log(winters);

	let layers = [
		{
			type: 'bar',
			label: 'Snow days',
			color: '#11998E',
			unit: 'Tage',
			data: winters.map((d, i) => {
				return {
					x: i,
					y: d.daysWithSnow
				};
			})
		}
		/*
		{
			type: 'line',
			label: 'Snow height',
			color: '#0D22B6',
			unit: 'cm',
			data: winters.map((d, i) => {
				return {
					x: i,
					y: d.totalSnowAccumulation
				};
			})
		}
            */
	];

	let config = {
		barGap: 2
	};
</script>

<div class="h-80">
	<BarChart
		data={winters.map((d, i) => {
			return {
				label: d.label,
				categories: [
					{
						value: d.daysWithSnow,
						label: 'Schneedeckentage im ' + d.label,
						color: '#11998E'
					}
				]
			};
		})}
		xAxixInterval={10}
		visualisation={'stacked'}
		unit={'Schneedeckentage'}
	/>
</div>
