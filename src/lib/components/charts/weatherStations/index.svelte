<script>
	import Papa from 'papaparse';
	import { selectedStation } from '$lib/stores/weather';
	import WeatherStationMap from './Map.svelte';
	import { glossaryItem } from '$lib/stores/glossary';
	import { PUBLIC_VERSION } from '$env/static/public';

	let metaDataStations;
	$: geoLocationStatus = '';

	const wetterdienst = PUBLIC_VERSION == 'at' ? 'geosphere' : 'impact';

	function stateLongFormat(state) {
		const states = {
			OOE: 'Oberösterreich',
			KNT: 'Kärnten',
			WIE: 'Wien',
			NOE: 'Niederösterreich',
			BGL: 'Burgenland',
			SAL: 'Salzburg',
			TIR: 'Tirol',
			VBG: 'Vorarlberg',
			STMK: 'Steiermark'
		};
		if (state in states) return states[state];
		return state;
	}

	Papa.parse(`https://data.klimadashboard.org/${PUBLIC_VERSION}/${wetterdienst}/stations.csv`, {
		download: true,
		dynamicTyping: true,
		skipEmptyLines: true,
		header: true,
		complete: function (results) {
			if (results) {
				metaDataStations = results.data.filter(
					(d) =>
						PUBLIC_VERSION == 'de' /* german wheather stations already filtered */ ||
						new Date(d.Startdatum).getFullYear() < 1961
				);
			}
		}
	});

	$: metaDataStationsGroupedByState = metaDataStations
		?.reduce((states, station) => {
			if (states.indexOf(station.Bundesland) == -1) return [...states, station.Bundesland];
			return states;
		}, [])
		.map((state) => {
			return {
				name: state,
				stations: metaDataStations.filter((station) => station.Bundesland == state)
			};
		});

	$: getDistance = function (currentPosition, station) {
		return Math.sqrt(
			Math.pow(currentPosition.coords.latitude - station.latitude, 2) +
				Math.pow(currentPosition.coords.longitude - station.longitude, 2)
		);
	};

	$: getClosestStation = function (position) {
		geoLocationStatus = 'getting closest weather station...';
		// currentPosition = "Latitude: " + position.coords.latitude + "; Longitude: " + position.coords.longitude;
		var closestStation = metaDataStations.reduce((a, b) =>
			getDistance(position, a) < getDistance(position, b) ? a : b
		);
		selectedStation.set(closestStation.id);
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

	$: showMap = true;
</script>

{#if metaDataStations}
	<div class="sticky top-16 bg-white py-2 z-20 flex flex-col items-center">
		<div class="items-center flex gap-4 text-gray-600">
			<span class="hidden md:inline">Wähle deine Wetterstation: </span>
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
					bind:value={$selectedStation}
				>
					{#each [...metaDataStationsGroupedByState].sort( (a, b) => a.name.localeCompare(b.name) ) as state}
						<optgroup label={stateLongFormat(state.name)}>
							{#each [...state.stations].sort((a, b) => a.name.localeCompare(b.name)) as station}
								<option value={station.id}>{station.name} ({station.height}m)</option>
							{/each}
						</optgroup>
					{/each}
				</select>
			</div>
			<button aria-label="Nächste Wetterstation finden" on:mousedown={getCurrentPosition()}>
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

			<button on:mousedown={() => (showMap = !showMap)} aria-label="Karte anzeigen">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="icon icon-tabler icon-tabler-map"
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
					<polyline points="3 7 9 4 15 7 21 4 21 17 15 20 9 17 3 20 3 7" />
					<line x1="9" y1="4" x2="9" y2="17" />
					<line x1="15" y1="7" x2="15" y2="20" />
				</svg>
			</button>
		</div>
	</div>

	{#if showMap}
		<div class="container grid md:grid-cols-4 gap-4">
			<div class="md:col-span-2 md:col-start-2">
				<WeatherStationMap data={metaDataStations} />
			</div>

			<div class="my-auto space-y-4 text-gray-600 source-info">
				{#if PUBLIC_VERSION == 'at'}
					<p class="">
						Wir werten täglich die Daten von mehr als 60 <span
							class="glossary-label"
							on:mousedown={() => glossaryItem.set('wetterstationen-der-zamg')}
						/>
						Wetterstationen der Geosphere
						<span class="glossary-label" on:mousedown={() => glossaryItem.set('zamg')} /> aus, um das
						laufende Jahr mit vergangenen Jahren zu vergleichen.
					</p>
					<p class="">
						Die Daten des aktuellsten Tages werden gegen Mitternacht abgerufen. Hier kann es
						nachträglich zu kleineren Korrekturen kommen, sobald die qualitätsgeprüften Messdaten
						vollständig vorliegen.
					</p>
				{:else if PUBLIC_VERSION == 'de'}
					<p>
						Wir werten täglich die Daten von mehr als 230 Wetterstationen des <strong>DWD</strong> (Deutschen
						Wetterdienstes) aus, um das laufende Jahr mit vergangenen Jahren zu vergleichen.
					</p>
					<p>
						Die Daten werden gegen 12 Uhr aktualisiert und stammen jeweils vom Vortag. Eine frühere
						Aktualisierung ist aufgrund der Datenquelle noch nicht möglich.
					</p>
				{/if}
			</div>
		</div>
	{/if}
{/if}
