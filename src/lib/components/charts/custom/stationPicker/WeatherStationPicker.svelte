<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { replaceState } from '$app/navigation';

	export let data;
	export let selectedStation;

	let geoLocationStatus = '';
	let isUserSelection = false;

	// Default fallback station (IDs differ for Germany/AT)
	const presetID = PUBLIC_VERSION === 'at' ? 105 : 403;

	/**
	 * Euclidean distance for simplicity.
	 * Modify to a more accurate formula if needed.
	 */
	function getDistance(coords, station) {
		return Math.sqrt(
			(coords.latitude - station.latitude) ** 2 + (coords.longitude - station.longitude) ** 2
		);
	}

	/**
	 * Choose the closest station from the user's coords.
	 */
	function getClosestStation(currentCoords) {
		geoLocationStatus = 'Getting closest weather station...';

		const closestStation = data.stations.reduce((a, b) =>
			getDistance(currentCoords, a) < getDistance(currentCoords, b) ? a : b
		);

		if (!isUserSelection) {
			selectedStation = closestStation;
		}
		geoLocationStatus = '';
	}

	/**
	 * Hook to request current location.
	 */
	async function getCurrentPosition() {
		try {
			geoLocationStatus = 'Locating...';
			const pos = await new Promise((resolve, reject) =>
				navigator.geolocation.getCurrentPosition(resolve, reject)
			);

			getClosestStation({
				latitude: pos.coords.latitude,
				longitude: pos.coords.longitude
			});
		} catch (err) {
			console.log(err);
			geoLocationStatus = 'Geolocation not available';
		}
	}

	/**
	 * When the user picks from the <select>, we mark it as a user
	 * selection and update `selectedStation`.
	 */
	function handleSelectionChange(e) {
		isUserSelection = true;

		const stationId = e.target.value;
		const found = data.stations.find((s) => s.id === stationId);

		if (found) {
			selectedStation = found;
		}
	}

	/**
	 * On mount: figure out what station we should show by default.
	 */
	onMount(() => {
		// Check if there's a ?weatherStation= param
		const weatherStationParam = $page.url.searchParams.get('weatherStation');
		if (weatherStationParam) {
			const foundStation = data.stations.find((d) => d.id == weatherStationParam);
			if (foundStation) {
				selectedStation = foundStation;
			}
			return;
		}

		// Check localStorage
		const coordsStr = localStorage.getItem('kd_region_coordinates');
		if (coordsStr && coordsStr.includes(',')) {
			const [lng, lat] = coordsStr.split(',').map(Number);
			if (!isNaN(lng) && !isNaN(lat)) {
				getClosestStation({ latitude: lat, longitude: lng });
				return;
			}
		}

		// Otherwise, fall back to a preset
		selectedStation = data.stations.find((d) => d.id == presetID);
	});

	/**
	 * Whenever `selectedStation` changes, update the URL (unless
	 * it was a user override you *don’t* want to reflect).
	 *
	 * If you DO want user picks to reflect in URL, remove `!isUserSelection`.
	 */
	let lastSetStationId = null;

	$: if (selectedStation) {
		const selectedId = String(selectedStation.id);
		const currentParam = $page.url.searchParams.get('weatherStation');

		// Avoid infinite loop by comparing with last set value
		if (selectedId !== currentParam && selectedId !== lastSetStationId) {
			const url = new URL($page.url.href);
			url.searchParams.set('weatherStation', selectedId);
			replaceState(url.toString(), $page.state);
			lastSetStationId = selectedId;
		}
	}

	/**
	 * Group stations by "state" for <optgroup>.
	 */
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
			<!-- A plain <select> that chooses station by ID -->
			<select on:change={handleSelectionChange} class="input">
				{#each Object.keys(groupedOptions).sort() as state}
					<optgroup label={state}>
						{#each groupedOptions[state].sort((a, b) => a.name.localeCompare(b.name)) as station}
							<option value={station.id} selected={station.id === selectedStation.id}>
								{station.name} ({station.height}m)
							</option>
						{/each}
					</optgroup>
				{/each}
			</select>

			<!-- Button to attempt geolocation-based pick -->
			<button
				aria-label="Find nearest weather station"
				class="button"
				on:click={getCurrentPosition}
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
