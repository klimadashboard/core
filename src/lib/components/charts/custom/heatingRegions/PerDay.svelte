<script lang="ts">
	import { page } from '$app/state';
	import {
		formatExchangeRate,
		formatNumber,
		TARGET_YEAR,
		type HeatingDataPoint
	} from './config';

	export let data: HeatingDataPoint[];

	$: gasEntry = data.find((d) => d.category === 'gas');
	$: oilEntry = data.find((d) => d.category === 'heating oil');

	$: gasRate = formatExchangeRate(gasEntry?.value ?? 0);
	$: oilRate = formatExchangeRate(oilEntry?.value ?? 0);

	function getUnitLabel(unit: 'day' | 'month' | 'year'): string {
		return page.data?.translations?.[unit] ?? unit;
	}
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
	<div class="bg-[#118BD2]/10 dark:bg-[#118BD2]/20 rounded-xl p-4 border border-[#118BD2]/20">
		<div class="flex items-start gap-3">
			<div
				class="w-10 h-10 rounded-lg bg-[#118BD2] flex items-center justify-center text-white flex-shrink-0"
			>
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
					<path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z" />
				</svg>
			</div>
			<div class="flex-1">
				<p class="text-4xl font-light tabular-nums text-[#118BD2]">
					{formatNumber(gasRate.value)}
				</p>
				<p class="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-snug">
					<strong>Gasheizungen</strong> müssen pro <strong>{getUnitLabel(gasRate.unit)}</strong> getauscht
					werden, um bis {TARGET_YEAR} die Klimaziele einzuhalten.
				</p>
			</div>
		</div>
	</div>

	<div class="bg-[#9C3A03]/10 dark:bg-[#9C3A03]/20 rounded-xl p-4 border border-[#9C3A03]/20">
		<div class="flex items-start gap-3">
			<div
				class="w-10 h-10 rounded-lg bg-[#9C3A03] flex items-center justify-center text-white flex-shrink-0"
			>
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
					<path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7h-5a8 8 0 0 0-5 2 8 8 0 0 0-5-2H2z" />
					<path d="M6 11c1.5 0 3 .5 3 2-2 0-3 0-3-2z" />
					<path d="M18 11c-1.5 0-3 .5-3 2 2 0 3 0 3-2z" />
				</svg>
			</div>
			<div class="flex-1">
				<p class="text-4xl font-light tabular-nums text-[#9C3A03]">
					{formatNumber(oilRate.value)}
				</p>
				<p class="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-snug">
					<strong>Ölheizungen</strong> müssen pro <strong>{getUnitLabel(oilRate.unit)}</strong> getauscht
					werden, um bis {TARGET_YEAR} die Klimaziele einzuhalten.
				</p>
			</div>
		</div>
	</div>
</div>

<p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
	Berechnung basierend auf Zensus-Daten vom Mai 2022 bis zum Zieljahr {TARGET_YEAR}.
</p>
