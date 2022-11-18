<script>
    import { onMount } from 'svelte';
    import { fade } from "svelte/transition";
    import Papa from "papaparse";
    import formatNumber from "$lib/stores/formatNumber";

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

    $: historicalEmissions = [];

    Papa.parse(
    'https://data.klimadashboard.org/at/emissions/AT_Historical-Emissions_PIK-PRIMAP.csv',
    {
      download: true,
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        if (results) {
          historicalEmissions = results.data;
        }
      }
    }
    );

    $: chosenBudget = budgets[1];
    $: totalHistoricalEmissions = historicalEmissions
    .filter(d => d.year <= endYear && d.year >= startYear)
    .reduce((a,b) => a + b.total_AR4_Mt_CO2e, 0);
    $: remainingBudget = chosenBudget.value;
    $: yearlyEmissions = 80;

    $: arrayHistorical = Array(Math.round(totalHistoricalEmissions / 10)).fill("historical");
    $: arrayBudget = Array(Math.round(remainingBudget / 10)).fill("budget");
    $: arrayCurrent = Array(Math.round(yearlyEmissions / 10)).fill("current");
    $: remainingYears = Math.round(chosenBudget.value / yearlyEmissions * 10) / 10;
    $: startYear = 1750;
    $: endYear = 2021;

    $: playing = false;

    const iterate = function() {
      var interval = setInterval(function(){ 
      if(endYear > 2020) {
        playing = false;
        clearInterval(interval);
      } else {
        endYear = Math.min(endYear + 10,2021);
      }
      }, 1000);
    }

    $: if(playing) {
      endYear = 1800;
      iterate();  
    }

</script>

<section class="max-w-2xl mx-auto text-xl px-4 md:px-0">
  <p class="text-budgetHistoric max-w-lg leading-tight">
    {#if endYear == 2021}
    In den letzten {endYear - startYear + 1} Jahren hat Österreich <nobr>{formatNumber(Math.round(totalHistoricalEmissions))} Mio. Tonnen</nobr> Treibhausgase ausgestoßen.
    {:else}
    In den {endYear - startYear} Jahren zwischen {startYear} und {endYear} hat Österreich <nobr>{formatNumber(Math.round(totalHistoricalEmissions))} Mio. Tonnen Treibhausgase</nobr> ausgestoßen.
    {/if}
  </p>

  <div class="flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-500 mt-2 -translate-x-0.5">
  <div class="flex gap-2 items-center">
    <button on:mousedown={() => playing = !playing}>
      {#if !playing}
      <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-player-play" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
        <path d="M7 4v16l13 -8z"></path>
     </svg>
     {/if}
    </button>
    <input type="number" class="w-14 bg-gray-100 p-1" bind:value={startYear} min={1750} max={Math.min(endYear, 2020)}>
    <span>–</span>
    <input type="number" class="w-14 bg-gray-100 p-1" bind:value={endYear} min={Math.max(1800, startYear)} max={2021}>
  </div>

  <div class="flex gap-2 items-center">
    <div>1 Kasten entspricht 10 Mio. t Treibhausgasen</div>
    <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-current"></div>
  </div>

  </div>

  <div class="grid gap-1 mx-auto mt-2 text-budgetHistoric budget-grid">
    {#each arrayHistorical as box}
        <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-current" transition:fade></div>
    {/each}
  </div>

  <p class="mt-6 text-budgetDefault leading-tight">Ab 2022 verbleiben nur noch {remainingBudget} Millionen Tonnen, um das Pariser Klimaabkommen mit einer Erderhitzung von +1.5°C einzuhalten.</p>

  <div class="relative text-gray-600 text-sm mt-2">
    <svg xmlns="http://www.w3.org/2000/svg" class="absolute pointer-events-none top-1 right-0 h-4" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <polyline points="8 9 12 5 16 9"></polyline>
      <polyline points="16 15 12 19 8 15"></polyline>
    </svg>
    <select name="budget" bind:value={chosenBudget} class="block appearance-none w-full leading-tight focus:outline-none focus:bg-gray-200 focus:border-gray-500 bg-gray-100 py-1 px-2">
    {#each budgets as budget}
    <option value={budget}>
        {#if budget.temperature == 1.65}
        1,5 °C mit zwischenzeitlich 1,65°C bei {budget.probability}% Eintrittswahrscheinlichkeit
        {:else}
        1,5 °C bei {budget.probability}% Eintrittswahrscheinlichkeit
        {/if}
    </option>
    {/each}
</select>

</div>

  <div class="grid gap-1 mx-auto mt-2 text-budgetDefault budget-grid">
    {#each arrayBudget as box}
        <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-current" transition:fade></div>
    {/each}
  </div>

  {#if chosenBudget.probability == 50}
  <p class="mt-2 text-sm text-budgetDefault">Wenn das Temperaturziel nur mit 50%-iger Wahrscheinlichkeit erreicht werden soll, ist das verbleibende Budget zwar größer, die Einhaltung aber auch unwahrscheinlicher.</p>
  {/if}
  {#if chosenBudget.temperature == 1.65}
  <p class="mt-2 text-sm text-budgetDefault">Das Budget mit zwischenzeitlich +1,65°C ist zwar größer, aber auch riskanter: denn jedes Zehntel Grad Erderhitzung gefährdet mehr Menschenleben durch das immer wahrscheinlich werdende Überschreiten irreversibler Kipp-Punkte.</p>
  {/if}

  <p class="mt-6 leading-tight text-budgetDark">In dem aktuellen Tempo ist unser Budget <nobr>in {remainingYears.toString().replace(".",",")} Jahren aufgebraucht.</nobr></p>

  <div class="grid gap-1 mx-auto mt-2 text-budgetDark budget-grid">
    {#each arrayCurrent as box}
        <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-current" transition:fade></div>
    {/each}
        <div class="text-sm -translate-y-1" style="grid-column: span 24 / span 24;">80 Mio. Tonnen hat Österreich im Jahr 2021 emittiert</div>
  </div>

  <div class="border-t pt-1 mt-6 text-gray-600 border-current text-sm">
    <p>
      Quellen:
      <br>
      Historische Emissionen: <a href="https://www.zenodo.org/record/7179775#.Y25UcOSZNPY" class="underline">Gütschow, J.; Pflüger, M. (2022): PRIMAP-hist v2.4 (1750-2021). zenodo.</a>
      <br>
      Treibhausgasbudget: <a href="https://ccca.ac.at/thg-budget" class="underline">CCCA (2022): 1,5° C: Wieviel Treibhausgase dürfen wir noch emittieren?</a>
      <br>
      Emissionen 2021: <a href="https://wegccloud.uni-graz.at/s/65GyKoKtq3zeRea" class="underline">Nowcast des Wegener Centers - Universität Graz (Datenstand Juli 2022)</a>
    </p>
  </div>
</section>

<style>
  .budget-grid {
    grid-template-columns: repeat(40, minmax(0, 1fr));
  }
</style>