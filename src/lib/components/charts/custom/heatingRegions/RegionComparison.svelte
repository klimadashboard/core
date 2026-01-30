<script lang="ts">
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css/core';
	import {
		fetchHeatingData,
		getComparisonRegions,
		formatNumber,
		type RegionWithDistance,
		type HeatingCategory
	} from './config';

	export let allRegions: RegionWithDistance[];
	export let selectedRegion: RegionWithDistance | null;
	export let categories: HeatingCategory[];

	$: comparisonRegions = getComparisonRegions(selectedRegion, allRegions).filter(
		(r) => r.code !== selectedRegion?.code
	);

	$: featuredCategories = categories.filter((c) => c.featured);
</script>

{#snippet shareIcon(pct: number)}
	{@const percentage = Math.min(Math.max(pct, 0), 100)}
	{@const angle = (percentage / 100) * 360}
	{@const radians = ((angle - 90) * Math.PI) / 180}
	{@const x = 12 + 9 * Math.cos(radians)}
	{@const y = 12 + 9 * Math.sin(radians)}
	{@const largeArc = angle > 180 ? 1 : 0}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="w-3 h-3"
	>
		<path stroke="none" d="M0 0h24v24H0z" fill="none" />
		{#if percentage > 0}
			<path d="M 12 3 A 9 9 0 {largeArc} 1 {x} {y} L 12 12 Z" fill="currentColor" stroke="none" />
		{/if}
		<circle cx="12" cy="12" r="9" />
	</svg>
{/snippet}

{#snippet regionCard(region: RegionWithDistance)}
	{@const isNearby = (region.distance ?? Infinity) < 20}
	<div class="h-full flex flex-col">
		<div class="flex items-center justify-between mb-2">
			<h4 class="font-semibold text-sm text-gray-900 dark:text-white truncate">
				{region.name}
			</h4>
			{#if isNearby}
				<span
					class="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex-shrink-0 ml-2"
				>
					Nähe
				</span>
			{/if}
		</div>

		{#await fetchHeatingData(region, allRegions)}
			<div class="flex-1 flex flex-col gap-1.5">
				{#each featuredCategories as _}
					<div class="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
				{/each}
			</div>
		{:then data}
			{#if data.length > 0}
				<div class="flex-1 flex flex-col gap-1">
					{#each featuredCategories as category}
						{@const datapoint = data.find((d) => d.category === category.key)}
						{@const pct = datapoint?.percentage ?? 0}
						<div class="flex items-center gap-2">
							<div class="w-20 flex-shrink-0">
								<p class="text-[10px] leading-tight text-gray-600 dark:text-gray-400 truncate">
									{category.label}
								</p>
							</div>
							<div class="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
								<div
									class="h-full rounded-full transition-all duration-500"
									style="width: {pct}%; background-color: {category.color}"
								></div>
							</div>
							<div
								class="w-10 flex-shrink-0 text-right text-xs font-medium tabular-nums"
								style="color: {category.color}"
							>
								{formatNumber(pct)}%
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-xs text-gray-500 dark:text-gray-400">Keine Daten.</p>
			{/if}
		{:catch}
			<p class="text-xs text-red-500">Fehler.</p>
		{/await}
	</div>
{/snippet}

{#if comparisonRegions.length > 0}
	<div class="mt-6">
		<h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
			Vergleich mit anderen Regionen
		</h3>

		<!-- Desktop: Grid layout showing all 3 -->
		<div class="hidden md:grid md:grid-cols-3 gap-3">
			{#each comparisonRegions as region (region.code)}
				<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
					{@render regionCard(region)}
				</div>
			{/each}
		</div>

		<!-- Mobile: Splide slider -->
		<div class="md:hidden">
			<Splide
				hasTrack={false}
				options={{
					perPage: 1,
					gap: '0.75rem',
					padding: { right: '2rem' },
					pagination: true,
					arrows: false
				}}
			>
				<SplideTrack>
					{#each comparisonRegions as region (region.code)}
						<SplideSlide>
							<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
								{@render regionCard(region)}
							</div>
						</SplideSlide>
					{/each}
				</SplideTrack>
				<div class="splide__pagination mt-2"></div>
			</Splide>
		</div>
	</div>
{/if}

<style>
	:global(.splide__pagination) {
		display: flex;
		justify-content: center;
		gap: 0.375rem;
	}

	:global(.splide__pagination__page) {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.2);
		border: none;
		padding: 0;
		transition: all 0.2s;
		cursor: pointer;
	}

	:global(.dark .splide__pagination__page) {
		background: rgba(255, 255, 255, 0.2);
	}

	:global(.splide__pagination__page.is-active) {
		background: rgba(0, 0, 0, 0.6);
		width: 16px;
		border-radius: 3px;
	}

	:global(.dark .splide__pagination__page.is-active) {
		background: rgba(255, 255, 255, 0.7);
	}
</style>
