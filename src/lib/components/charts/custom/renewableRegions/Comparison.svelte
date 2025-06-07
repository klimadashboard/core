<script>
	import getDirectusInstance from '$lib/utils/directus';
	import LineChart from './LineChart.svelte';
	import RegionSearch from './RegionSearch.svelte';
	import formatNumber from '$lib/stores/formatNumber';
	import Loader from '$lib/components/Loader.svelte';

	import { onMount } from 'svelte';

	export let regions;
	export let region;
	export let selectedEnergy;
	export let colors;

	let loading = false;

	const palette = [
		'#e41a1c',
		'#377eb8',
		'#4daf4a',
		'#984ea3',
		'#ff7f00',
		'#a65628',
		'#f781bf',
		'#999999'
	];

	const getDistance = (center1, center2) => {
		if (!center1 || !center2) return Infinity;
		const toRad = (d) => (d * Math.PI) / 180;
		const R = 6371;
		const dLat = toRad(parseFloat(center2[1]) - parseFloat(center1[1]));
		const dLon = toRad(parseFloat(center2[0]) - parseFloat(center1[0]));
		const lat1 = toRad(parseFloat(center1[1]));
		const lat2 = toRad(parseFloat(center2[1]));
		const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	};

	let municipalities = regions
		.map((r) => ({
			...r,
			distance: r.center && region.center ? getDistance(r.center, region.center) : 0
		}))
		.sort((a, b) => a.distance - b.distance);

	let country = [
		{
			name: 'Deutschland',
			code: 'DE',
			distance: null
		}
	];

	$: searchableRegions = [...country, ...municipalities];

	// Input handling
	let searchTerm = '';
	let debouncedSearchTerm = '';
	let searchTimeout;

	$: {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			debouncedSearchTerm = searchTerm;
		}, 200); // debounce by 200ms
	}

	$: filteredRegions = searchableRegions.filter((r) =>
		r.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
	);

	// Selections and data
	let selectedRegions = [region];
	let data = [];

	const getDataForRegion = async (regionCode = false, selectedEnergy = 'solar') => {
		const url = regionCode
			? `https://base.klimadashboard.org/get-renewables-growth?table=energy_${selectedEnergy}_units&group=year&region=${regionCode}`
			: `https://base.klimadashboard.org/get-renewables-growth?table=energy_${selectedEnergy}_units&group=year`;
		const response = await fetch(url);
		const result = await response.json();
		return result;
	};

	let selectedUnitHasChanged = false;

	// Call getDataForRegion when toggling
	async function toggleSelection(r) {
		if (!selectedUnitHasChanged) {
			selectedUnit = 'perArea';
			selectedUnitHasChanged = true;
		}
		if (isSelected(r)) {
			// Remove region
			selectedRegions = selectedRegions.filter((s) => s.code !== r.code);
			data = data.filter((d) => d.code !== r.code);
		} else {
			loading = true;
			try {
				selectedRegions = [...selectedRegions, r];
				const code = r.layer == 'country' ? null : r.code;
				const result = await getDataForRegion(code, selectedEnergy);
				data = [...data, { code: r.code, name: r.name, data: result }];
			} finally {
				loading = false;
			}
		}
	}

	function isSelected(r) {
		return selectedRegions.find((s) => s.code === r.code);
	}

	// Load initial region data
	onMount(async () => {
		loading = true;
		const code = region.layer == 'country' ? null : region.code;
		const initialData = await getDataForRegion(code, selectedEnergy);
		data = [{ code: region.code, name: region.name, data: initialData }];
		loading = false;
	});

	let selectedUnit = 'absolute';
	let selectedVariable = 'cumulative_power_kw';

	let variables = [
		{
			label: 'absolut',
			key: 'absolute'
		},
		{
			label: 'pro km<sup>2</sup>',
			key: 'perArea'
		}
	];
</script>

<div class="flex items-center gap-2 flex-wrap">
	<RegionSearch {regions} {region} {selectedRegions} on:toggle={(e) => toggleSelection(e.detail)} />

	<div class="bg-gray-100 dark:bg-gray-800 rounded-full p-2 px-3 text-sm inline-flex gap-2">
		{#each variables as variable}
			<label class={selectedUnit == variable.key ? 'font-bold' : ''}
				><input
					type="radio"
					name="unit"
					value={variable.key}
					class="mr-1"
					checked={selectedUnit === variable.key}
					on:change={() => (selectedUnit = variable.key)}
				/>{@html variable.label}</label
			>
		{/each}
	</div>
</div>

<div class="relative min-h-64 mt-2">
	{#if data.length > 0}
		{#if loading}
			<div
				class="absolute inset-0 bg-white/70 flex items-center justify-center z-10 pointer-events-none"
			>
				<Loader />
			</div>
		{/if}
		<div class:opacity-30={loading} class:pointer-events-none={loading}>
			<LineChart
				data={data.map((d, i) => ({
					label: d.name,
					data: d.data.by_year.map((entry) => ({
						...entry,
						value:
							selectedUnit === 'perArea' && region.area
								? entry[selectedVariable] / (regions.find((r) => r.code === d.code)?.area || 1)
								: entry[selectedVariable]
					})),
					color: i === 0 ? colors[1] : palette[(i - 1) % palette.length]
				}))}
			/>
		</div>
	{/if}
</div>
