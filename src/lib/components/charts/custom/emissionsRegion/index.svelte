<script lang="ts">
	import { page } from '$app/state';
	import Switch from '$lib/components/Switch.svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { downloadCSV, downloadJSON } from '$lib/utils/downloadData';
	import { readItems } from '@directus/sdk';
	import { fade } from 'svelte/transition';
	import Chart from './Chart.svelte';
	import ChartHorizontal from './ChartHorizontal.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let chart;
	export let v; // Add this to access the variables from Directus
	let views: { key: string; label: string }[] = [];
	let activeLayer: string | null = null;
	let results: any[] = [];
	let loading = true;
	let showPerCapita = false;
	let dataFetched = false; // Add flag to prevent infinite loops
	let populationDataFetched = false; // Add flag for population data
	let populationByYear: { [regionId: string]: { [year: number]: number } } = {};

	// Declare currentId in the component scope
	$: currentId = page.data?.page?.id;
	$: parentIds = page.data?.page?.parents?.map((p: any) => p.id) || [];
	$: regionCandidates = [currentId, ...parentIds].filter(Boolean);

	const getData = async () => {
		try {
			const directus = getDirectusInstance();

			// currentId is now available in component scope
			if (regionCandidates.length > 0) {
				// Region candidates available for processing
			}
			// Fetch emissions
			const emissions = await directus.request(
				readItems('emissions_data', {
					filter: {
						_and: [
							{ region: { _in: regionCandidates } },
							{ value: { _gte: 0 } },
							{ category: { _neq: 'ksg' } },
							{ category: { _neq: 'total' } },
							{ category: { _neq: 'Emissions|CO2' } },
							{
								_or: [
									{ category: { _neq: 'Emissions|Kyoto Gases' } },
									{
										source: {
											_eq: 'climate-target'
										}
									}
								]
							},
							{
								_or: [{ type: { _null: true } }, { type: { _nin: ['EH', 'KSG'] } }]
							}
						]
					},
					limit: -1,
					sort: ['year']
				})
			);

			// Fetch region metadata
			const regions = await directus.request(
				readItems('regions', {
					filter: { id: { _in: regionCandidates } },
					fields: ['id', 'name', 'layer', 'layer_label', 'population']
				})
			);

			// Fetch category metadata
			const categories = await directus.request(
				readItems('emissions_category', {
					fields: ['code', 'label', 'color'],
					limit: -1
				})
			);
			const categoryMap = new Map((categories ?? []).map((c) => [c.code, c]));

			// Custom sector order as requested by user
			const customSectorOrder = [
				'Energie',
				'Industrie',
				'Gebäude',
				'Mobilität',
				'Landwirtschaft',
				'Abfallwirtschaft und Sonstiges'
			];

			// Create a mapping from labels to codes
			const labelToCodeMap = new Map();
			categories?.forEach((cat) => {
				if (cat.label) {
					labelToCodeMap.set(cat.label.toLowerCase(), cat.code);

					// Handle special mappings for common variations
					if (cat.label.toLowerCase().includes('abfall')) {
						labelToCodeMap.set('abfallwirtschaft und sonstiges', cat.code);
					}
					if (cat.label.toLowerCase().includes('landnutzung')) {
						labelToCodeMap.set('landwirtschaft', cat.code);
					}
					if (cat.label.toLowerCase().includes('transport')) {
						labelToCodeMap.set('verkehr', cat.code);
					}
					if (cat.label.toLowerCase().includes('building')) {
						labelToCodeMap.set('gebäude', cat.code);
					}
					if (cat.label.toLowerCase().includes('industrial')) {
						labelToCodeMap.set('industrie', cat.code);
					}
					if (cat.label.toLowerCase().includes('energy')) {
						labelToCodeMap.set('energie', cat.code);
					}
				}
			});

			// Create ordered category list based on custom order
			const categoryOrder = customSectorOrder
				.map((label) => labelToCodeMap.get(label.toLowerCase()))
				.filter(Boolean)
				.concat(
					// Add any remaining categories not in the custom order
					(categories ?? [])
						.map((c) => c.code)
						.filter(
							(code) =>
								!customSectorOrder.some((label) => labelToCodeMap.get(label.toLowerCase()) === code)
						)
				)
				.filter(Boolean);

			// Enrich emissions with category info
			const enriched = emissions.map((e) => {
				const cat = categoryMap.get(e.category);
				return {
					...e,
					category_label: cat?.label ?? e.category,
					category_color: cat?.color ?? '#ccc'
				};
			});

			// Group by region
			const matched = regions
				.map((region) => {
					const regionData = enriched.filter((d: any) => d.region === region.id);
					if (regionData.length > 0) {
						return {
							key: region.layer,
							label: region.layer_label + ' ' + region.name,
							layer_label: region.layer_label,
							name: region.name,
							data: regionData,
							categoryOrder,
							population: region.population,
							id: region.id // Add region ID for population lookup
						};
					}
					return null;
				})
				.filter(Boolean);

			return matched;
		} catch (error) {
			console.error('Error fetching emissions data:', error);
			return [];
		}
	};

	// Fetch population data for all regions
	const fetchPopulationData = async () => {
		if (populationDataFetched || regionCandidates.length === 0) return;

		try {
			const directus = getDirectusInstance();

			// Fetch population data for all region candidates at once
			const allPopulationData = await directus.request(
				readItems('population', {
					filter: { region: { _in: regionCandidates } },
					limit: -1,
					sort: ['region', 'period']
				})
			);

			// Group population data by region and year
			populationByYear = {};
			allPopulationData.forEach((pop: any) => {
				const regionId = pop.region;
				const year = new Date(pop.period).getFullYear();

				if (!populationByYear[regionId]) {
					populationByYear[regionId] = {};
				}
				populationByYear[regionId][year] = pop.value;
			});

			populationDataFetched = true;
		} catch (error) {
			console.error('Error fetching population data:', error);
		}
	};

	// Make getData reactive and only call when regionCandidates is available and not already fetched
	$: if (regionCandidates.length > 0 && !dataFetched) {
		dataFetched = true;
		Promise.all([getData(), fetchPopulationData()]).then(([fetched]) => {
			results = fetched;
			views = results.map((r) => ({ key: r.key, label: r.label }));
			activeLayer = views[0]?.key ?? null;
			loading = false;
		});
	}

	// Filter views based on current page context - for Hamburg, only show "Gruppe Stadtstaaten"
	$: filteredViews = (() => {
		if (results.length > 0) {
			// Check if we're on a Hamburg page by looking at current region candidates
			const currentRegion = results.find((r) => r.name.includes('Hamburg'));
			if (currentRegion) {
				// Only show "Gruppe Stadtstaaten" for Hamburg
				return views.filter((v) => v.label.includes('Stadtstaaten'));
			}
		}
		// For all other regions, show all available views
		return views;
	})();

	// Auto-select the appropriate view when filtered views change
	$: if (
		filteredViews.length > 0 &&
		(!activeLayer || !filteredViews.find((v) => v.key === activeLayer))
	) {
		activeLayer = filteredViews[0]?.key ?? null;
	}

	// Automatically enable Pro-Kopf view when Bavaria (Bundesland Bayern) is selected
	$: {
		if (results.length > 0 && activeLayer) {
			const selectedRegion = results.find((r) => r.key === activeLayer);
			if (
				selectedRegion &&
				selectedRegion.layer_label === 'Bundesland' &&
				selectedRegion.name.includes('Bayern')
			) {
				showPerCapita = true;
			}
		}
	}

	// Helper function to get population data for a specific region
	$: getPopulationForRegion = (regionId: string) => {
		return populationByYear[regionId] || {};
	};

	let allowPerCapita = PUBLIC_VERSION == 'de';

	// Helper function to get federal state text based on current region
	$: getCurrentStateText = () => {
		if (results.length > 0 && activeLayer) {
			const selectedRegion = results.find((r) => r.key === activeLayer);
			if (selectedRegion) {
				// Try to match the region name with variable keys
				const regionName =
					selectedRegion.name == 'Stadtstaaten' ? page.data.page.name : selectedRegion.name;

				if (selectedRegion.name == 'Stadtstaaten') {
					allowPerCapita = false;
				}

				// Check if we have a variable for this region (exact match)
				if (v && v[regionName]) {
					return v[regionName];
				}

				// Comprehensive mapping for all 16 German federal states
				const stateMappings: { [key: string]: any } = {
					// Full state names (primary keys)
					Hessen: v?.['Hessen'],
					'Baden-Württemberg': v?.['Baden-Württemberg'],
					Bayern: v?.['Bayern'],
					Niedersachsen: v?.['Niedersachsen'],
					'Mecklenburg-Vorpommern': v?.['Mecklenburg-Vorpommern'],
					Sachsen: v?.['Sachsen'],
					'Sachsen-Anhalt': v?.['Sachsen-Anhalt'],
					'Schleswig-Holstein': v?.['Schleswig-Holstein'],
					Berlin: v?.['Berlin'],
					Brandenburg: v?.['Brandenburg'],
					Bremen: v?.['Bremen'],
					Hamburg: v?.['Hamburg'],
					'Nordrhein-Westfalen': v?.['Nordrhein-Westfalen'],
					'Rheinland-Pfalz': v?.['Rheinland-Pfalz'],
					Saarland: v?.['Saarland'],
					Thüringen: v?.['Thüringen'],

					// Alternative spellings and abbreviations
					'North Rhine-Westphalia': v?.['Nordrhein-Westfalen'],
					NRW: v?.['Nordrhein-Westfalen'],
					Bavaria: v?.['Bayern'],
					Hesse: v?.['Hessen'],
					'Lower Saxony': v?.['Niedersachsen'],
					Saxony: v?.['Sachsen'],
					'Saxony-Anhalt': v?.['Sachsen-Anhalt'],
					'Rhineland-Palatinate': v?.['Rheinland-Pfalz'],
					Thuringia: v?.['Thüringen'],
					BW: v?.['Baden-Württemberg'],
					MV: v?.['Mecklenburg-Vorpommern'],
					SH: v?.['Schleswig-Holstein']
				};

				return stateMappings[regionName] || null;
			}
		}
		return null;
	};

	$: currentStateText = getCurrentStateText();
