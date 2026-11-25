<script lang="ts">
	import { page } from '$app/state';
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import '@splidejs/svelte-splide/css/core';
	import { getRegions } from '$lib/utils/regions';
	import type { Region } from '$lib/utils/getRegion';
	import type { ChartData } from '$lib/components/charts/types';
	import HeatingChart from './Chart.svelte';
	import ExchangeRateCards from './PerDay.svelte';
	import ExchangeCard from './ExchangeCard.svelte';
	import RegionComparison from './RegionComparison.svelte';
	import ChartSettings from '$lib/components/charts/ChartSettings.svelte';
	import RegionDrilldown from '$lib/components/charts/RegionDrilldown.svelte';
	import { fetchRegion } from '$lib/utils/getRegion';
	import type { ContextRegion } from '$lib/utils/regionContext';
	import { hasDrilldown } from '$lib/utils/regionTree';
	import {
		fetchHeatingData,
		buildChartData,
		buildRegionLabel,
		getDataRegion,
		categories,
		formatExchangeRate,
		getTargetYear,
		type RegionWithDistance,
		type HeatingDataPoint
	} from './config';

	// Props from Card slot
	export let region: Region | null = null;
	export let regionLoading: boolean = false;
	export let onChartData: ((data: ChartData | null) => void) | undefined = undefined;
	export let view: 'full' | 'simple' = 'full';
	export let snapshotData: any = null;

	// Check URL for view parameter (for embeds)
	$: urlView = page.url?.searchParams?.get('view');
	$: effectiveView = urlView === 'simple' ? 'simple' : view;

	// State
	let allRegions: RegionWithDistance[] = [];
	let data: HeatingDataPoint[] = [];
	let loading = true;
	let regionsLoaded = false;
	let usedSnapshot = false;

	// Load all regions on mount (DE + AT)
	async function loadRegions() {
		const regions = await getRegions();
		allRegions = regions.filter(
			(r: any) =>
				(r.country === 'DE' || r.country === 'AT') &&
				['municipality', 'district', 'state', 'country'].includes(r.layer)
		) as RegionWithDistance[];
		regionsLoaded = true;
	}

	// Initialize regions
	$: if (!regionsLoaded && !regionLoading) {
		loadRegions();
	}

	// Region shown in the chart: the card's region, or a Kreis picked in the RegionDrilldown
	let switchedRegion: Region | null = null;
	let switcherFor: string | null = null;
	$: if (region?.id !== switcherFor) {
		switcherFor = region?.id ?? null;
		switchedRegion = null;
	}
	$: selectedRegion = (switchedRegion ?? region) as RegionWithDistance | null;

	// Only offer the dropdown where there is something to drill into (e.g. a Metropolregion)
	let drillable = false;
	$: hasDrilldown(region, 'districts').then((v) => (drillable = v));

	async function selectRegion(r: ContextRegion) {
		if (r.id === region?.id) switchedRegion = null;
		else switchedRegion = (await fetchRegion(r.id)) ?? switchedRegion;
	}

	// Use SSR snapshot for initial data if available and matching current region
	$: snapshotRegionId = snapshotData?.meta?.region?.id;
	$: snapshotMatchesRegion = snapshotData?.raw && selectedRegion && snapshotRegionId === selectedRegion.id;

	$: if (snapshotMatchesRegion && !usedSnapshot) {
		useSnapshotData();
	}

	// Load heating data when region changes (skip if snapshot was used for initial load)
	$: if (selectedRegion && regionsLoaded && !regionLoading) {
		if (!usedSnapshot) {
			loadData();
		} else {
			// Snapshot was used for initial data; reset flag so future region changes re-fetch
			usedSnapshot = false;
		}
	}

	function useSnapshotData() {
		data = snapshotData.raw;
		loading = false;
		usedSnapshot = true;
		// Report snapshot data to Card (for placeholders, table, etc.)
		onChartData?.(snapshotData);
	}

	async function loadData() {
		if (!selectedRegion) return;
		loading = true;

		try {
			const result = await fetchHeatingData(selectedRegion, allRegions);
			data = result.data;
			if (data.length > 0) {
				const chartData = buildChartData(data, selectedRegion, allRegions, result.dataPeriod);
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
	$: dataRegion = regionsLoaded ? getDataRegion(selectedRegion, allRegions) : null;
	$: showDataMismatchBanner = dataRegion && selectedRegion && dataRegion.id !== selectedRegion.id;
	$: isAT = selectedRegion?.country === 'AT';
	$: targetYear = getTargetYear(selectedRegion?.country);

	// Exchange rate cards (mobile slider)
	$: gasEntry = data.find((d) => d.category === 'gas');
	$: oilEntry = data.find((d) => d.category === 'heating oil');
	$: exchangeCards = [
		{ color: '#118BD2', icon: 'flame', label: 'Gasheizungen', rate: formatExchangeRate(gasEntry?.value ?? 0, selectedRegion?.country) },
		{ color: '#9C3A03', icon: 'drop', label: 'Ölheizungen', rate: formatExchangeRate(oilEntry?.value ?? 0, selectedRegion?.country) }
	] as const;
</script>

<div class="heating-regions">
	<!-- Spatial level; outside the loading state so focus stays on the dropdown while data reloads -->
	{#if !regionLoading && region && drillable}
		<ChartSettings>
			<div class="order-last flex w-full flex-wrap items-center gap-x-4 gap-y-2">
				<RegionDrilldown {region} activeId={selectedRegion?.id ?? null} onSelect={selectRegion} depth="districts" />
			</div>
		</ChartSettings>
	{/if}

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
		{#if showDataMismatchBanner}
			<div class="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
				Da keine Daten für {selectedRegion.name}{selectedRegion.layer_label && selectedRegion.layer !== 'country' ? ` (${selectedRegion.layer_label})` : ''} verfügbar sind, werden Daten für {dataRegion?.name}{dataRegion?.layer_label && dataRegion?.layer !== 'country' ? ` (${dataRegion.layer_label})` : ''} angezeigt.
			</div>
		{/if}
		{#if data.length > 0}
			{#if effectiveView === 'simple'}
				<!-- Simple view: Full-width chart only -->
				<div class="mt-4">
					<HeatingChart {data} {categories} />
				</div>
			{:else}
				<!-- Full view: Chart + PerDay cards + RegionComparison -->
				<!-- Desktop: 2/3 Chart + 1/3 PerDay cards -->
				<div class="hidden lg:grid lg:grid-cols-3 gap-8 mt-4">
					<div class="lg:col-span-2">
						<HeatingChart {data} {categories} />
					</div>
					<!-- Boxes stretch to the height of the rings -->
					<div class="lg:col-span-1 flex flex-col">
						<div class="flex-1">
							<ExchangeRateCards {data} country={selectedRegion?.country} layout="stacked" />
						</div>
						<p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
							{#if isAT}
								Berechnung basierend auf Mikrozensus-Daten bis zum Zieljahr {targetYear}.
							{:else}
								Berechnung basierend auf Zensus-Daten vom Mai 2022 bis zum Zieljahr {targetYear}.
							{/if}
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
										<ExchangeCard {...card} {targetYear} />
									</SplideSlide>
								{/each}
							</SplideTrack>
							<div class="splide__pagination mt-2"></div>
						</Splide>
						<p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
							{#if isAT}
								Berechnung basierend auf Mikrozensus-Daten bis zum Zieljahr {targetYear}.
							{:else}
								Berechnung basierend auf Zensus-Daten vom Mai 2022 bis zum Zieljahr {targetYear}.
							{/if}
						</p>
					</div>
				</div>

				<RegionComparison {allRegions} {selectedRegion} {categories} />
			{/if}
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
