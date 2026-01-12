<script lang="ts">
	import { page } from '$app/state';
	import { formatExchangeRate, formatNumber, TARGET_YEAR, type HeatingDataPoint } from './config';

	export let data: HeatingDataPoint[];
	export let layout: 'stacked' | 'grid' = 'stacked';

	$: gasEntry = data.find((d) => d.category === 'gas');
	$: oilEntry = data.find((d) => d.category === 'heating oil');

	$: gasRate = formatExchangeRate(gasEntry?.value ?? 0);
	$: oilRate = formatExchangeRate(oilEntry?.value ?? 0);

	function getUnitLabel(unit: 'day' | 'month' | 'year'): string {
		return page.data?.translations?.[unit] ?? unit;
	}

	interface CardConfig {
		color: string;
		icon: 'flame' | 'leaf';
		label: string;
		rate: { value: number; unit: 'day' | 'month' | 'year' };
	}

	$: cards = [
		{ color: '#118BD2', icon: 'flame', label: 'Gasheizungen', rate: gasRate },
		{ color: '#9C3A03', icon: 'leaf', label: 'Ölheizungen', rate: oilRate }
	] as CardConfig[];
</script>

{#snippet exchangeCard(config: CardConfig)}
	<div
		class="rounded-xl p-4 border h-full"
		style="background-color: {config.color}10; border-color: {config.color}33;"
	>
		<div class="flex items-start gap-3">
			<div
				class="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
				style="background-color: {config.color};"
			>
				{#if config.icon === 'flame'}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path
							d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z"
						/>
					</svg>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path
							d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7h-5a8 8 0 0 0-5 2 8 8 0 0 0-5-2H2z"
						/>
						<path d="M6 11c1.5 0 3 .5 3 2-2 0-3 0-3-2z" />
						<path d="M18 11c-1.5 0-3 .5-3 2 2 0 3 0 3-2z" />
					</svg>
				{/if}
			</div>
			<div class="flex-1 min-w-0">
				<p class="text-4xl font-light tabular-nums" style="color: {config.color};">
					{formatNumber(config.rate.value)}
				</p>
				<p class="mt-1 leading-snug">
					<strong>{config.label}</strong> müssen pro
					<strong>{getUnitLabel(config.rate.unit)}</strong>
					getauscht werden, um bis {TARGET_YEAR} die Klimaziele einzuhalten.
				</p>
			</div>
		</div>
	</div>
{/snippet}

{#if layout === 'stacked'}
	<div class="flex flex-col gap-3">
		{#each cards as card}
			{@render exchangeCard(card)}
		{/each}
	</div>
{:else}
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
		{#each cards as card}
			{@render exchangeCard(card)}
		{/each}
	</div>
{/if}
