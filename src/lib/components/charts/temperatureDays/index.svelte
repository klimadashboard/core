<script>
    import { selectedStation } from "$lib/stores/weather";
    import WeatherDays from "./WeatherDays.svelte";
</script>

<WeatherDays
selectedStation={$selectedStation}
/>