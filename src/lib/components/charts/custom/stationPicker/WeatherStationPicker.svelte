<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let data;
	export let selectedStation;

	const presetID = PUBLIC_VERSION == 'at' ? 105 : 403;

	let geoLocationStatus = '';
	let selectedStationID = selectedStation ? selectedStation.id : null;
	let isUserSelection = false; // Flag to track if user manually selected a station

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

		// Only update if the user hasn't manually selected a station
		if (!isUserSelection) {
			selectedStation = closestStation;
			selectedStationID = closestStation.id;
		}

		geoLocationStatus = '';
	}

	onMount(() => {
		// Prevent overriding if the user has already selected a station
		if (selectedStation) {
			selectedStationID = selectedStation.id;
			return;
		}

		const coordsStr = localStorage.getItem('kd_region_coordinates');

		// Fetch from local storage if it exists
		if (coordsStr && coordsStr.includes(',')) {
			const [lng, lat] = coordsStr.split(',').map(Number);
			if (!isNaN(lng) && !isNaN(lat)) {
				getClosestStation({ latitude: lat, longitude: lng });
				return;
			}
		}

		// Check if the weatherStation is in the URL
		const weatherStationParam = $page.url.searchParams.get('weatherStation');
		if (weatherStationParam) {
			const foundStation = data.stations.find((d) => d.id == weatherStationParam);
			if (foundStation) {
				selectedStation = foundStation;
				selectedStationID = foundStation.id;
			}
			return;
		}

		// Default station selection
		selectedStation = data.stations.find((d) => d.id == presetID);
		selectedStationID = presetID;
	});

	// Sync `selectedStation` with `selectedStationID`
	$: {
		const newStation = data.stations.find((s) => s.id == selectedStationID);
		if (newStation && newStation.id !== selectedStation?.id) {
			selectedStation = newStation;
		}
	}

	// Ensure the URL updates correctly (only if user didn't manually override)
	$: if (selectedStation && !isUserSelection) {
		const url = new URL($page.url.href);
		const currentWeatherStation = url.searchParams.get('weatherStation');

		if (currentWeatherStation !== String(selectedStation.id)) {
			url.searchParams.set('weatherStation', selectedStation.id);
			goto(url.toString(), { replaceState: true, noScroll: true });
		}
	}

	// Track user selections manually to prevent automatic overrides
	function handleSelectionChange(event) {
		isUserSelection = true;
		selectedStationID = event.target.value;
	}

	// Group stations by state
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
		<p class="text-sm mb-1 font-medium">Wähle deine Wetterstation</p>
		<div class="flex items-center gap-2">
			<!-- Bind to `selectedStationID` and track user selection -->
			<select
				name="weatherStations"
				id="weatherStations"
				class="input"
				bind:value={selectedStationID}
				on:change={handleSelectionChange}
			>
				{#each Object.keys(groupedOptions).sort((a, b) => a.localeCompare(b)) as state}
					<optgroup label={state}>
						{#each groupedOptions[state].sort((a, b) => a.name.localeCompare(b.name)) as station}
							<option value={station.id}>{station.name} ({station.height}m)</option>
						{/each}
					</optgroup>
				{/each}
			</select>

			<button
				aria-label="Find nearest weather station"
				class="button"
				on:mousedown={getCurrentPosition()}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icon icon-tabler icon-tabler-current-location"
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
			</button>
			<span>{geoLocationStatus}</span>
		</div>
	</div>
{/if}
