<script lang="ts">
	import ExchangeCard from './ExchangeCard.svelte';
	import { formatExchangeRate, getTargetYear, type HeatingDataPoint } from './config';

	export let data: HeatingDataPoint[];
	export let layout: 'stacked' | 'grid' = 'stacked';
	export let country: string | undefined = undefined;

	$: targetYear = getTargetYear(country);
	$: gasEntry = data.find((d) => d.category === 'gas');
	$: oilEntry = data.find((d) => d.category === 'heating oil');
</script>

<div class={layout === 'stacked' ? 'grid grid-rows-[1fr_1fr] gap-3 h-full' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
	<ExchangeCard
		color="#118BD2"
		icon="flame"
		label="Gasheizungen"
		rate={formatExchangeRate(gasEntry?.value ?? 0, country)}
		{targetYear}
	/>
	<ExchangeCard
		color="#9C3A03"
		icon="drop"
		label="Ölheizungen"
		rate={formatExchangeRate(oilEntry?.value ?? 0, country)}
		{targetYear}
	/>
</div>
