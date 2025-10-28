<script>
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import { colors } from './scales';
	import { findMatchingRegion } from '$lib/utils/findMatchingRegion';
	import { page } from '$app/state';
	import Loader from '$lib/components/Loader.svelte';

	import { getRegions } from '$lib/utils/regions';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItem } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';

	let minPeriod;
	let maxPeriod;
	let source;
	let countryName;
	let regions = [];
	let selectedPeriodIndex;
	let periods = [];

	$: console.log(page.data);

	const availableLayers = [
		{
			layer: 'municipality',
			layers: 'municipalities'
		},
		{
			layer: 'district',
			layers: 'districts'
		}
	];

	// NEW: layer switching (matches Map.svelte)
	let selectedLayer =
		PUBLIC_VERSION.toUpperCase() === 'AT'
			? availableLayers.find((d) => d.layer == page.data.page?.layer)?.layers
			: 'districts';
	let previousLayer = selectedLayer;

	const LAYER_TO_ENDPOINT = {
		municipalities: 'municipality',
		districts: 'district'
	};

	const viewPresets = [
		{ label: 'Elektro', key: 'Elektro', colorKey: 'electric', publicVersions: ['at', 'de'] },
		{ label: 'Hybrid', key: 'Hybrid', colorKey: 'hybrid', publicVersions: ['at'] },
		{
			label: 'Plug-in-Hybrid',
			key: 'Plug-in-Hybrid',
			colorKey: 'plugInHybrid',
			publicVersions: ['de']
		},
		{
			label: 'Hybrid (ohne Plug-in)',
			key: 'Hybrid (ohne Plug-in)',
			colorKey: 'hybrid',
			publicVersions: ['de']
		},
		{ label: 'Benzin', key: 'Benzin', colorKey: 'benzin', publicVersions: ['at', 'de'] },
		{ label: 'Diesel', key: 'Diesel', colorKey: 'diesel', publicVersions: ['at', 'de'] },
		{ label: 'Sonstige', key: 'Sonstige', colorKey: 'other', publicVersions: ['at', 'de'] }
	];

	$: views = viewPresets.filter((v) => v.publicVersions.includes(PUBLIC_VERSION));

	// reactive defaults (run once on init)
	$: selectedView = views[0].key;
	$: selectedRegion = null;

	function normalizeNumber(v) {
		const n = Number(v);
		return Number.isFinite(n) ? n : 0;
	}

	function yearsFromEndpointData(obj) {
		// obj shape: { "2019": { "Benzin": 2, "Diesel": 1, ... }, "2025": {...}, ... }
		return Object.keys(obj || {})
			.map((y) => parseInt(y))
			.filter((y) => Number.isFinite(y))
			.sort((a, b) => a - b);
	}

	// load data reactively (also depends on selectedLayer)
	$: promise = getData(selectedLayer);

	async function getData(layerKey /* 'municipalities' | 'districts' */) {
		const directus = getDirectusInstance(fetch);
		const countryCode = PUBLIC_VERSION.toUpperCase();

		const targetLayer = LAYER_TO_ENDPOINT[layerKey];

		// 1) fetch aggregated data from the new endpoint (with meta)
		const url = `https://base.klimadashboard.org/get-mobility-cars?layer=${encodeURIComponent(targetLayer)}&country=${encodeURIComponent(countryCode)}&includeMeta=true`;

		const resp = await fetch(url);
		if (!resp.ok) {
			throw new Error(`Endpoint error ${resp.status}`);
		}
		/** @type {Array<{ region: {id:string, name?:string, layer?:string, country?:string, code?:string, code_short?:string}, aggregated_from?: string, data: Record<string, Record<string, number>> }>} */
		const agg = await resp.json();

		// 2) get region metadata (outlines, centers, etc.)
		const allRegions = await getRegions();
		// include the country polygon too (you rely on it later)
		const filtered = allRegions
			.filter(
				(r) => r.country === countryCode && (r.layer === targetLayer || r.layer === 'country')
			)
			// unique by code (as before)
			.filter((r, i, arr) => arr.findIndex((rr) => rr.code === r.code) === i);

		// country name (as before)
		countryName = 'TODO';

		// 3) compute periods across all regions from endpoint
		const allPeriods = Array.from(
			new Set(agg.flatMap((item) => yearsFromEndpointData(item.data)))
		).sort((a, b) => a - b);

		periods = allPeriods;
		selectedPeriodIndex = periods.length - 1;

		// 4) source label
		if (PUBLIC_VERSION === 'de') {
			source =
				"<a href='https://www-genesis.destatis.de/datenbank/online/url/802b92c5'>Kraftfahrtbundesamt (2025)</a>";
		} else {
			source = 'STATISTIK AUSTRIA (Bestand, diverse Jahre)';
		}

		// 5) transform endpoint payload into the same per-region shape you pass to sub-components
		const catsForCalc = views.filter((d) => d.key !== 'Sonstige').map((d) => d.key);

		const totalForYear = (regionDataObj, year) =>
			normalizeNumber(regionDataObj?.[String(year)]?.['Insgesamt']);

		const regionsWithData = filtered.map((regionMeta) => {
			const match =
				agg.find((a) => a.region?.code && a.region.code === regionMeta.code) ||
				agg.find((a) => a.region?.code_short && a.region.code_short === regionMeta.code);

			const regionDataObj = match?.data || {};

			const absoluteByCategory = {};
			const sharesByCategory = {};

			catsForCalc.forEach((catKey) => {
				absoluteByCategory[catKey] = periods.map((p) => {
					const v = normalizeNumber(regionDataObj?.[String(p)]?.[catKey]);
					return { period: p, value: v };
				});
				sharesByCategory[catKey] = absoluteByCategory[catKey].map(({ period, value }) => {
					const total = totalForYear(regionDataObj, period);
					return { period, value: total > 0 ? (value / total) * 100 : 0 };
				});
			});

			// Sonstige = Gesamt − known
			absoluteByCategory.Sonstige = periods.map((p, i) => {
				const total = totalForYear(regionDataObj, p);
				const known = catsForCalc
					.map((k) => absoluteByCategory[k]?.[i]?.value || 0)
					.reduce((a, b) => a + b, 0);
				return { period: p, value: Math.max(0, total - known) };
			});

			sharesByCategory.Sonstige = absoluteByCategory.Sonstige.map(({ period, value }) => {
				const total = totalForYear(regionDataObj, period);
				return { period, value: total > 0 ? (value / total) * 100 : 0 };
			});

			return {
				...regionMeta,
				outline: regionMeta.outline_simple,
				center: regionMeta.center,
				layer: regionMeta.layer, // municipality or district or country
				name: regionMeta.name,
				parents: regionMeta.parents, // keep parents for selection logic
				absoluteByCategory,
				sharesByCategory
			};
		});

		regions = regionsWithData;

		// initial region selection logic (first load or when layer changes)
		updateSelectedRegionAfterLayerChange();

		// global min/max years
		minPeriod = Math.min(...periods);
		maxPeriod = Math.max(...periods);

		// sanity: warn on unknown categories
		const allCategories = Array.from(
			new Set(
				agg.flatMap((a) => Object.values(a.data || {}).flatMap((byCat) => Object.keys(byCat || {})))
			)
		);
		const knownCategories = [
			'Elektro',
			'Benzin',
			'Diesel',
			'Insgesamt',
			'Hybrid',
			'Plug-in-Hybrid',
			'Hybrid (ohne Plug-in)',
			'Hybrid (ohne Plug-in)',
			'Hybrid (ohne Plug-In)'
		];
		const unknownCategories = allCategories.filter((cat) => !knownCategories.includes(cat));
		if (unknownCategories.length > 0) {
			console.warn('🚨 Unknown vehicle categories found in endpoint data:', unknownCategories);
		}

		return { regions, minPeriod, maxPeriod, countryName };
	}

	// --- Layer-aware region selection (implements your rule set #71) ---
	function updateSelectedRegionAfterLayerChange() {
		// If nothing selected yet → country or page match
		const national = regions.find((r) => r.layer === 'country');

		// Try page context first (if it exists and matches current layer)
		const pageCode = page?.data?.page?.code;
		if (pageCode) {
			const inLayer = regions.find((r) => r.code === pageCode);
			if (inLayer) {
				selectedRegion = inLayer.code;
				return;
			}
		}

		// If we already have a selection, try to preserve intent across layers
		const prevLayer = previousLayer;
		const nextLayer = selectedLayer;
		const currentObj = regions.find((r) => r.code === selectedRegion);

		// If we had no valid selection object, fall back to page match or country
		if (!currentObj) {
			const match = findMatchingRegion(page.data.page, regions);
			selectedRegion = match ?? national?.code ?? selectedRegion;
			previousLayer = selectedLayer;
			return;
		}

		// Determine direction (municipalities < districts)
		const order = { municipalities: 0, districts: 1 };
		const movingUp = order[prevLayer] < order[nextLayer];
		const movingDown = order[prevLayer] > order[nextLayer];

		// Moving up: pick parent in target layer
		if (movingUp && Array.isArray(currentObj.parents)) {
			const targetSingular = LAYER_TO_ENDPOINT[selectedLayer]; // 'district' | 'municipality'
			const parent = currentObj.parents.find((p) => p.layer === targetSingular);
			if (parent) {
				const match = regions.find((r) => r.id === parent.id);
				if (match) {
					selectedRegion = match.code;
					previousLayer = selectedLayer;
					return;
				}
			}
		}

		// Moving down: pick any child under the previously selected region
		if (movingDown) {
			const targetSingular = LAYER_TO_ENDPOINT[selectedLayer];
			const child = regions
				.slice()
				.sort((a, b) => a.code.localeCompare(b.code))
				.find((r) => r.layer === targetSingular && r.parents?.some((p) => p.id === currentObj.id));
			if (child) {
				selectedRegion = child.code;
				previousLayer = selectedLayer;
				return;
			}
		}

		// Same layer or no mapping → keep if exists in this layer, else country
		const stillExists = regions.find((r) => r.code === selectedRegion);
		if (!stillExists) {
			selectedRegion = national?.code ?? selectedRegion;
		}
		previousLayer = selectedLayer;
	}

	function getSelectedRegionData(p, selCode) {
		if (!p) return [];

		const region = p.regions.find((r) => r.code === selCode);
		const isCountry = !region || region.layer === 'country';

		if (isCountry) {
			const subs = p.regions.filter((r) => r.layer !== 'country');
			const allP = Array.from(
				new Set(
					subs.flatMap((r) =>
						Object.values(r.absoluteByCategory).flatMap((arr) => arr.map((d) => d.period))
					)
				)
			).sort((a, b) => a - b);

			return views.map((v) => {
				const history = allP.map((period) => {
					const abs = subs.map(
						(r) =>
							r.absoluteByCategory[v.key]?.find((d) => String(d.period) === String(period))
								?.value || 0
					);
					const pct = subs.map(
						(r) =>
							r.sharesByCategory[v.key]?.find((d) => String(d.period) === String(period))?.value ||
							0
					);
					return {
						period,
						absolute: abs.reduce((a, b) => a + b, 0),
						percentage: pct.reduce((a, b) => a + b, 0) / (pct.length || 1)
					};
				});
				return {
					label: v.label,
					key: v.key,
					selected: v.key === selectedView,
					color: colors[v.colorKey][1],
					history
				};
			});
		}

		return views.map((v) => ({
			label: v.label,
			key: v.key,
			selected: v.key === selectedView,
			color: colors[v.colorKey][1],
			history: region.absoluteByCategory[v.key].map((d, i) => ({
				period: d.period,
				absolute: d.value,
				percentage: region.sharesByCategory[v.key][i].value
			}))
		}));
	}

	$: selectedPeriod = periods[selectedPeriodIndex];

	function extentForViewAcrossYears(regs, viewKey) {
		// ignore the country rollup so the scale reflects subregions only
		const vals = regs
			.filter((r) => r.layer !== 'country')
			.flatMap((r) => r.sharesByCategory?.[viewKey]?.map((d) => d.value) ?? [])
			.filter((v) => Number.isFinite(v));

		if (!vals.length) return [0, 0];
		return [Math.min(...vals), Math.max(...vals)];
	}
