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
					category: { _in: ['Privat', 'Firmen', 'Insgesamt'] }
				},
				limit: -1,
				fields: ['period', 'region', 'category', 'value', 'source']
			})
		);

		source = data[0]?.source;

		const layerFilter = countryCode === 'AT' ? 'municipality' : 'district';
		const regions = await getRegions().then((r) =>
			r.filter((r) => r.country === countryCode && r.layer === layerFilter)
		);

		const country = await directus.request(readItem('countries', countryCode));
		const countryName = country?.name_de ?? countryCode;

		const regionsWithData = regions.map((region) => {
			const regionData = data.filter((d) => d.region === region.code);
			const periods = [...new Set(regionData.map((d) => d.period).sort((a, b) => a - b))];

			const carsPer1000Inhabitants = periods.map((p) => {
				const total = regionData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value;
				return {
					period: parseInt(p),
					value: total && region.population ? Math.round((total / region.population) * 1000) : null
				};
			});

			const carsPrivateShare = periods.map((p) => {
				const privat = regionData.find((d) => d.category === 'Privat' && d.period === p)?.value;
				const total = regionData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value;
				return {
					period: parseInt(p),
					value: privat && total ? (privat / total) * 100 : null
				};
			});

			const carsCompanyShare = periods.map((p) => {
				const firmen = regionData.find((d) => d.category === 'Firmen' && d.period === p)?.value;
				const total = regionData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value;
				return {
					period: parseInt(p),
					value: firmen && total ? (firmen / total) * 100 : null
				};
			});

			return {
				...region,
				outline: region.outline_simple,
				carsPer1000Inhabitants,
				carsPrivateShare,
				carsCompanyShare
			};
		});

		const foundRegionCode = findMatchingRegion(page.data.page, regions);
		if (foundRegionCode) selectedRegion = foundRegionCode;

		minPeriod = Math.min(...data.map((d) => parseInt(d.period)));
		maxPeriod = Math.max(...data.map((d) => parseInt(d.period)));
		return { data, regions: regionsWithData, minPeriod, maxPeriod, countryName };
	}

	$: promise = getData();

	let views = [
		{
			label: 'Autodichte',
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

	$: selectedView = views[0].key;
	$: selectedRegion = null;
	$: selectedPeriod = maxPeriod;
	$: relatedRegions = [];

	$: getRelatedRegions = (regions, selectedRegion) => {
		const view = views.find((v) => v.key === selectedView);
		const valueKey = view.dataKey;

		const regionsWithValue = regions
			.map((region) => {
				const match = region[valueKey]?.find((d) => d.period === selectedPeriod);
				return {
					...region,
					value: match?.value ?? null
				};
			})
			.filter((r) => r.value != null && isFinite(r.value));

		if (regionsWithValue.length === 0) return [];

		const sorted = [...regionsWithValue].sort((a, b) => a.value - b.value);
		const minRegion = { ...sorted[0], type: 'min', typeLabel: 'Minimum' };
		const maxRegion = { ...sorted[sorted.length - 1], type: 'max', typeLabel: 'Maximum' };

		let closestRegions = [];

		if (selectedRegion) {
			const selected = regions.find((r) => r.code === selectedRegion);
			if (selected?.center) {
				const haversine = (coord1, coord2) => {
					const toRad = (d) => (d * Math.PI) / 180;
					const R = 6371;
					const dLat = toRad(coord2[1] - coord1[1]);
					const dLon = toRad(coord2[0] - coord1[0]);
					const lat1 = toRad(coord1[1]);
					const lat2 = toRad(coord2[1]);

					const a =
						Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
					const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
					return R * c;
				};

				closestRegions = regionsWithValue
					.filter((r) => r.code !== selectedRegion && r.center)
					.map((r) => ({
						...r,
						distance: haversine(selected.center, r.center)
					}))
					.sort((a, b) => a.distance - b.distance)
					.slice(0, 3)
					.map((r) => ({ ...r, type: 'nearby', typeLabel: 'in der Nähe' }));
			}
		}

		const all = [minRegion, maxRegion, ...closestRegions];
		const seen = new Set();
		const unique = all.filter((r) => {
			if (seen.has(r.code)) return false;
			if (r.code == selectedRegion) return false;
			seen.add(r.code);
			return true;
		});

		if (selectedRegion) {
			unique.push({
				...getRegionData(regions, null),
				type: 'national'
			});
		}

		return unique.sort((a, b) => b.value - a.value);
	};

	$: getRegionData = (regions, selectedRegion, countryName) => {
		if (selectedRegion) return regions.find((r) => r.code === selectedRegion);

		const average = (arr) => (arr.length ? arr.reduce((sum, v) => sum + v, 0) / arr.length : null);

		const allPeriods = Array.from(
			new Set(
				regions.flatMap((r) => [
					...(r.carsPer1000Inhabitants || []).map((d) => d.period),
					...(r.carsPrivateShare || []).map((d) => d.period),
					...(r.carsCompanyShare || []).map((d) => d.period)
				])
			)
		).sort((a, b) => a - b);

		const carsPer1000Inhabitants = allPeriods.map((period) => ({
			period,
			value: Math.round(
				average(
					regions
						.map((r) => r.carsPer1000Inhabitants?.find((d) => d.period === period)?.value)
						.filter((v) => v != null && isFinite(v))
				)
			)
		}));

		const carsPrivateShare = allPeriods.map((period) => ({
			period,
			value: average(
				regions
					.map((r) => r.carsPrivateShare?.find((d) => d.period === period)?.value)
					.filter((v) => v != null && isFinite(v))
			)
		}));

		const carsCompanyShare = allPeriods.map((period) => ({
			period,
			value: average(
				regions
					.map((r) => r.carsCompanyShare?.find((d) => d.period === period)?.value)
					.filter((v) => v != null && isFinite(v))
			)
		}));

		return {
			code: 'ALL',
			label: countryName,
			name: countryName,
			type: 'national',
			typeLabel: 'Nationaler Durchschnitt',
			center: [10.45, 51.1657],
			carsPer1000Inhabitants,
			carsPrivateShare,
			carsCompanyShare
		};
	};

	let filteredRegions = [];
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
	<div class="min-h-[80vh]">
		{#if selectedView && selectedPeriod}
			{#await promise then p}
				{@const data = p.data}
				{@const regions = p.regions}
				{@const countryName = p.countryName}

				<div class="">
					<div class="h-[40vh]">
						<Map
							{selectedPeriod}
							regions={regions.map((d) => {
								return {
									code: d.code,
									outline: d.outline,
									center: d.center,
									name: d.name,
									data:
										selectedView == 'pop'
											? d.carsPer1000Inhabitants
											: selectedView == 'private'
												? d.carsPrivateShare
												: selectedView == 'company'
													? d.carsCompanyShare
													: d.carsPer1000Inhabitants
								};
							})}
							max={selectedView == 'pop' ? 1000 : 100}
							unit={selectedView == 'pop' ? '' : '%'}
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
							region={getRegionData(regions, selectedRegion, countryName)}
						/>
						<Search {regions} {selectedRegion} bind:filteredRegions />
						<ul class="">
							{#if filteredRegions.length > 0}
								{#each filteredRegions as region}
									<RelatedRegionCard bind:selectedRegion {views} {selectedPeriod} {region} />
								{/each}
							{:else}
								{#each getRelatedRegions(regions, selectedRegion) as region}
									<RelatedRegionCard bind:selectedRegion {views} {selectedPeriod} {region} />
								{/each}
							{/if}
						</ul>
						<p class="text-sm opacity-80 mt-4">Datenquelle: {source}</p>
					</div>
				</div>
			{/await}
		{/if}
	</div>
</div>
