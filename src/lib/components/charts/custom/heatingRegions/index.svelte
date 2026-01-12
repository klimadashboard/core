<script lang="ts">
	import { page } from '$app/state';
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
</script>

<div class="heating-regions">
	<RegionSearch {allRegions} bind:selectedRegion />

	{#if loading || regionLoading || !regionsLoaded}
		<div class="mt-4 space-y-3">
			<div class="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
			<div class="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
			<div class="space-y-2">
				{#each [1, 2, 3, 4] as _}
					<div class="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
				{/each}
			</div>
		</div>
	{:else if selectedRegion}
		{#if data.length > 0}
			<HeatingChart {data} {categories} />

			<ExchangeRateCards {data} />

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
