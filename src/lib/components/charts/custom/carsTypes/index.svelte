<script>
	import Map from './Map.svelte';
	import RelatedRegionCard from './RelatedRegionCard.svelte';
	import Inspector from './Inspector.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import Search from './Search.svelte';
	import { colors } from './scales';
	import { findMatchingRegion } from '$lib/utils/findMatchingRegion';
	import { page } from '$app/state';

	import { getRegions } from '$lib/utils/regions';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItem, readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';

	let minPeriod;
	let maxPeriod;
	let source;

	async function getData() {
		const directus = getDirectusInstance(fetch);
		const countryCode = PUBLIC_VERSION.toUpperCase();

		const data = await directus.request(
			readItems('mobility_cars', {
				filter: {
					country: { _eq: countryCode },
					category: { _in: ['Elektro', 'Plug-in-Hybrid', 'Benzin', 'Diesel', 'Insgesamt'] }
				},
				limit: -1,
				fields: ['period', 'region', 'category', 'value', 'source']
			})
		);

		source = data[0].source;

		const regions = await getRegions();

		const layerFilter = countryCode === 'AT' ? 'municipality' : 'district';
		const filteredRegions = regions
			.filter(
				(r) => r.country === countryCode && (r.layer === layerFilter || r.layer === 'country')
			)
			.filter((region, index, self) => self.findIndex((r) => r.code === region.code) === index);

		const country = await directus.request(readItem('countries', countryCode));
		const countryName = country?.name_de ?? countryCode;

		const regionsWithData = filteredRegions.map((region) => {
			const regionData = data.filter((d) => d.region === region.code);
			const periods = [
				...new Set(regionData.map((d) => d.period).sort((a, b) => parseInt(a) - parseInt(b)))
			];

			const absoluteByCategory = {};
			const sharesByCategory = {};

			['Elektro', 'Plug-in-Hybrid', 'Benzin', 'Diesel'].forEach((category) => {
				absoluteByCategory[category] = periods.map((p) => {
					const val = regionData.find((d) => d.category === category && d.period === p)?.value || 0;
					return { period: parseInt(p), value: val };
				});
				sharesByCategory[category] = periods.map((p, i) => {
					const total =
						regionData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value || 0;
					const val = absoluteByCategory[category][i]?.value || 0;
					return { period: parseInt(p), value: total > 0 ? (val / total) * 100 : 0 };
				});
			});

			absoluteByCategory['Sonstige'] = periods.map((p, i) => {
				const total =
					regionData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value || 0;
				const knownSum = ['Elektro', 'Plug-in-Hybrid', 'Benzin', 'Diesel']
					.map((cat) => absoluteByCategory[cat]?.[i]?.value || 0)
					.reduce((a, b) => a + b, 0);
				return { period: parseInt(p), value: total - knownSum };
			});

			sharesByCategory['Sonstige'] = periods.map((p, i) => {
				const total =
					regionData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value || 0;
				const val = absoluteByCategory['Sonstige'][i]?.value || 0;
				return { period: parseInt(p), value: total > 0 ? (val / total) * 100 : 0 };
			});

			return {
				...region,
				outline: region.outline_simple,
				absoluteByCategory,
				sharesByCategory
			};
		});

		const nationalRegion = regionsWithData.find((r) => r.layer === 'country');
		selectedRegion = nationalRegion?.code;

		const foundRegionCode = findMatchingRegion(page.data.page, regionsWithData);
		if (foundRegionCode) selectedRegion = foundRegionCode;

		minPeriod = Math.min(...data.map((d) => parseInt(d.period)));
		maxPeriod = Math.max(...data.map((d) => parseInt(d.period)));

		return { data, regions: regionsWithData, minPeriod, maxPeriod, countryName };
	}

	$: promise = getData();

	let views = [
		{
			label: 'Elektro',
			key: 'Elektro',
			colorKey: 'electric',
			chart: 'progressBar',
			min: 0,
			max: 20,
			selected: selectedView === 'Elektro'
		},
		{
			label: 'Plug-in-Hybrid',
			key: 'Plug-in-Hybrid',
			colorKey: 'hybrid',
			chart: 'progressBar',
			min: 0,
			max: 20,
			selected: selectedView === 'Plug-in-Hybrid'
		},
		{
			label: 'Benzin',
			key: 'Benzin',
			colorKey: 'benzin',
			chart: 'progressBar',
			min: 0,
			max: 80,
			selected: selectedView === 'Benzin'
		},
		{
			label: 'Diesel',
			key: 'Diesel',
			colorKey: 'diesel',
			chart: 'progressBar',
			min: 0,
			max: 80,
			selected: selectedView === 'Diesel'
		},
		{
			label: 'Sonstige',
			key: 'Sonstige',
			colorKey: 'other',
			chart: 'progressBar',
			min: 0,
			max: 10,
			selected: selectedView === 'Sonstige'
		}
	];

	$: selectedView = views[0].key;
	$: selectedRegion = selectedRegion;
	$: selectedPeriod = maxPeriod;

	function getSelectedRegionData(promise, selectedRegion) {
		if (!promise) return [];

		let region = promise.regions.find((r) => r.code === selectedRegion);
		const isNationalRegion = region?.layer === 'country' || !region || !region.absoluteByCategory;

		if (isNationalRegion) {
			const subregions = promise.regions.filter((r) => r.layer !== 'country');

			const allPeriods = [
				...new Set(
					subregions.flatMap((r) =>
						Object.values(r.absoluteByCategory || {}).flatMap((arr) => arr.map((d) => d.period))
					)
				)
			].sort((a, b) => a - b);

			return views.map((v) => {
				const history = allPeriods.map((period) => {
					const absolutes = subregions.map(
						(r) => r.absoluteByCategory[v.key]?.find((d) => d.period === period)?.value || 0
					);

					const percentages = subregions.map(
						(r) => r.sharesByCategory[v.key]?.find((d) => d.period === period)?.value || 0
					);

					const absolute = absolutes.length
						? absolutes.reduce((a, b) => a + b, 0) / absolutes.length
						: null;
					const percentage = percentages.length
						? percentages.reduce((a, b) => a + b, 0) / percentages.length
						: null;

					return { period, absolute, percentage };
				});

				return {
					label: v.label,
					key: v.key,
					selected: v.key === selectedView,
					color: colors?.[v.colorKey]?.[1],
					history
				};
			});
		}

		// Default: return data for selected region
		return views.map((v) => {
			return {
				label: v.label,
				key: v.key,
				color: colors?.[v.colorKey]?.[1],
				selected: v.key === selectedView,
				history: region.absoluteByCategory[v.key].map((d, i) => ({
					period: d.period,
					absolute: d.value,
					percentage: region.sharesByCategory[v.key][i].value
				}))
			};
		});
	}
