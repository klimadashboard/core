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

	$: console.log(data);

	const getDataForRegion = async (regionCode = false, selectedEnergy = 'solar') => {
		const url = regionCode
			? `https://base.klimadashboard.org/get-renewables-growth?table=energy_${selectedEnergy}_units&group=year&region=${regionCode}`
			: `https://base.klimadashboard.org/get-renewables-growth?table=energy_${selectedEnergy}_units&group=year`;
		const response = await fetch(url);
		const result = await response.json();
		return result;
	};

	// Call getDataForRegion when toggling
	async function toggleSelection(r) {
		if (isSelected(r)) {
			// Remove region
			selectedRegions = selectedRegions.filter((s) => s.code !== r.code);
			data = data.filter((d) => d.code !== r.code);
		} else {
			loading = true;
			try {
				selectedRegions = [...selectedRegions, r];
				const result = await getDataForRegion(r.code, selectedEnergy);
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
		const initialData = await getDataForRegion(region.code, selectedEnergy);
		data = [{ code: region.code, name: region.name, data: initialData }];
		loading = false;
	});

	let selectedUnit = 'absolute';
</script>

<div class="flex items-center gap-4">
	<RegionSearch {regions} {region} {selectedRegions} on:toggle={(e) => toggleSelection(e.detail)} />

	<div class="bg-gray-100 dark:bg-gray-800 rounded-full p-1 text-sm inline-block">
		<label
			><input
				type="radio"
				name="unit"
				value="absolute"
				checked={selectedUnit === 'absolute'}
				on:change={() => (selectedUnit = 'absolute')}
			/>Absolute</label
		>
		<label
			><input
				type="radio"
				name="unit"
				value="perArea"
				checked={selectedUnit === 'perArea'}
				on:change={() => (selectedUnit = 'perArea')}
			/>Per Area</label
		>
	</div>
</div>

{#if data.length > 0}
	<div class="relative">
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
								? entry.value / (regions.find((r) => r.code === d.code)?.area || 1)
								: entry.value
					})),
					color: i === 0 ? colors[1] : palette[(i - 1) % palette.length]
				}))}
			/>
		</div>
	</div>
{/if}
