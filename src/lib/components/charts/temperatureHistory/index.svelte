<script>
    import { selectedWeatherYear, selectedStation, types } from "$lib/stores/weather";
    import Loader from "$lib/components/Loader.svelte";
    import Chart from "./Chart.svelte";

    $: showDays = false;

    async function getDataForSelectedStation(stationId) {
    let response = await fetch('https://data.klimadashboard.org/at/zamg/tempdays/stations/' + stationId + '.json');
    let data = await response.json();
    if (response.ok) {
    return data;
	  } else {
	  throw new Error(data);
	}
  }

  $: promise = getDataForSelectedStation($selectedStation || 105);

</script>

<div class="my-4 flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
    <label class="flex items-center gap-2">
    <input type="checkbox" bind:checked={showDays}>
    <span>Einzelne Tage für das aktuelle Jahr anzeigen?</span>
    </label>
  
    <label class="{showDays ? "opacity-50 pointer-events-none" : ""} flex items-center gap-2">
      <input type="range" min={1960} max={new Date().getFullYear()} bind:value={$selectedWeatherYear}>
      <span>{$selectedWeatherYear}</span>
    </label>
</div>

{#await promise}
<Loader />
{:then selectedStationData}
<Chart {selectedStationData} types={$types} {showDays} />
{:catch error}
Error
{/await}