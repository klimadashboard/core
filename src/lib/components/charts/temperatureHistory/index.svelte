<script>
    import { selectedStation, types } from "$lib/stores/weather";
    import Loader from "$lib/components/Loader.svelte";
    import Chart from "./Chart.svelte";
    import Papa from "papaparse";

    $: showDays = false;
    let maxYear;
    $: selectedYear = 0;

    async function getDataForSelectedStation(stationId) {
    let response = await fetch('https://data.klimadashboard.org/at/zamg/tempdays/stations/' + stationId + '.json');
    let data = await response.json();
    if (response.ok) {
    maxYear = new Date(data.timestamps[data.timestamps.length - 1]).getFullYear();
    selectedYear = maxYear;
    return data;
	  } else {
	  throw new Error(data);
	}
  }

  $: promise = getDataForSelectedStation($selectedStation || 105);

  $: selectedStationName = "station";

  $: Papa.parse(
        'https://data.klimadashboard.org/at/zamg/stations.csv',
        {
          download: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          header: true,
          complete: function (results) {
            if (results) {
                selectedStationName = results.data.find(d => d.id == $selectedStation).name;
            }
          }
        }
    );
</script>

<div class="my-4 flex items-center gap-6 text-sm text-gray-600">
    <label class="flex items-center gap-2">
    <input type="checkbox" bind:checked={showDays}>
    <span>Einzelne Tage für das aktuelle Jahr anzeigen?</span>
    </label>
  
    <label class="{showDays ? "opacity-50 pointer-events-none" : ""} flex items-center gap-2">
      <input type="range" min={1960} max={maxYear} bind:value={selectedYear}>
      <span>{selectedYear}</span>
    </label>

    <p>ID{$selectedStation} – {selectedStationName}</p>
</div>

{#await promise}
<Loader />
{:then selectedStationData}
<Chart {selectedStationData} types={$types} {showDays} {maxYear} bind:selectedYear={selectedYear} />
{:catch error}
Error
{/await}