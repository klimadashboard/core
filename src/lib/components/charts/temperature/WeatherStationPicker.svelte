<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	export let data;
	export let selectedStation;

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

	if ($page.url.searchParams.get('weatherStation')) {
		selectedStation = data.stations.find(
			(d) => d.id == $page.url.searchParams.get('weatherStation')
		);
	} else {
		selectedStation = data.stations.find((d) => d.id == 105);
	}

	$: if (selectedStation) {
		const url = new URL(window.location);
		url.searchParams.set('weatherStation', selectedStation.id);
		goto(url.toString(), { replaceState: true });
	}
</script>

<div class="flex items-center space-x-2">
	<div class="relative">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="absolute pointer-events-none top-3 h-6 right-2 transform -translate-y-0.5 icon-tabler-selector"
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
			<polyline points="8 9 12 5 16 9" />
			<polyline points="16 15 12 19 8 15" />
		</svg>
		<select
			name="weatherStations"
			id="weatherStations"
			class="block appearance-none w-full bg-gray-200 border border-gray-100 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 max-w-sm"
			bind:value={selectedStation}
		>
			{#each data.stations.sort((a, b) => a.name > b.name) as station}
				<option value={station}>{station.name} ({station.height}m)</option>
			{/each}
		</select>
	</div>

	<button
		aria-label="Nächste Wetterstation finden"
		class="bg-gray-200 p-2.5 rounded"
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
		<span>{geoLocationStatus}</span>
	</button>
</div>