</script>

{#if loading}
	<p class="text-sm text-gray-500">Lade Emissionsdaten…</p>
{:else if results.length === 0}
	<p class="text-sm text-gray-500">
		Keine Emissionsdaten für diese Region oder ihre übergeordneten Ebenen verfügbar.
	</p>
{:else}
	<Switch
		type="small"
		views={filteredViews}
		bind:activeView={activeLayer}
		on:itemClick={(event) => {
			activeLayer = event.detail;
		}}
	/>

	{#if allowPerCapita}
		<!-- Pro-Kopf Toggle moved to left side under title -->
		<label
			class="flex gap-1 text-sm items-center mt-3 {showPerCapita
				? 'text-gray-700'
				: 'text-gray-400'}"
			transition:fade
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 icon icon-tabler icon-tabler-users"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path stroke="none" d="M0 0h24v24H0z" fill="none" />
				<circle cx="9" cy="7" r="4" />
				<path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
				<path d="M16 3.13a4 4 0 0 1 0 7.75" />
				<path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
			</svg>
			<span>Pro-Kopf Emissionen?</span>
			<input
				type="checkbox"
				bind:checked={showPerCapita}
				disabled={!results.some(
					(r) => r.population || Object.keys(getPopulationForRegion(r.id)).length > 0
				)}
			/>
		</label>
	{/if}

	{#each results as r}
		{#if r.key === activeLayer}
			{#if new Set(r.data.map((d: any) => d.year)).size === 1 && r.data.length > 1}
				<ChartHorizontal
					data={r.data}
					region={r}
					{showPerCapita}
					populationByYear={getPopulationForRegion(r.id)}
				/>
			{:else if r.data.length > 1}
				<Chart
					data={r.data}
					region={r}
					{showPerCapita}
					populationByYear={getPopulationForRegion(r.id)}
				/>
			{:else}
				<p class="text-sm text-gray-500 mt-4">
					Nicht genug Daten verfügbar für eine aussagekräftige Darstellung.
				</p>
			{/if}
		{/if}
	{/each}
	<!-- Display federal state specific text -->
	{#if currentStateText}
		<div class="" transition:fade>
			<div class="text-lg max-w-2xl my-4">
				{@html currentStateText}
			</div>
		</div>
	{/if}
	<div class="mt-4 text-sm flex gap-2">
		<button on:click={() => downloadCSV(results, 'emissions_data.csv')} class="button"
			><svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="inline w-5 h-5"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"
				/><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg
			>CSV</button
		>
		<button on:click={() => downloadJSON(results, 'emissions_data.json')} class="button"
			><svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="inline w-5 h-5"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"
				/><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg
			>JSON</button
		>
	</div>
{/if}