</script>

<div>
	<div class="flex flex-col items-center space-y-2">
		<div class="flex gap-2">
			<input
				type="range"
				class="w-20"
				min={minPeriod}
				max={maxPeriod}
				bind:value={selectedPeriod}
			/>
			<span>{selectedPeriod}</span>
		</div>
		<Switch
			type="small"
			{views}
			bind:activeView={selectedView}
			on:itemClick={(event) => {
				selectedView = event.detail;
			}}
		/>
	</div>
	<div class="min-h-[60vh]">
		{#if selectedView && selectedPeriod}
			{#await promise then p}
				{@const regions = p.regions}
				{@const selectedViewT = views.find((v) => v.key === selectedView)}
				<div class="">
					<div class="h-[40vh]">
						<Map
							{selectedPeriod}
							regions={regions.map((d) => ({
								code: d.code,
								outline: d.outline,
								center: d.center,
								layer: d.layer,
								name: d.name,
								data: d.sharesByCategory[selectedView]
							}))}
							colors={colors[selectedViewT.colorKey]}
							min={selectedViewT.min}
							max={selectedViewT.max}
							bind:selectedRegion
							on:selectRegion={(e) => (selectedRegion = e.detail)}
						/>
					</div>
					<div
						class="bg-white dark:bg-gray-900 border border-current/10 shadow p-3 rounded-2xl -mt-10 z-30 relative max-w-3xl mx-auto"
					>
						<Inspector
							selectedRegionData={getSelectedRegionData(p, selectedRegion)}
							region={regions.find((d) => d.code === selectedRegion)}
							{selectedPeriod}
						/>
						<p class="text-sm opacity-80 mt-4">Datenquelle: {source}</p>
					</div>
				</div>
			{/await}
		{/if}
	</div>
</div>
