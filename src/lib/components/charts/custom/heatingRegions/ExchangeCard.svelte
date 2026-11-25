<script lang="ts">
	import { page } from '$app/state';
	import { CENSUS_DATE_DE, formatNumber } from './config';

	export let color: string;
	export let icon: 'flame' | 'drop';
	export let label: string;
	export let rate: { value: number; unit: 'day' | 'month' | 'year' };
	export let targetYear: number;

	$: unitLabel = page.data?.translations?.[rate.unit] ?? rate.unit;
</script>

<!-- Icon and headline share the first row; the sentence runs full width below -->
<div
	class="h-full rounded-xl border px-[18px] py-4 grid grid-cols-[auto_minmax(0,1fr)] content-center gap-x-3 gap-y-2.5"
	style="background-color: {color}14; border-color: {color}40;"
>
	<div
		class="w-9 h-9 rounded-lg flex items-center justify-center text-white self-center"
		style="background-color: {color};"
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
			aria-hidden="true"
		>
			{#if icon === 'flame'}
				<path
					d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z"
				/>
			{:else}
				<path d="M12 3s-6 6.6-6 11a6 6 0 0 0 12 0c0-4.4-6-11-6-11z" />
			{/if}
		</svg>
	</div>
	<p class="self-center flex flex-wrap items-baseline gap-x-2 gap-y-0.5 leading-none font-semibold" style="color: {color};">
		<span class="text-[34px] tabular-nums">{formatNumber(rate.value)}</span>
		<span class="text-[15px]">{label} pro {unitLabel}</span>
	</p>
	<p class="col-span-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
		müssen zwischen {CENSUS_DATE_DE.getFullYear()} und {targetYear} getauscht werden, um Klimaneutralität
		zu erreichen.
	</p>
</div>
