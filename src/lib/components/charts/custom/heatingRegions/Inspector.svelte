<script>
	import PerDay from './PerDay.svelte';
	import Chart from './Chart.svelte';
	import RegionComparison from './RegionComparison.svelte';
	import RegionSearch from './RegionSearch.svelte';
	import { getDataForSelectedRegion } from './getData';

	export let regions;
	export let selectedRegion;

	// your existing categories unchanged
	let categories = [
		{ key: 'gas', label: 'Gasheizungen', color: '#118BD2', featured: true },
		{
			key: 'district heating (various energy sources)',
			label: 'Fernwärme',
			color: '#BF1A5C',
			featured: true
		},
		{ key: 'heating oil', label: 'Heizöl', color: '#9C3A03', featured: true },
		{ key: 'electricity (without heat pump)', label: 'Strom', color: '#EA2643' },
		{ key: 'wood, wood pellets', label: 'Holz', color: '#9F987A' },
		{
			key: 'solar/geothermal energy, heat pumps',
			label: 'Wärmepumpen, Solar-/Geothermie',
			color: '#047857',
			featured: true
		},
		{ key: 'no energy source (no heating)', label: 'Keine Heizung', color: '#6B7280' },
		{ key: 'coal', label: 'Kohle', color: '#374151' },
		{ key: 'biomass (excluding wood), biogas', label: 'Biomasse & Biogas', color: '#3F6212' }
	];

	// Build a nice label. If it's a district, mention aggregation count.
	function buildRegionLabel(region, allRegions) {
		if (!region) return '';
		if (region.layer === 'district') {
			const count =
				allRegions?.filter(
					(r) =>
						r.layer === 'municipality' &&
						Array.isArray(r.parents) &&
						r.parents.some((p) => p.layer === 'district' && p.id === region.id)
				).length ?? 0;
			return `${region.name} – aggregiert aus ${count} Gemeinden`;
		}
		return region.name ?? '';
	}

	// Fetch data whenever selection changes.
	let regionLabel = '';
	$: regionLabel = buildRegionLabel(selectedRegion, regions);

	// Important: pass the object + full region list.
	$: promise = selectedRegion ? getDataForSelectedRegion(selectedRegion, regions) : null;
</script>

<div class="">
	<RegionSearch {regions} bind:selectedRegion />

	{#if selectedRegion}
		{#if promise}
			{#await promise then rawData}
				{#if rawData.length > 0}
					<!-- Inject regionLabel so downstream components don’t break if they expect it -->
					{@const data = rawData.map((d) => ({ ...d, region_label: regionLabel }))}

					<p class="mt-2">
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
							class="inline -translate-y-0.5 -translate-x-1"
						>
							<path stroke="none" d="M0 0h24v24H0z" fill="none" />
							<path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
							<path
								d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"
							/>
						</svg>
						<span>{regionLabel}</span>
					</p>

					<h2 class="text-2xl leading-tight">
						Zensus 2022 – Fossile Heizungen oftmals noch Standard
					</h2>
					<h3 class="text-lg leading-tight mt-2">Heizungen nach Art des Energieträgers</h3>

					<Chart {data} {categories} />

					<p class="opacity-80 leading-tight mt-2 pt-2 border-t border-current/20">
						<strong>Datenquelle</strong> Statistisches Bundesamt (2024): Zensus 2022, Eigene Berechnung
					</p>

					<PerDay {data} {categories} />
				{:else}
					<p class="opacity-80 my-4">
						Keine Daten für die ausgewählte Region verfügbar. Wähle eine andere Region.
					</p>
				{/if}
			{/await}
		{:else}
			<p class="opacity-80 my-4">Bitte eine Region auswählen.</p>
		{/if}

		<RegionComparison {regions} {selectedRegion} {categories} />
	{/if}
</div>
