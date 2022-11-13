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

<select name="budget">

</select>

<div class="border flex h-24 mt-4">
    <div class="bg-yellow-500 h-full relative"
    style="width: {historicalEmissions / total * 100}%">
    <p class="absolute top-2 left-2 text-white leading-tight">Bisherige THG-Emissionen<br>{historicalEmissions}</p>
    </div>
    <div class="bg-red-500 h-full relative"
    style="width: {chosenBudget.value / total * 100}%">
    <p class="absolute top-2 left-2 text-white leading-tight">Verbleibendes Budget<br>{chosenBudget.value}</p>
    </div>
</div>