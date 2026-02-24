<script lang="ts" context="module">
	import { writable } from 'svelte/store';
	import type { Region } from '$lib/utils/getRegion';

	export interface RegionContext {
		region: Region | null;
		loading: boolean;
	}

	export const REGION_CONTEXT_KEY = 'region-context';
</script>

<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { page } from '$app/state';
	import { fetchRegion } from '$lib/utils/getRegion';

	/** Explicit region ID prop */
	export let regionId: string | null = null;

	const store = writable<RegionContext>({ region: null, loading: true });
	setContext(REGION_CONTEXT_KEY, store);

	// Derive effective region ID
	$: urlRegionId = page?.url?.searchParams?.get('region');
	$: pageRegionId = page?.data?.page?.id;
	$: effectiveId = regionId || urlRegionId || pageRegionId || null;

	// Load region when ID changes
	$: if (effectiveId !== undefined) {
		loadRegion(effectiveId);
	}

	async function loadRegion(id: string | null) {
		store.set({ region: null, loading: true });

		if (!id) {
			store.set({ region: null, loading: false });
			return;
		}

		try {
			// Check page data first
			const pageRegion = page?.data?.page;
			if (pageRegion && (pageRegion.id === id || pageRegion.code === id)) {
				store.set({
					region: {
						id: pageRegion.id,
						code: pageRegion.code,
						codeShort: pageRegion.codeShort || pageRegion.code_short,
						name: pageRegion.name,
						layer: pageRegion.layer,
						center: pageRegion.center,
						area_km2: pageRegion.area_km2,
						population: pageRegion.population,
						parents: pageRegion.parents
					},
					loading: false
				});
				return;
			}

			// Fetch from API
			const region = await fetchRegion(id);
			store.set({ region, loading: false });
		} catch (err) {
			console.error('Failed to load region:', err);
			store.set({ region: null, loading: false });
		}
	}

	onMount(() => {
		if (!effectiveId) {
			store.set({ region: null, loading: false });
		}
	});
</script>

<slot region={$store.region} loading={$store.loading} />
