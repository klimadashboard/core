<script>
    import { onMount } from 'svelte';
    import { fade } from "svelte/transition";

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

    

    onMount(() => {
    setInterval(function() {
      animation = !animation;
    }, 2000);
	  })

    $: chosenBudget = budgets[1];
    $: animation = false;
    $: historicalEmissions = animation ? 7949 : 8029;
    $: remainingBudget = animation ? chosenBudget.value : chosenBudget.value - yearlyEmissions;
    $: yearlyEmissions = 80;
    $: total = historicalEmissions + chosenBudget.value;

    $: arrayHistorical = Array(Math.round(historicalEmissions / 10)).fill("historical");
    $: arrayBudget = Array(Math.round(remainingBudget / 10)).fill("budget");
    $: boxes = arrayBudget.concat(arrayHistorical);
    $: console.log(boxes.length);
    $: remainingYears = Math.round(chosenBudget.value / yearlyEmissions * 10) / 10;

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

<section class="mt-4">


<div class=" text-budgetHistoric">
  <p class=" border-l-2 border-current mt-auto pl-2 pb-2 font-semibold leading-tight">
    THG-Emissionen 1750-{animation ? "2020" : "2021"} <br>{historicalEmissions} Mio. Tonnen THG
</p>

<div class="pl-1 border-l-2 border-current flex flex-wrap gap-1">
    {#each arrayHistorical as box}
        <div class="w-2 h-2 md:w-3 md:h-3 bg-current" transition:fade></div>
    {/each}
</div>
</div>

<div class="text-budgetDefault mt-2">
  
<div class="flex gap-0.5 md:gap-1 flex-wrap pl-1 border-l-2 border-current">
  {#each arrayBudget as box}
      <div class="w-2 h-2 md:w-3 md:h-3 bg-current" transition:fade></div>
  {/each}
</div>
<div class="text-current border-current border-l-2 pl-2 pt-2 leading-tight flex">
<p class="font-semibold">
  Verbleibendes Budget ab {animation ? "2021" : "2022"}<br>{remainingBudget} Mio. Tonnen THG
</p>
<p class="ml-auto max-w-2xl text-right {animation ? "text-budgetDefault" : "text-budgetHistoric"}">
  Die Animation zeigt die 80 Mio. t Treibhausgase, die Österreich aktuell jährlich ausstößt – wenn wir in dem Tempo weiter emittieren, ist unser Budget in {remainingYears} Jahren aufgebraucht.</p>
</div>
<div class="flex gap-2 items-center text-gray-500 mt-4">
  <div class="w-3 h-3 md:w-4 md:h-4 bg-current"></div>
  <div>entspricht 10 Millionen Tonnen Treibhausgasen</div>
</div>
</div>

</section>