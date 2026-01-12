<script lang="ts">
	import { page } from '$app/state';
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css/core';
	import { getRegions } from '$lib/utils/regions';
	import { findMatchingRegion } from '$lib/utils/findMatchingRegion';
	import type { Region } from '$lib/utils/getRegion';
	import type { ChartData } from '$lib/components/charts/types';
	import HeatingChart from './Chart.svelte';
	import ExchangeRateCards from './PerDay.svelte';
	import RegionComparison from './RegionComparison.svelte';
	import RegionSearch from './RegionSearch.svelte';
	import {
		fetchHeatingData,
		buildChartData,
		buildRegionLabel,
		categories,
		formatExchangeRate,
		formatNumber,
		TARGET_YEAR,
		type RegionWithDistance,
		type HeatingDataPoint
	} from './config';

	// Props from Card slot
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;

	// State
	let allRegions: RegionWithDistance[] = [];
	let selectedRegion: RegionWithDistance | null = null;
	let data: HeatingDataPoint[] = [];
	let loading = true;
	let regionsLoaded = false;

	// Region candidates: prioritize region prop (from Card/RegionProvider, which handles URL params),
	// fall back to page context
	$: regionFromProp = region?.id;
	$: pageRegionId = page.data?.page?.id;
	$: effectiveRegionId = regionFromProp || pageRegionId;

	// Load all regions on mount
	async function loadRegions() {
		const regions = await getRegions();
		allRegions = regions.filter(
			(r: any) => r.country === 'DE' && (r.layer === 'municipality' || r.layer === 'district')
		) as RegionWithDistance[];
		regionsLoaded = true;
	}

	// Initialize regions
	$: if (!regionsLoaded && !regionLoading) {
		loadRegions();
	}

	// Auto-select region when regions are loaded and we have an effective region ID
	$: if (regionsLoaded && effectiveRegionId && !selectedRegion) {
		// First try to match by ID
		const matchById = allRegions.find((r) => r.id === effectiveRegionId);
		if (matchById) {
			selectedRegion = matchById;
		} else if (page.data?.page) {
			// Fall back to findMatchingRegion
			const foundCode = findMatchingRegion(page.data.page, allRegions);
			if (foundCode) {
				selectedRegion = allRegions.find((r) => r.code === foundCode) || null;
			}
		}
	}

	// Also auto-select when region prop is available and has code
	$: if (regionsLoaded && region?.code && !selectedRegion) {
		const match = allRegions.find((r) => r.code === region!.code);
		if (match) {
			selectedRegion = match;
		}
	}

	// Load heating data when region changes
	$: if (selectedRegion && regionsLoaded) {
		loadData();
	}

	async function loadData() {
		if (!selectedRegion) return;
		loading = true;

		try {
			data = await fetchHeatingData(selectedRegion, allRegions);
			if (data.length > 0) {
				const chartData = buildChartData(data, selectedRegion, allRegions);
				onChartData?.(chartData);
			} else {
				onChartData?.(null);
			}
		} catch (error) {
			console.error('Error fetching heating data:', error);
			data = [];
			onChartData?.(null);
		} finally {
			loading = false;
		}
	}

	$: regionLabel = buildRegionLabel(selectedRegion, allRegions);

	// Exchange rate cards config
	$: gasEntry = data.find((d) => d.category === 'gas');
	$: oilEntry = data.find((d) => d.category === 'heating oil');
	$: gasRate = formatExchangeRate(gasEntry?.value ?? 0);
	$: oilRate = formatExchangeRate(oilEntry?.value ?? 0);

	interface CardConfig {
		color: string;
		icon: 'flame' | 'leaf';
		label: string;
		rate: { value: number; unit: 'day' | 'month' | 'year' };
	}

	$: exchangeCards = [
		{ color: '#118BD2', icon: 'flame', label: 'Gasheizungen', rate: gasRate },
		{ color: '#9C3A03', icon: 'leaf', label: 'Ölheizungen', rate: oilRate }
	] as CardConfig[];

	function getUnitLabel(unit: 'day' | 'month' | 'year'): string {
		return page.data?.translations?.[unit] ?? unit;
	}
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
				<p class="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-snug">
					<strong>{config.label}</strong> müssen pro
					<strong>{getUnitLabel(config.rate.unit)}</strong>
					getauscht werden, um bis {TARGET_YEAR} die Klimaziele einzuhalten.
				</p>
			</div>
		</div>
	</div>
{/snippet}

<div class="heating-regions">
	<RegionSearch {allRegions} bind:selectedRegion />

	{#if loading || regionLoading || !regionsLoaded}
		<div class="mt-4 space-y-3">
			<div class="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
			<div class="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
			<div class="space-y-2">
				{#each [1, 2, 3, 4] as _}
					<div class="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
				{/each}
			</div>
		</div>
	{:else if selectedRegion}
		{#if data.length > 0}
			<!-- Desktop: 2/3 Chart + 1/3 PerDay cards -->
			<div class="hidden lg:grid lg:grid-cols-3 gap-6 mt-4">
				<div class="lg:col-span-2">
					<HeatingChart {data} {categories} />
				</div>
				<div class="lg:col-span-1">
					<ExchangeRateCards {data} layout="stacked" />
					<p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
						Berechnung basierend auf Zensus-Daten vom Mai 2022 bis zum Zieljahr {TARGET_YEAR}.
					</p>
				</div>
			</div>

			<!-- Mobile: Chart then PerDay slider -->
			<div class="lg:hidden mt-4">
				<HeatingChart {data} {categories} />

				<!-- Mobile slider for PerDay cards -->
				<div class="mt-6">
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
							{#each exchangeCards as card}
								<SplideSlide>
									{@render exchangeCard(card)}
								</SplideSlide>
							{/each}
						</SplideTrack>
						<div class="splide__pagination mt-2"></div>
					</Splide>
					<p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
						Berechnung basierend auf Zensus-Daten vom Mai 2022 bis zum Zieljahr {TARGET_YEAR}.
					</p>
				</div>
			</div>

			<RegionComparison {allRegions} {selectedRegion} {categories} />
		{:else}
			<div
				class="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400"
			>
				Keine Daten für die ausgewählte Region verfügbar. Wähle eine andere Region.
			</div>
		{/if}
	{:else}
		<div class="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400">
			Bitte eine Region auswählen.
		</div>
	{/if}
</div>

<style>
	:global(.heating-regions .splide__pagination) {
		display: flex;
		justify-content: center;
		gap: 0.375rem;
	}

	:global(.heating-regions .splide__pagination__page) {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.2);
		border: none;
		padding: 0;
		transition: all 0.2s;
		cursor: pointer;
	}

	:global(.dark .heating-regions .splide__pagination__page) {
		background: rgba(255, 255, 255, 0.2);
	}

	:global(.heating-regions .splide__pagination__page.is-active) {
		background: rgba(0, 0, 0, 0.6);
		width: 16px;
		border-radius: 3px;
	}

	:global(.dark .heating-regions .splide__pagination__page.is-active) {
		background: rgba(255, 255, 255, 0.7);
	}
</style>
