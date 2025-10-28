<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { get } from 'svelte/store'; // ⬅️ add this
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { colors } from './scales';
	import type { RegionWithData } from './mobilityData';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { loadMobilityData, getRegionData } from './mobilityData';
	import { findMatchingRegion } from '$lib/utils/findMatchingRegion';

	let promise: Promise<any>;

	let regions: RegionWithData[] = [];
	let availablePeriods: string[] = [];
	let selectedPeriodIndex = 0;
	let selectedPeriod: string;
	let selectedView: 'pop' | 'private' | 'company' = 'pop';
	let selectedRegion: string | null = null;
	let source: string = '';
	let country: RegionShape | null = null;

	let selectedLayer = page.data.page?.layer == 'district' ? 'districts' : 'municipalities';

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

	onMount(() => {
		promise = loadMobilityData(fetch).then((payload) => {
			regions = payload.regions;
			availablePeriods = payload.periods;
			source = payload.source;
			country = payload.country;
			const match = findMatchingRegion(page.data.page, payload.regions, true);
			selectedRegion =
				payload.preselected ??
				(PUBLIC_VERSION === 'at' ? match.code : (match.code_short ?? match.code));
			selectedPeriodIndex = availablePeriods.length - 1;
		});
	});

	$: selectedPeriod = availablePeriods[selectedPeriodIndex];

	// regions shown on the map for the active layer
	$: regionsForMap = regions.filter((d) =>
		selectedLayer === 'districts'
			? d.layer === 'district'
			: selectedLayer === 'states'
				? d.layer === 'state'
				: d.layer === 'municipality'
	);

	// correct code per layer
	function codeForMap(d: any): string {
		if (selectedLayer === 'districts') return String(d.code); // DE Kreise: 5-digit AGS
		if (selectedLayer === 'states') return String(d.code);
		if (PUBLIC_VERSION === 'at') return String(d.code); // AT Gemeinden: GKZ
		return String(d.code_short ?? d.code); // DE Gemeinden: 8-digit AGS
	}
	$: mapRegions = regionsForMap.map((d) => ({
		code: codeForMap(d),
		center: d.center,
		name: d.name,
		data:
			selectedView === 'pop'
				? d.carsPer1000Inhabitants
				: selectedView === 'private'
					? d.carsPrivateShare
					: d.carsCompanyShare
	}));
</script>

<div>
	<div class="flex flex-col items-center space-y-2 mb-4">
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

	<div class="min-h-[40rem]">
		{#await promise}
			<Loader />
		{:then _}
			<div>
				<div class="h-[30rem]">
					{#key selectedLayer}
						<!-- force remount when layer changes -->
						<Map
							bind:selectedLayer
							{selectedPeriod}
							regions={mapRegions}
							max={selectedView === 'pop' ? 1000 : 100}
							unit={selectedView === 'pop' ? '' : '%'}
							colors={colors[selectedView]}
							bind:selectedRegion
							on:selectRegion={(e) => (selectedRegion = e.detail)}
						/>
					{/key}
				</div>

				<div
					class="bg-white dark:bg-gray-900 border border-current/10 shadow p-3 rounded-2xl -mt-10 z-30 relative max-w-3xl mx-auto"
				>
					{#if country}
						<Inspector
							{views}
							{selectedPeriod}
							region={getRegionData(regions, selectedRegion, country)}
						/>
					{:else}
						<p class="text-sm opacity-80">Lade Metadaten…</p>
					{/if}
					<p class="text-sm opacity-80 mt-4">Datenquelle: {@html source}</p>
				</div>
			</div>
		{/await}
	</div>
</div>
