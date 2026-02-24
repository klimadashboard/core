<script>
	import { Plot, BarX, Line } from 'svelteplot';

	// data loading

	let data = [
		{
			label: 'Klimakrise',
			value: 50,
			fill: 'blue'
		},
		{
			label: 'Sicherheit',
			value: 20,
			fill: 'green'
		},
		{
			label: 'Wohlbefinden',
			value: 30,
			fill: 'red'
		}
	];

	let dataAlt = [
		{
			date: new Date('2025-01-01'),
			value: 50
		},
		{
			date: new Date('2025-01-02'),
			value: 20
		},
		{
			date: new Date('2025-01-03'),
			value: 30
		}
	];

	let selectedBar = null;
</script>

<Plot grid>
	<BarX {data} x="value" y="label" onmouseover={(e) => (selectedBar = e)} />
</Plot>

<Plot grid>
	<Line data={dataAlt} x="date" y="value" />
</Plot>

<style>
</style>
