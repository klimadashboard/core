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
  <div id="switch" class="flex flex-wrap gap-4 items-center text-sm">
    <div class="flex gap-2 items-center bg-gray-100 rounded-full py-1 px-3">
    <label class="flex items-center gap-1 {chosenProbability == 66 ? "font-bold" : ""}">
    <input type="radio" value={66} bind:group={chosenProbability}>
    <span>66%</span>
    </label>
    <label class="flex items-center gap-1 {chosenProbability == 50 ? "font-bold" : ""}">
    <input type="radio" value={50} bind:group={chosenProbability}>
    <span>50%</span>
    </label>
    <span class="font-bold">Eintrittswahrscheinlichkeit</span>
    </div>
    <div>
    <div class="flex gap-2 items-center bg-gray-100 rounded-full py-1 px-3">
    <label class="flex items-center gap-1 {chosenTemperature == 1.5 ? "font-bold" : ""}">
    <input type="radio" name="goal" value={1.5} bind:group={chosenTemperature}>
    <span>+1,5°C</span>
    </label>
    <label class="flex items-center gap-1 {chosenTemperature == 1.65 ? "font-bold" : ""}">
    <input type="radio" name="goal" value={1.65} bind:group={chosenTemperature}>
    <span>+1,5°C (zwischenzeitlich 1.65°C)</span>
    </label>
    <span class="font-bold">Temperaturlimit</span>
    </div>
    </div>
    <p><b>= {chosenBudget} Mio. t. THG-Budget verbleiben</b> ab 2022</p>
  </div>
</div>

{#if dataHistoric && dataPaths}
<Chart {dataHistoric} {dataPaths} {chosenBudget} {selectedStartYear} />
{/if}

<div id="settings" class="flex items-center gap-2 text-sm mt-2 md:mt-0">
  <span>Startjahr auswählen</span>
  <input type="number" min=1990 max=2021 bind:value={selectedStartYear} class="px-3 py-1 w-20 bg-gray-100 rounded-full">
</div>

{#if chosenProbability == 50 || chosenTemperature == 1.65}
<div class="flex text-sm text-budgetDefault items-center space-x-2">
  <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 icon icon-tabler icon-tabler-alert-triangle" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
    <path d="M12 9v2m0 4v.01"></path>
    <path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75"></path>
 </svg>
<div class="max-w-2xl">
{#if chosenProbability == 50}
  <p class="mt-2 ">{v.disclaimerProbability}</p>
{/if}
{#if chosenTemperature == 1.65}
  <p class="mt-2">{v.disclaimerTemperature}</p>
{/if}
</div>
</div>
{/if}