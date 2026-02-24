<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let data;
	export let selectedStation;

	let geoLocationStatus = '';
	let isUserSelection = false;

	// Default fallback station (IDs differ for Germany/AT)
	const preset = {
		at: [105, 30, 39, 213],
		de: [403, 3379, 722, 3032]
	};

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

		dispatch('select', closestStation);
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
			dispatch('select', found);
		}
	}

	$: suggestedStations = [];

	/**
	 * On mount: figure out what station we should show by default.
	 */
	onMount(() => {
		// Check if there's a ?weatherStation= param

		if (localStorage.getItem('kd_region_coordinates') && $page.url.pathname.includes('regions')) {
			const stored = localStorage.getItem('kd_region_coordinates');
			const [lng, lat] = stored.split(',').map(Number); // convert to numbers
			suggestedStations = data.stations
				.sort(
					(a, b) =>
						getDistance({ latitude: lat, longitude: lng }, a) -
						getDistance({ latitude: lat, longitude: lng }, b)
				)
				.slice(0, 4);
		} else {
			suggestedStations = data.stations.filter((s) =>
				preset[PUBLIC_VERSION].includes(parseInt(s.id))
			);
		}
	});

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

<div
	class="rounded-2xl absolute top-0 left-0 bottom-0 w-1/3 bg-gradient-to-r from-current/20 to-transparent z-20 pointer-events-none"
></div>
<div class="text-sm absolute top-3 left-3 z-20 pointer-events-none">
	<h2 class="text-xl font-bold mb-2 text-black">Wähle eine Wetterstation</h2>
	<div class="flex flex-col gap-2 max-w-2xl">
		<div class="dropdown">
			<select
				on:change={handleSelectionChange}
				class="pointer-events-auto !bg-white text-black rounded-full shadow-md border-2 !border-green-500"
			>
				{#each Object.keys(groupedOptions).sort() as state}
					<optgroup label={state}>
						{#each groupedOptions[state].sort((a, b) => a.name.localeCompare(b.name)) as station}
							<option value={station.id} selected={station.id === selectedStation?.id}>
								{station.name} ({station.height}m)
							</option>
						{/each}
					</optgroup>
				{/each}
			</select>
		</div>

		{#each suggestedStations.filter((d) => d.id !== selectedStation?.id) as station}
			<button class="button block" on:mousedown={() => dispatch('select', station)}>
				<b>{station.name}</b><br />
				<p class="text-xs font-normal">({station.height}m)</p>
			</button>
		{/each}
		<button aria-label="Find nearest weather station" class="button" on:click={getCurrentPosition}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="w-4 h-4"
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
	</div>
</div>

<style>
	@reference "tailwindcss/theme";
	.button {
		@apply shadow-md pointer-events-auto bg-white hover:bg-gray-100 w-max text-black;
	}
</style>
