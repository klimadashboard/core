<script>
	import Papa from 'papaparse';

	export let v;

	let gasDaily;
	const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
	const firstDate = new Date(2022, 12, 31);
	const secondDate = new Date(2040, 1, 1);

	const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));

	Papa.parse(
		'https://data.klimadashboard.org/at/heating-systems/klimadashboard_AT_heatingSystems_timeline.csv',
		{
			download: true,
			dynamicTyping: true,
			header: true,
			skipEmptyLines: true,
			complete: function (results) {
				if (results) {
					gasDaily =
						results.data.find((d) => d.region == 'Austria' && d.year == 2022).gas_sum / diffDays;
				}
			}
		}
	);
</script>

<div class="flex flex-col">
	<div class="flex space-x-4 items-end">
		<div class="-mb-1">
			<p class="text-8xl font-extralight tracking-tighter">{Math.round(gasDaily)}</p>
			<p class="font-medium -mt-2">{v.label}</p>
		</div>
	</div>
	<div />
</div>
