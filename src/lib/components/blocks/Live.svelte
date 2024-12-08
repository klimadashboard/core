<script>
	import LiveCarbonPrices from '$lib/components/cards/LiveCarbonPrices.svelte';
	import LiveRenewables from '$lib/components/cards/LiveRenewables.svelte';
	import LiveCO2Concentration from '$lib/components/cards/LiveCO2Concentration.svelte';
</script>

<div class="p-4">
	<ul class="grid gap-4 grid-cols-2 md:grid-cols-4">
		<LiveCarbonPrices />
		<LiveRenewables />
		<LiveCO2Concentration />
	</ul>
</div>
