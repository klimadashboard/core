<script>
	import { onMount } from 'svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import Loader from '$lib/components/Loader.svelte';
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';
	import DateRangeSlider from './DateRangeSlider.svelte';
	import { detectHotspots } from './hotspots';

	export let onChartData = undefined;

	let allIncidents = [];
	let tramLines = null;
	let tramStops = null;
	let districts = null;
	let loading = true;
	let error = null;

	let startDate = '2025-01-01';
	let endDate = '2025-12-31';
	let selectedDistrict = null;
	let selectedIncident = null;
	let selectedHotspot = null;

	let mapComponent;

	// Filter incidents by date range and district
	$: filteredIncidents = allIncidents.filter((i) => {
		const date = i.date_start?.slice(0, 10);
		if (!date) return false;
		if (date < startDate || date > endDate) return false;
		if (selectedDistrict != null && i.district !== selectedDistrict) return false;
		return true;
	});

	// Only geocoded incidents for the map
	$: mapIncidents = filteredIncidents.filter((i) => i.lat != null && i.lon != null);

	// Compute hotspots from filtered geocoded incidents
	$: hotspots = detectHotspots(mapIncidents);

	onMount(async () => {
		try {
			// Load all data in parallel
			const [incidentsData, linesData, stopsData, districtsData] = await Promise.all([
				fetchIncidents(),
				fetch('https://base.klimadashboard.org/assets/a88d573b-a489-4f70-8d2b-dba1457b1329').then(
					(r) => r.json()
				),
				fetch('https://base.klimadashboard.org/assets/9255ae4e-7496-4f05-bd8f-26a6394c3494').then(
					(r) => r.json()
				),
				fetch('https://base.klimadashboard.org/assets/bffb703f-85ba-4c75-b471-833da8f4c3ac').then(
					(r) => r.json()
				)
			]);

			allIncidents = incidentsData;
			tramLines = linesData;
			tramStops = stopsData;
			districts = districtsData;
			loading = false;

			// Send chart data to Card wrapper
			if (onChartData) {
				const total = allIncidents.length;
				const geocoded = allIncidents.filter((i) => i.lat != null).length;
				onChartData({
					raw: allIncidents,
					table: {
						columns: [
							{ key: 'date_start', label: 'Datum' },
							{ key: 'address', label: 'Adresse' },
							{ key: 'lines', label: 'Linien' },
							{ key: 'district', label: 'Bezirk' }
						],
						rows: allIncidents,
						filename: 'falschparker-wien'
					},
					placeholders: { total, geocoded },
					meta: {
						source: 'Wiener Linien Störungsmeldungen / Florian Stancke'
					},
					hasData: true,
					allowDataDownload: true
				});
			}
		} catch (e) {
			console.error('Failed to load tram parking data:', e);
			error = e.message;
			loading = false;
			if (onChartData) onChartData(null);
		}
	});

	async function fetchIncidents() {
		const directus = getDirectusInstance(fetch);

		// Fetch in pages of 5000 (Directus has default limits)
		let all = [];
		let page = 1;
		const limit = 5000;
		while (true) {
			const items = await directus.request(
				readItems('mobility_tram_parking', {
					limit,
					page,
					fields: [
						'id',
						'incident_id',
						'title',
						'description',
						'date_start',
						'date_fix',
						'date_end',
						'lines',
						'stops',
						'address',
						'address_category',
						'lat',
						'lon',
						'address_full',
						'district'
					],
					sort: ['-date_start']
				})
			);
			all = all.concat(items);
			if (items.length < limit) break;
			page++;
		}
		return all;
	}

	function handleDateChange(e) {
		startDate = e.detail.startDate;
		endDate = e.detail.endDate;
		selectedIncident = null;
		selectedHotspot = null;
	}

	function handleSelectDistrict(e) {
		const num = e.detail;
		selectedDistrict = num;
		selectedIncident = null;
		selectedHotspot = null;
		if (num != null && mapComponent) {
			mapComponent.flyToDistrict(num);
		} else if (num == null && mapComponent) {
			mapComponent.resetView();
		}
	}

	function handleSelectIncident(e) {
		selectedIncident = e.detail;
		selectedHotspot = null;
	}

	function handleSelectHotspot(e) {
		selectedHotspot = e.detail;
		selectedIncident = null;
	}

	function handleClearSelection() {
		selectedIncident = null;
		selectedHotspot = null;
	}

	// District dropdown options
	$: districtOptions = districts
		? districts.features
				.map((f) => ({ number: f.properties.number, label: f.properties.label }))
				.sort((a, b) => a.number - b.number)
		: [];
</script>

{#if loading}
	<Loader />
{:else if error}
	<div class="p-8 text-center">
		<p class="text-red-500">Fehler beim Laden: {error}</p>
	</div>
{:else}
	<div class="space-y-4">
		<!-- Controls bar -->
		<div class="flex flex-wrap items-center gap-3">
			<DateRangeSlider {startDate} {endDate} on:change={handleDateChange} />

			<div class="flex items-center gap-1.5 ml-auto">
				<label class="text-sm font-medium opacity-70" for="district-select">Bezirk</label>
				<select
					id="district-select"
					class="text-sm border border-current/15 rounded-lg px-2 py-1 bg-white dark:bg-gray-800"
					value={selectedDistrict ?? ''}
					on:change={(e) =>
						handleSelectDistrict({ detail: e.target.value ? parseInt(e.target.value) : null })}
				>
					<option value="">Alle Bezirke</option>
					{#each districtOptions as d}
						<option value={d.number}>{d.label}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Map -->
		<div class="h-[40vh] rounded-xl overflow-hidden border border-current/10">
			<Map
				bind:this={mapComponent}
				incidents={mapIncidents}
				{hotspots}
				{selectedDistrict}
				{selectedHotspot}
				{tramLines}
				{tramStops}
				{districts}
				on:selectDistrict={handleSelectDistrict}
				on:selectIncident={handleSelectIncident}
				on:selectHotspot={handleSelectHotspot}
			/>
		</div>

		<!-- Inspector -->
		<Inspector
			incidents={filteredIncidents}
			{hotspots}
			{selectedDistrict}
			{selectedIncident}
			{selectedHotspot}
			{districts}
			on:selectDistrict={handleSelectDistrict}
			on:selectIncident={handleSelectIncident}
			on:selectHotspot={handleSelectHotspot}
			on:clearSelection={handleClearSelection}
		/>
	</div>
{/if}
