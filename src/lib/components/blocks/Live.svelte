<script>
	import LiveCarbonPrices from '$lib/components/cards/LiveCarbonPrices.svelte';
	import LiveRenewables from '$lib/components/cards/LiveRenewables.svelte';
	import LiveCO2Concentration from '$lib/components/cards/LiveCO2Concentration.svelte';
	import LiveEmissions from '../cards/LiveEmissions.svelte';
	import LiveGasUsage from '../cards/LiveGasUsage.svelte';
	import { Splide, SplideSlide } from '@splidejs/svelte-splide';

	const components = [
		LiveCarbonPrices,
		LiveRenewables,
		LiveGasUsage,
		LiveEmissions,
		LiveCO2Concentration
	];
</script>

<div class="px-2 py-4">
	<Splide options={{ autoWidth: true, gap: '0', pagination: false, arrows: false, type: 'loop' }}>
		{#each components as component}
			<SplideSlide class="w-1/2 md:w-1/4 px-2">
				<svelte:component this={component} />
			</SplideSlide>
		{/each}
	</Splide>
</div>
