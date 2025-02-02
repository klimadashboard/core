<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let data;
	export let chart;
	export let selectedStation;

	const presetID = PUBLIC_VERSION == 'at' ? 105 : 403;

	let geoLocationStatus = '';

	// Compute Euclidean distance (for simplicity)
	function getDistance(currentCoords, station) {
		return Math.sqrt(
			Math.pow(currentCoords.latitude - station.latitude, 2) +
				Math.pow(currentCoords.longitude - station.longitude, 2)
		);
	}

	// Find the closest weather station from the provided coordinates
	function getClosestStation(currentCoords) {
		geoLocationStatus = 'Getting closest weather station...';
		const closestStation = data.stations.reduce((a, b) =>
			getDistance(currentCoords, a) < getDistance(currentCoords, b) ? a : b
		);
		selectedStation = closestStation;
		geoLocationStatus = '';
	}

	// Use onMount to access localStorage (which is only available client-side)
	onMount(() => {
		// Try to read coordinates from localStorage
		const coordsStr = localStorage.getItem('kd_region_coordinates');
		if (coordsStr && coordsStr.includes(',')) {
			const [lng, lat] = coordsStr.split(',').map(Number);
			if (!isNaN(lng) && !isNaN(lat)) {
				getClosestStation({ latitude: lat, longitude: lng });
				return;
			}
		}

		// If no valid localStorage coordinates, then check for a URL parameter
		const weatherStationParam = $page.url.searchParams.get('weatherStation');
		if (weatherStationParam) {
			selectedStation = data.stations.find((d) => d.id == weatherStationParam);
			return;
		}

		// Otherwise, default to a preset station
		selectedStation = data.stations.find((d) => d.id == presetID);
	});

	// When a station is selected, update the URL with the weatherStation parameter
	$: if (selectedStation) {
		const url = new URL(window.location);
		url.searchParams.set('weatherStation', selectedStation.id);
		goto(url.toString(), { replaceState: true, noScroll: true });
	}

	// Group options by 'state'
	let groupedOptions = {};
	data.stations.forEach((option) => {
		if (!groupedOptions[option.state]) {
			groupedOptions[option.state] = [];
		}
		groupedOptions[option.state].push(option);
	});
</script>

{#if selectedStation}
	<div class="mx-auto w-max mb-4">
		<p class="text-sm text-gray-700 mb-1 font-medium">Wähle deine Wetterstation</p>
		<div class="flex items-center space-x-2">
			<select
				name="weatherStations"
				id="weatherStations"
				class="k_input k_dropdown max-w-[60vw]"
				bind:value={selectedStation}
			>
				{#each Object.keys(groupedOptions).sort((a, b) => a.localeCompare(b)) as state}
					<optgroup label={state}>
						{#each groupedOptions[state].sort((a, b) => a.name.localeCompare(b.name)) as station}
							<option value={station}>{station.name} ({station.height}m)</option>
						{/each}
					</optgroup>
				{/each}
			</select>

			<button
				aria-label="Find nearest weather station"
				class="k_input"
				on:mousedown={getCurrentPosition()}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icon icon-tabler icon-tabler-current-location w-4 h-4 my-1"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					fill="none"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<circle cx="12" cy="12" r="3" />
					<circle cx="12" cy="12" r="8" />
					<line x1="12" y1="2" x2="12" y2="4" />
					<line x1="12" y1="20" x2="12" y2="22" />
					<line x1="20" y1="12" x2="22" y2="12" />
					<line x1="2" y1="12" x2="4" y2="12" />
				</svg>
				<span>{geoLocationStatus}</span>
			</button>
		</div>
	</div>
{/if}
