<script>
    import { selectedWeatherYear, selectedStation, types } from "$lib/stores/weather";
    import Papa from "papaparse";
    import WeatherDayCard from "./WeatherDayCard.svelte";

    let selectedStationData;

    Papa.parse(
    'https://scraper.klimadashboard.at/data/zamg/stations/' + $selectedStation + '/yearly-today.csv',
    {
      download: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      header: true,
      complete: function (results) {
        if (results) {
            selectedStationData = results.data;
        }
      }
    }
    );
</script>

{#if selectedStationData}
  <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-2">
    {#each $types as type}
    <WeatherDayCard 
    key={type.key + "s"}
    title={type.label}
    description={type.description}
    color={type.color}
    icon={type.icon}
    {selectedStationData}
    />
    {/each}
  </div>
{/if}