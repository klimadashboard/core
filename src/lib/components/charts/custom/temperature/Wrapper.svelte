<script>
	import WeatherDays from './WeatherDays.svelte';
	import Comparison from './Comparison.svelte';
	import Records from './Records.svelte';

	export let data;
	export let selectedStation;
</script>

{#if data}
	<WeatherDays {data} {selectedStation} />

	<Comparison {data} {selectedStation} />

	<Records {data} {selectedStation} />
{/if}