</script>

<div>
	<div class="flex flex-col items-center space-y-2">
		<div class="flex gap-2">
			<input
				type="range"
				class="w-20"
				min={0}
				max={periods.length - 1}
				step={1}
				bind:value={selectedPeriodIndex}
				aria-label="Zeitraum"
			/>
			<span>{selectedPeriod}</span>
		</div>
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
			<div>
				<div class="h-[40vh]">
					<Map
						{selectedPeriod}
						regions={p.regions.map((r) => ({
							code: r.code,
							outline: r.outline,
							center: r.center,
							layer: r.layer,
							name: r.name,
							data: r.sharesByCategory[selectedView]
						}))}
						colors={colors[views.find((v) => v.key === selectedView).colorKey]}
						min={extentForViewAcrossYears(p.regions, selectedView)[0]}
						max={extentForViewAcrossYears(p.regions, selectedView)[1]}
						bind:selectedRegion
						bind:selectedLayer
						on:changeLayer={() => {}}
						on:selectRegion={(e) => (selectedRegion = e.detail)}
					/>
				</div>
				<div
					class="bg-white dark:bg-gray-900 border border-current/10 shadow p-3 rounded-2xl -mt-10 z-30 relative max-w-3xl mx-auto"
				>
					<Inspector
						selectedRegionData={getSelectedRegionData(p, selectedRegion)}
						region={p.regions.find((r) => r.code === selectedRegion)}
						{selectedPeriod}
					/>
					<p class="text-sm opacity-80 mt-4 leading-tight">
						Datenquelle: {@html source}<br />
						Die Summe beträgt aufgrund von Rundungen nicht unbedingt 100%.
					</p>
				</div>
			</div>
		{:catch err}
			<p class="text-red-600 p-4">Fehler beim Laden der Daten: {err.message}</p>
		{/await}
	</div>
</div>
