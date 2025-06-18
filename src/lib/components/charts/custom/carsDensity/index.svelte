<script lang="ts">
	import { onMount } from 'svelte';
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { colors } from './scales';
	import type { RegionWithData } from './mobilityData';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { loadMobilityData, getRegionData, getRelatedRegions } from './mobilityData';
	import { findMatchingRegion } from '$lib/utils/findMatchingRegion';
	import { page } from '$app/state';

	let promise: Promise<{
		regions: RegionWithData[];
		periods: string[];
		source: string;
		country: RegionShape;
		preselected?: string;
	}>;

	let regions: RegionWithData[] = [];
	let availablePeriods: string[] = [];
	let selectedPeriodIndex = 0;
	let selectedPeriod: string;
	let selectedView: 'pop' | 'private' | 'company' = 'pop';
	let selectedRegion: string | null = null;
	let source: string;
	let country: RegionShape;

	const views = [
		{
			label: 'Gesamt',
			key: 'pop',
			description: 'Autos pro 1000 Einwohner:innen',
			color: colors.pop[1],
			dataKey: 'carsPer1000Inhabitants',
			unit: '',
			chart: ''
		},
		{
			label: 'Privat',
			key: 'private',
			description: 'Anteil privater PKW',
			color: colors.private[1],
			dataKey: 'carsPrivateShare',
			unit: '%',
			chart: 'progressBar'
		},
		{
			label: 'Firmen',
			key: 'company',
			description: 'Anteil gewerblicher PKW',
			color: colors.company[1],
			dataKey: 'carsCompanyShare',
			unit: '%',
			chart: 'progressBar'
		}
	];

	// fetch once on mount
	onMount(() => {
		promise = loadMobilityData(fetch).then((payload) => {
			regions = payload.regions;
			availablePeriods = payload.periods;
			source = payload.source;
			country = payload.country;
			selectedRegion =
				payload.preselected ??
				(PUBLIC_VERSION == 'at'
					? findMatchingRegion(page.data.page, regions, true).code
					: findMatchingRegion(page.data.page, regions, true).code_short);
			selectedPeriodIndex = availablePeriods.length - 1;
			return payload;
		});
	});

	$: selectedPeriod = availablePeriods[selectedPeriodIndex];
</script>

<div>
	<div class="flex flex-col items-center space-y-2">
		{#if PUBLIC_VERSION == 'at'}
			<div class="flex gap-2">
				<input
					type="range"
					class="w-20"
					min={0}
					max={availablePeriods.length - 1}
					step={1}
					bind:value={selectedPeriodIndex}
					aria-label="Zeitpunkt"
				/>
				<span>{selectedPeriod}</span>
			</div>
		{/if}
		<Switch
			type="small"
			{views}
			bind:activeView={selectedView}
			on:itemClick={(e) => (selectedView = e.detail)}
		/>
	</div>
	<div class="min-h-[60vh]">
		{#await promise}
			<Loader />
		{:then p}
			{#if selectedView && selectedPeriod}
				{@const regions = p.regions}

				<div>
					<div class={PUBLIC_VERSION === 'at' ? 'h-[40vh]' : 'h-[60vh]'}>
						<Map
							{selectedPeriod}
							regions={regions.map((d) => ({
								code: PUBLIC_VERSION == 'at' ? d.code : d.code_short,
								center: d.center,
								name: d.name,
								data:
									selectedView === 'pop'
										? d.carsPer1000Inhabitants
										: selectedView === 'private'
											? d.carsPrivateShare
											: d.carsCompanyShare
							}))}
							max={selectedView === 'pop' ? 1000 : 100}
							unit={selectedView === 'pop' ? '' : '%'}
							colors={colors[selectedView]}
							bind:selectedRegion
							on:selectRegion={(e) => (selectedRegion = e.detail)}
						/>
					</div>
					<div
						class="bg-white dark:bg-gray-900 border border-current/10 shadow p-3 rounded-2xl -mt-10 z-30 relative max-w-3xl mx-auto"
					>
						<Inspector
							{views}
							{selectedPeriod}
							region={getRegionData(regions, selectedRegion, country)}
						/>
						<p class="text-sm opacity-80 mt-4">Datenquelle: {source}</p>
					</div>
				</div>
			{/if}
		{/await}
	</div>
</div>
