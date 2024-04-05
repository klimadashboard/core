<script>
	import { selectedStation } from '$lib/stores/weather';
	import WeatherDays from './WeatherDays.svelte';
	import { page } from '$app/stores';

	$: if ($page.url.searchParams.get('weatherStation')) {
		$selectedStation = $page.url.searchParams.get('weatherStation');
	}
</script>

<WeatherDays selectedStation={$selectedStation} />
