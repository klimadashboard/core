<script>
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

    $: chosenBudget = budgets[1];
    let historicalEmissions = 8029;
    $: total = historicalEmissions + chosenBudget.value;
</script>

<div class="relative text-gray-600 max-w-sm">
    <svg xmlns="http://www.w3.org/2000/svg" class="absolute pointer-events-none top-3 h-6 right-2 transform -translate-y-0.5 icon-tabler-selector" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <polyline points="8 9 12 5 16 9"></polyline>
      <polyline points="16 15 12 19 8 15"></polyline>
    </svg>
    <select name="budget" bind:value={chosenBudget} class="block appearance-none w-full bg-gray-200 border border-gray-100   py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 max-w-sm">
    {#each budgets as budget}
    <option value={budget}>
        {budget.temperature}°C bei {budget.probability}% Wahrscheinlichkeit
    </option>
    {/each}
</select>
</div>

<div class="grid grid-cols-6 mt-4">
<div class="flex flex-col h-64 md:col-span-4">
    <div class="bg-red-700 relative"
    style="height: {chosenBudget.value / total * 100}%">
    </div>
    <div class="bg-yellow-500 relative"
    style="height: {historicalEmissions / total * 100}%">
    </div>
</div>
<div class="col-span-4 md:col-span-2 flex flex-col">
    <p class="border-t border-t-red-700 text-red-700 pl-2 pt-2 leading-tight">
        Verbleibendes Budget<br>{chosenBudget.value} Mio. Tonnen THG
    </p>
    <p class="border-b border-yellow-500 text-yellow-500 mt-auto pl-2 pb-2 leading-tight">
        Bisherige THG-Emissionen<br>{historicalEmissions} Mio. Tonnen THG
    </p>
</div>
</div>