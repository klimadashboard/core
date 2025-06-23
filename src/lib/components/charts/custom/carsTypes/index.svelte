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
	import { readItem, readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';

	let minPeriod;
	let maxPeriod;
	let source;
	let countryName;
	let regions = [];
	let selectedPeriodIndex;
	let periods = [];

	const views = [
		{
			label: 'Elektro',
			key: 'Elektro',
			colorKey: 'electric',
			chart: 'progressBar',
			min: 0,
			max: 20
		},
		{ label: 'Hybrid', key: 'Hybrid', colorKey: 'hybrid', chart: 'progressBar', min: 0, max: 20 },
		{ label: 'Benzin', key: 'Benzin', colorKey: 'benzin', chart: 'progressBar', min: 0, max: 60 },
		{ label: 'Diesel', key: 'Diesel', colorKey: 'diesel', chart: 'progressBar', min: 0, max: 60 },
		{ label: 'Sonstige', key: 'Sonstige', colorKey: 'other', chart: 'progressBar', min: 0, max: 20 }
	];

	// reactive defaults (run once on init)
	$: selectedView = views[0].key;
	$: selectedRegion = null;

	// load data reactively
	$: promise = getData();

	async function getData() {
		const directus = getDirectusInstance(fetch);
		const countryCode = PUBLIC_VERSION.toUpperCase();

		const data = await directus.request(
			readItems('mobility_cars', {
				filter: {
					country: { _eq: countryCode },
					_or: [
						{ category: { _in: ['Elektro', 'Benzin', 'Diesel', 'Insgesamt'] } },
						{ category: { _contains: 'Hybrid' } }
					]
				},
				limit: -1,
				fields: ['period', 'region', 'category', 'value', 'source']
			})
		);

		const sources = Array.from(new Set(data.map((d) => d.source).filter((s) => s)));
		source = sources.join(', ');

		if (PUBLIC_VERSION === 'de') {
			source =
				"<a href='https://www-genesis.destatis.de/datenbank/online/url/802b92c5'>Kraftfahrtbundesamt (2025)</a>";
		}

		const allRegions = await getRegions();
		const layerFilter = countryCode === 'AT' ? 'municipality' : 'district';

		const filtered = allRegions
			.filter(
				(r) => r.country === countryCode && (r.layer === layerFilter || r.layer === 'country')
			)
			.filter((r, i, arr) => arr.findIndex((rr) => rr.code === r.code) === i);

		const country = await directus.request(readItem('countries', countryCode));
		countryName = country?.name_de ?? countryCode;

		const regionsWithData = filtered.map((region) => {
			const regionData = data.filter((d) => d.region === region.code);
			periods = Array.from(new Set(regionData.map((d) => parseInt(d.period)))).sort(
				(a, b) => a - b
			);
			selectedPeriodIndex = periods.length - 1;

			const absoluteByCategory = {};
			const sharesByCategory = {};
			const cats = ['Elektro', 'Hybrid', 'Benzin', 'Diesel'];

			cats.forEach((catKey) => {
				if (catKey === 'Hybrid') {
					absoluteByCategory.Hybrid = periods.map((p) => {
						const sum = regionData
							.filter((d) => /Hybrid/i.test(d.category) && parseInt(d.period) === p)
							.reduce((acc, d) => acc + d.value, 0);
						return { period: p, value: sum };
					});
					sharesByCategory.Hybrid = absoluteByCategory.Hybrid.map(({ period, value }) => {
						const total =
							regionData.find((d) => d.category === 'Insgesamt' && parseInt(d.period) === period)
								?.value || 0;
						return { period, value: total > 0 ? (value / total) * 100 : 0 };
					});
				} else {
					absoluteByCategory[catKey] = periods.map((p) => {
						const v =
							regionData.find((d) => d.category === catKey && parseInt(d.period) === p)?.value || 0;
						return { period: p, value: v };
					});
					sharesByCategory[catKey] = absoluteByCategory[catKey].map(({ period, value }) => {
						const total =
							regionData.find((d) => d.category === 'Insgesamt' && parseInt(d.period) === period)
								?.value || 0;
						return { period, value: total > 0 ? (value / total) * 100 : 0 };
					});
				}
			});

			// Sonstige = Gesamt − known
			absoluteByCategory.Sonstige = periods.map((p, i) => {
				const total =
					regionData.find((d) => d.category === 'Insgesamt' && parseInt(d.period) === p)?.value ||
					0;
				const known = ['Elektro', 'Plug-in-Hybrid', 'Benzin', 'Diesel']
					.map((k) => absoluteByCategory[k]?.[i]?.value || 0)
					.reduce((a, b) => a + b, 0);
				return { period: p, value: total - known };
			});
			sharesByCategory.Sonstige = absoluteByCategory.Sonstige.map(({ period, value }) => {
				const total =
					regionData.find((d) => d.category === 'Insgesamt' && parseInt(d.period) === period)
						?.value || 0;
				return { period, value: total > 0 ? (value / total) * 100 : 0 };
			});

			return {
				...region,
				outline: region.outline_simple,
				center: region.center,
				layer: region.layer,
				name: region.name,
				absoluteByCategory,
				sharesByCategory
			};
		});

		regions = regionsWithData;

		// pick initial region
		const national = regions.find((r) => r.layer === 'country');
		selectedRegion = national?.code;
		const match = findMatchingRegion(page.data.page, regions);
		if (match) selectedRegion = match;

		minPeriod = Math.min(...data.map((d) => parseInt(d.period)));
		maxPeriod = Math.max(...data.map((d) => parseInt(d.period)));

		return { data, regions, minPeriod, maxPeriod, countryName };
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
						percentage: pct.reduce((a, b) => a + b, 0) / pct.length
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
						min={views.find((v) => v.key === selectedView).min}
						max={views.find((v) => v.key === selectedView).max}
						bind:selectedRegion
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
						Hybrid beinhaltet Plug-In-Hybrid und Hybrid. Die Summe beträgt aufgrund von Rundungen nicht
						unbedingt 100%.
					</p>
				</div>
			</div>
		{:catch err}
			<p class="text-red-600 p-4">Fehler beim Laden der Daten: {err.message}</p>
		{/await}
	</div>
</div>
