<script>
	import Map from './Map.svelte';
	import RelatedRegionCard from './RelatedRegionCard.svelte';
	import Inspector from './Inspector.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import Search from './Search.svelte';
	import { colors, scales } from './scales';

	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { PUBLIC_VERSION } from '$env/static/public';

	let minPeriod;
	let maxPeriod;

	$: getData = async () => {
		const directus = getDirectusInstance(fetch);
		const countryCode = PUBLIC_VERSION.toUpperCase();

		// Load car data for selected country
		const data = await directus.request(
			readItems('mobility_cars', {
				filter: {
					country: { _eq: countryCode }
				},
				limit: -1
			})
		);

		// Load regions: all for AT, exclude municipalities for DE
		const regionFilter = {
			country: { _eq: countryCode },
			...(countryCode === 'AT'
				? { layer: { _eq: 'municipality' } }
				: { layer: { _neq: 'municipality' } })
		};

		const regions = await directus.request(
			readItems('regions', {
				filter: regionFilter,
				limit: -1
			})
		);
		// console.log(data);
		// console.log(regions);
		const regionsWithData = regions.map((region) => {
			const regionData = data.filter((d) => d.region === region.code);
			const periods = [
				...new Set(regionData.map((d) => d.period).sort((a, b) => parseInt(a) - parseInt(b)))
			];
			const carsPer1000Inhabitants = periods.map((p) => {
				return {
					period: parseInt(p),
					value: Math.round(
						(regionData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value /
							region.population) *
							1000
					)
				};
			});
			const carsElectricShare = periods.map((p) => {
				return {
					period: parseInt(p),
					value:
						(regionData.find((d) => d.category === 'Elektro' && d.period === p)?.value /
							regionData.find((d) => d.category === 'Insgesamt' && d.period === p)?.value) *
						100
				};
			});
			return { ...region, carsPer1000Inhabitants, carsElectricShare };
		});
		console.log(regionsWithData);
		minPeriod = Math.min(...data.map((d) => parseInt(d.period)));
		maxPeriod = Math.max(...data.map((d) => parseInt(d.period)));
		return { data, regions: regionsWithData, minPeriod, maxPeriod };
	};

	$: promise = getData();

	let views = [
		{
			label: 'E-Auto Anteil',
			key: 'electric'
		},
		{
			label: 'Autodichte',
			key: 'pop'
		}
	];

	$: selectedView = views[0].key;

	$: selectedRegion = null;
	$: selectedPeriod = maxPeriod;
	$: relatedRegions = [];

	$: getRelatedRegions = (regions, selectedRegion) => {
		const valueKey = selectedView === 'electric' ? 'carsElectricShare' : 'carsPer1000Inhabitants';

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

		// Min + max
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

		// Combine all
		const all = [minRegion, maxRegion, ...closestRegions];

		// Remove duplicates (e.g. min == nearby)
		const seen = new Set();
		const unique = all.filter((r) => {
			if (seen.has(r.code)) return false;
			if (r.code == selectedRegion) return false;
			seen.add(r.code);
			return true;
		});

		// ✅ Also include Germany if a region is selected
		if (selectedRegion) {
			unique.push({
				...getRegionData(regions, null),
				type: 'national'
			});
		}

		return unique.sort((a, b) => b.value - a.value);
	};

	$: getRegionData = (regions, selectedRegion) => {
		if (selectedRegion) return regions.find((r) => r.code === selectedRegion);

		// Helper: average array of numbers
		const average = (arr) => (arr.length ? arr.reduce((sum, v) => sum + v, 0) / arr.length : null);

		// Get all unique periods from the data
		const allPeriods = Array.from(
			new Set(
				regions.flatMap((r) => [
					...(r.carsPer1000Inhabitants || []).map((d) => d.period),
					...(r.carsElectricShare || []).map((d) => d.period)
				])
			)
		).sort((a, b) => a - b);

		// Create average arrays for each period
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

		const carsElectricShare = allPeriods.map((period) => ({
			period,
			value: average(
				regions
					.map((r) => r.carsElectricShare?.find((d) => d.period === period)?.value)
					.filter((v) => v != null && isFinite(v))
			)
		}));

		return {
			code: 'ALL',
			label: 'Deutschland',
			name: 'Deutschland',
			type: 'national',
			typeLabel: 'Nationaler Durchschnitt',
			center: [10.45, 51.1657],
			carsPer1000Inhabitants,
			carsElectricShare
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
	{#if selectedView && selectedPeriod}
		{#await promise then p}
			{@const data = p.data}
			{@const regions = p.regions}
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
								data: selectedView == 'electric' ? d.carsElectricShare : d.carsPer1000Inhabitants
							};
						})}
						colors={colors[selectedView]}
						bind:selectedRegion
						on:selectRegion={(e) => (selectedRegion = e.detail)}
					/>
				</div>
				<div
					class="bg-white dark:bg-gray-900 border border-current/10 shadow p-3 rounded-2xl -mt-10 z-30 relative max-w-3xl mx-auto"
				>
					<Inspector {selectedPeriod} region={getRegionData(regions, selectedRegion)} />
					<Search {regions} {selectedRegion} bind:filteredRegions />
					<ul class="">
						{#if filteredRegions.length > 0}
							{#each filteredRegions as region}
								<RelatedRegionCard bind:selectedRegion {selectedPeriod} {region} />
							{/each}
						{:else}
							{#each getRelatedRegions(regions, selectedRegion) as region}
								<RelatedRegionCard bind:selectedRegion {selectedPeriod} {region} />
							{/each}
						{/if}
					</ul>
				</div>
			</div>
		{/await}
	{/if}
</div>
