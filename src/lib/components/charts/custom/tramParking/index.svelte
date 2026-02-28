<script>
	import { onMount } from 'svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import Loader from '$lib/components/Loader.svelte';
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';
	import DateRangeSlider from './DateRangeSlider.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import { detectHotspots } from './hotspots';

	export let onChartData = undefined;

	let allIncidents = [];
	let tramLines = null;
	let tramStops = null;
	let busLines = null;
	let busStops = null;
	let nightbusLines = null;
	let nightbusStops = null;
	let districts = null;
	let loading = true;
	let error = null;

	let startDate = '2025-01-01';
	let endDate = '2025-12-31';
	let selectedDistrict = null;
	let selectedIncident = null;
	let selectedHotspot = null;

	// Line type filter: controls both map layers AND incident filtering
	let showBim = true;
	let showBus = true;
	let showNachtbus = true;

	/** Classify a transit line name as bim, bus, or nachtbus */
	function classifyLine(line) {
		const l = line.trim();
		if (/^N\d/i.test(l)) return 'nachtbus';
		if (/^\d+[A-Z]$/i.test(l)) return 'bus';
		return 'bim';
	}

	/** Check if an incident has at least one line matching enabled types */
	function incidentMatchesLineFilter(incident) {
		if (!incident.lines) return true; // no line info → always show
		const lines = incident.lines.split(',').map((l) => l.trim()).filter(Boolean);
		if (lines.length === 0) return true;
		return lines.some((l) => {
			const type = classifyLine(l);
			if (type === 'bim' && showBim) return true;
			if (type === 'bus' && showBus) return true;
			if (type === 'nachtbus' && showNachtbus) return true;
			return false;
		});
	}

	let mapComponent;
	let mapWrapper;
	let fullscreen = false;

	function toggleFullscreen() {
		if (!mapWrapper) return;
		if (!document.fullscreenElement) {
			mapWrapper.requestFullscreen().then(() => {
				fullscreen = true;
				setTimeout(() => mapComponent?.invalidateSize(), 100);
			}).catch(() => {});
		} else {
			document.exitFullscreen().then(() => {
				fullscreen = false;
				setTimeout(() => mapComponent?.invalidateSize(), 100);
			}).catch(() => {});
		}
	}

	function handleFullscreenChange() {
		fullscreen = !!document.fullscreenElement;
		setTimeout(() => mapComponent?.invalidateSize(), 100);
	}

	// Filter incidents by date range, district, and line type
	// Reference showBim/showBus/showNachtbus directly so Svelte tracks them
	$: filteredIncidents = (() => {
		const _bim = showBim, _bus = showBus, _nacht = showNachtbus;
		return allIncidents.filter((i) => {
			const date = i.date_start?.slice(0, 10);
			if (!date) return false;
			if (date < startDate || date > endDate) return false;
			if (selectedDistrict != null && i.district !== selectedDistrict) return false;
			if (!incidentMatchesLineFilter(i)) return false;
			return true;
		});
	})();

	// Only geocoded incidents for the map
	$: mapIncidents = filteredIncidents.filter((i) => i.lat != null && i.lon != null);

	// Compute hotspots from filtered geocoded incidents
	$: hotspots = detectHotspots(mapIncidents);

	onMount(async () => {
		try {
			const [incidentsData, linesData, stopsData, districtsData, busLinesData, busStopsData, nightbusLinesData, nightbusStopsData] = await Promise.all([
				fetchIncidents(),
				fetch('https://base.klimadashboard.org/assets/a88d573b-a489-4f70-8d2b-dba1457b1329').then((r) => r.json()),
				fetch('https://base.klimadashboard.org/assets/9255ae4e-7496-4f05-bd8f-26a6394c3494').then((r) => r.json()),
				fetch('https://base.klimadashboard.org/assets/bffb703f-85ba-4c75-b471-833da8f4c3ac').then((r) => r.json()),
				fetch('https://base.klimadashboard.org/assets/50a46351-765e-407f-b0f4-7e4caf557e84').then((r) => r.json()),
				fetch('https://base.klimadashboard.org/assets/252d6371-cd2a-468d-9933-6a59d555232a').then((r) => r.json()),
				fetch('https://base.klimadashboard.org/assets/a9eec122-84d1-4e90-b366-055d8d0da93c').then((r) => r.json()),
				fetch('https://base.klimadashboard.org/assets/415f6188-01fd-4e08-b0c1-29759ce0e14e').then((r) => r.json())
			]);

			allIncidents = incidentsData;
			tramLines = linesData;
			tramStops = stopsData;
			districts = districtsData;
			busLines = busLinesData;
			busStops = busStopsData;
			nightbusLines = nightbusLinesData;
			nightbusStops = nightbusStopsData;
			loading = false;

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
						source: 'Wiener Linien Störungsmeldungen, f59.at'
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

	// District dropdown options for Select component
	$: districtSelectOptions = districts
		? [
				{ value: '', label: 'Alle Bezirke' },
				...districts.features
					.map((f) => ({ value: String(f.properties.number), label: f.properties.label }))
					.sort((a, b) => Number(a.value) - Number(b.value))
			]
		: [{ value: '', label: 'Alle Bezirke' }];

	let districtSelectValue = '';

	function handleDistrictSelect(e) {
		const val = e.detail;
		handleSelectDistrict({ detail: val ? parseInt(val) : null });
	}

	// Keep select value in sync with selectedDistrict
	$: districtSelectValue = selectedDistrict != null ? String(selectedDistrict) : '';
</script>

<svelte:document on:fullscreenchange={handleFullscreenChange} />

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

			<div class="flex items-center gap-3">
				<Checkbox label="Bim" bind:checked={showBim} />
				<Checkbox label="Bus" bind:checked={showBus} />
				<Checkbox label="Nachtbus" bind:checked={showNachtbus} />
			</div>

			<div class="ml-auto">
				<Select
					label="Bezirk"
					hideLabel
					bind:value={districtSelectValue}
					options={districtSelectOptions}
					on:change={handleDistrictSelect}
					small
				/>
			</div>
		</div>

		<!-- Map -->
		<div
			bind:this={mapWrapper}
			class="rounded-xl overflow-hidden border border-current/10 relative transition-all duration-300
				{fullscreen ? 'h-screen bg-white dark:bg-gray-900' : 'h-[40vh]'}"
		>
			<Map
				bind:this={mapComponent}
				incidents={mapIncidents}
				{selectedDistrict}
				{selectedHotspot}
				tramLines={showBim ? tramLines : null}
				tramStops={showBim ? tramStops : null}
				busLines={showBus ? busLines : null}
				busStops={showBus ? busStops : null}
				nightbusLines={showNachtbus ? nightbusLines : null}
				nightbusStops={showNachtbus ? nightbusStops : null}
				{districts}
				on:selectDistrict={handleSelectDistrict}
				on:selectIncident={handleSelectIncident}
				on:selectHotspot={handleSelectHotspot}
			/>
			<button
				class="absolute top-2 right-2 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
				on:click={toggleFullscreen}
				title={fullscreen ? 'Vollbild beenden' : 'Vollbild'}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					{#if fullscreen}
						<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
					{:else}
						<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
					{/if}
				</svg>
			</button>
		</div>

		<!-- Inspector -->
		<Inspector
			incidents={filteredIncidents}
			{hotspots}
			{selectedDistrict}
			{selectedIncident}
			{selectedHotspot}
			{districts}
			{startDate}
			{endDate}
			{showBim}
			{showBus}
			{showNachtbus}
			on:selectDistrict={handleSelectDistrict}
			on:selectIncident={handleSelectIncident}
			on:selectHotspot={handleSelectHotspot}
			on:clearSelection={handleClearSelection}
		/>
	</div>
{/if}
