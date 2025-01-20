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
			perPage: 4,
			gap: '0.25rem',
			pagination: false,
			arrows: false,
			type: 'loop',
			autoplay: true,
			breakpoints: {
				1000: {
					perPage: 2
				}
			}
		}}
	>
		{#each components as component}
			<SplideSlide class="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl">
				<svelte:component this={component} />
			</SplideSlide>
		{/each}
	</Splide>
</div>
