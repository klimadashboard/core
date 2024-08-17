<script>
	import WeatherDays from './WeatherDays.svelte';
	import YearlyAverages from './YearlyAverages.svelte';
	import Comparison from './Comparison.svelte';

	export let data;
	export let selectedStation;
</script>

{#if data}
	<WeatherDays {data} {selectedStation} />

	<YearlyAverages {data} {selectedStation} />

	<Comparison {data} {selectedStation} />
{/if}
