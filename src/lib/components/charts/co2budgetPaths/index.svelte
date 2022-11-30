<script>
    import Papa from "papaparse";
    import Chart from "./Chart.svelte";

    export let v;

    let budgets = [{
      value: 510,
      probability: 50,
      temperature: 1.5,
      type: "THG"
    }, {
      value: 280,
      probability: 66,
      temperature: 1.5,
      type: "THG"
    }, {
      value: 610,
      probability: 50,
      temperature: 1.65,
      type: "THG"
    }, {
      value: 340,
      probability: 66,
      temperature: 1.65,
      type: "THG"
    }];

    let dataPaths;
    let dataHistoric;

    Papa.parse(
    '../data/scenarios_co2budget.csv',
    {
      download: true,
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        if (results) {
          dataPaths = results.data;
        }
      }
    }
    );

    Papa.parse(
    '../data/historic_emissions.csv',
    {
      download: true,
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        if (results) {
          dataHistoric = results.data;
        }
      }
    }
    );

    $: selectedStartYear = containerWidth > 1000 ? 1990 : 2000;

    $: chosenBudget = budgets.find(d => d.temperature == chosenTemperature && d.probability == chosenProbability).value;
    $: chosenTemperature = 1.5;
    $: chosenProbability = 66;
    
    $: console.log(dataHistoric);
    $: console.log(dataPaths);

    $: containerWidth = 0;
</script>


<div class="relative" bind:clientWidth={containerWidth}>
  <div id="switch" class="flex flex-wrap gap-4 items-center">
    <div class="flex gap-2 items-center bg-gray-100 rounded-full py-1 px-3">
    <label class="flex items-center gap-1 {chosenProbability == 66 ? "font-bold" : ""}">
    <input type="radio" value={66} bind:group={chosenProbability}>
    <span>66%</span>
    </label>
    <label class="flex items-center gap-1 {chosenProbability == 50 ? "font-bold" : ""}">
    <input type="radio" value={50} bind:group={chosenProbability}>
    <span>50%</span>
    </label>
    <span class="font-bold">Wahrscheinlichkeit</span>
    </div>
    <div>
    <div class="flex gap-2 items-center bg-gray-100 rounded-full py-1 px-3">
    <label class="flex items-center gap-1 {chosenTemperature == 1.5 ? "font-bold" : ""}">
    <input type="radio" name="goal" value={1.5} bind:group={chosenTemperature}>
    <span>1,5°C</span>
    </label>
    <label class="flex items-center gap-1 {chosenTemperature == 1.65 ? "font-bold" : ""}">
    <input type="radio" name="goal" value={1.65} bind:group={chosenTemperature}>
    <span>1,65°C (1,5°C langfristig)</span>
    </label>
    <span class="font-bold">Zieltemperatur</span>
    </div>
    </div>
    <p><b>= {chosenBudget} Mio. t. Budget verbleiben</b> ab 2022</p>
  </div>
</div>

{#if dataHistoric && dataPaths}
<Chart {dataHistoric} {dataPaths} {chosenBudget} {selectedStartYear} />
{/if}

<div id="settings" class="flex items-center gap-2 text-sm mt-2 md:mt-0">
  <span>Startjahr auswählen</span>
  <input type="number" min=1990 max=2021 bind:value={selectedStartYear} class="px-3 py-1 w-20 bg-gray-100 rounded-full">
</div>