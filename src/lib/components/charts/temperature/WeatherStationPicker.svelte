<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_VERSION } from '$env/static/public';

	export let data;
	export let selectedStation;

	console.log(data);

	$: geoLocationStatus = '';

	$: getDistance = function (currentPosition, station) {
		return Math.sqrt(
			Math.pow(currentPosition.coords.latitude - station.latitude, 2) +
				Math.pow(currentPosition.coords.longitude - station.longitude, 2)
		);
	};

	$: getClosestStation = function (position) {
		geoLocationStatus = 'getting closest weather station...';
		// currentPosition = "Latitude: " + position.coords.latitude + "; Longitude: " + position.coords.longitude;
		var closestStation = data.stations.reduce((a, b) =>
			getDistance(position, a) < getDistance(position, b) ? a : b
		);
		selectedStation = closestStation;
		geoLocationStatus = '';
	};

	$: getCurrentPosition = function () {
		geoLocationStatus = 'getting user’s position...';
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(getClosestStation);
		} else {
			geoLocationStatus = 'Geolocation is not supported by this browser.';
		}
	};

	// 105 for Hohe Warte, 403 for Berlin-Dahlem
	$: presetID = PUBLIC_VERSION == 'at' ? 105 : 403;

	if ($page.url.searchParams.get('weatherStation')) {
		selectedStation = data.stations.find(
			(d) => d.id == $page.url.searchParams.get('weatherStation')
		);
	} else {
		selectedStation = data.stations.find((d) => d.id == presetID);
	}

	$: if (selectedStation) {
		const url = new URL(window.location);
		url.searchParams.set('weatherStation', selectedStation.id);
		goto(url.toString(), { replaceState: true });
	}

	// Step 1: Group options by 'state'
	let groupedOptions = {};
	data.stations.forEach((option) => {
		if (!groupedOptions[option.state]) {
			groupedOptions[option.state] = [];
		}
		groupedOptions[option.state].push(option);
	});
</script>

<div class="mx-auto w-max mb-4">
	<p class="text-sm text-gray-700 mb-1 font-medium">Wähle deine Wetterstation</p>
	<div class="flex items-center space-x-2">
		<select
			name="weatherStations"
			id="weatherStations"
			class="k_input k_dropdown max-w-[60vw]"
			bind:value={selectedStation}
		>
			{#each Object.keys(groupedOptions).sort((a, b) => a > b) as state}
				<optgroup label={state}>
					{#each groupedOptions[state].sort((a, b) => a.name > b.name) as station}
						<option value={station}>{station.name} ({station.height}m)</option>
					{/each}
				</optgroup>
			{/each}
		</select>

		<button
			aria-label="Nächste Wetterstation finden"
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
