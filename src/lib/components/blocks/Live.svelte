<script>
	import LiveCarbonPrices from '$lib/components/cards/LiveCarbonPrices.svelte';
	import LiveRenewables from '$lib/components/cards/LiveRenewables.svelte';
	import LiveCO2Concentration from '$lib/components/cards/LiveCO2Concentration.svelte';
	import LiveEmissions from '../cards/LiveEmissions.svelte';
	import LiveGasUsage from '../cards/LiveGasUsage.svelte';
	import { Splide, SplideSlide } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css/core';

	const components = [
		LiveCarbonPrices,
		LiveRenewables,
		LiveGasUsage,
		LiveEmissions,
		LiveCO2Concentration
	];
</script>

<div class="px-1">
	<Splide
		options={{
			autoWidth: true,
			gap: '0.25rem',
			pagination: false,
			arrows: false,
			type: 'loop',
			autoplay: true
		}}
	>
		{#each components as component}
			<SplideSlide class="w-1/2 md:w-1/4 bg-gray-100 p-3 rounded-2xl">
				<svelte:component this={component} />
			</SplideSlide>
		{/each}
	</Splide>
</div>
