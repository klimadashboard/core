<script lang="ts">
	import { page } from '$app/state';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import Chart from './Chart.svelte';
	import ChartHorizontal from './ChartHorizontal.svelte';
	import Switch from '$lib/components/Switch.svelte';

	let views = [];
	let activeLayer = null;
	let results = [];
	let loading = true;

	const getData = async () => {
		try {
			const directus = getDirectusInstance();

			const currentId = page.data?.page?.id;
			const parentIds = page.data?.page?.parents?.map((p) => p.id) || [];
			const regionCandidates = [currentId, ...parentIds].filter(Boolean);

			console.log(regionCandidates);

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

			console.log(emissions);

			// Fetch region metadata
			const regions = await directus.request(
				readItems('regions', {
					filter: { id: { _in: regionCandidates } },
					fields: ['id', 'name', 'layer', 'layer_label']
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
			console.log(categories);
			console.log(categoryMap);

			const categoryOrder = (categories ?? []).map((c) => c.code).filter(Boolean); // Ensures only valid codes

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
					const regionData = enriched.filter((d) => d.region === region.id);
					if (regionData.length > 0) {
						return {
							key: region.layer,
							label: region.layer_label + ' ' + region.name,
							layer_label: region.layer_label,
							name: region.name,
							data: regionData,
							categoryOrder
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

	getData().then((fetched) => {
		results = fetched;
		views = results.map((r) => ({ key: r.key, label: r.label }));
		activeLayer = views[0]?.key ?? null;
		loading = false;
	});
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
		{views}
		bind:activeView={activeLayer}
		on:itemClick={(event) => {
			activeLayer = event.detail;
		}}
	/>

	<div class="mt-4">
		{#each results as r}
			{#if r.key === activeLayer}
				{#if new Set(r.data.map((d) => d.year)).size === 1}
					<ChartHorizontal data={r.data} region={r} />
				{:else}
					<Chart data={r.data} region={r} />
				{/if}
			{/if}
		{/each}
	</div>
{/if}
