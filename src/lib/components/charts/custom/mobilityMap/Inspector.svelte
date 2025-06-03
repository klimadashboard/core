<script>
	import Tachometer from './Tachometer.svelte';

	export let selectedTiles = [];

	const MAX_POP = 100;
	const MAX_PT = 7;

	let popPercent = 0;
	let ptPercent = 0;
	let locationName = null;
	let stops = [];

	let debounceTimeout;

	function getCenterFromGeometry(tile) {
		const coords = tile.geometry?.coordinates?.[0];
		if (!coords) return null;

		const lons = coords.map(([lon]) => lon);
		const lats = coords.map(([, lat]) => lat);

		const minLon = Math.min(...lons);
		const maxLon = Math.max(...lons);
		const minLat = Math.min(...lats);
		const maxLat = Math.max(...lats);

		return [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
	}

	function getAverageCenter(tiles) {
		const centers = tiles.map(getCenterFromGeometry).filter((c) => c != null);
		if (centers.length === 0) return null;

		const lngSum = centers.reduce((sum, c) => sum + c[0], 0);
		const latSum = centers.reduce((sum, c) => sum + c[1], 0);

		return [lngSum / centers.length, latSum / centers.length];
	}

	$: if (selectedTiles.length >= 0) {
		// debounce tile update (100ms)
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(handleTileSelection, 100);
	}

	async function handleTileSelection() {
		if (selectedTiles.length === 0) {
			locationName = null;
			stops = [];
			popPercent = 0;
			ptPercent = 0;
			return;
		}

		let popSum = 0;
		let ptSum = 0;

		for (const tile of selectedTiles) {
			popSum += tile.properties?.pop || 0;
			ptSum += tile.properties?.pt || 0;
		}

		const popAvg = popSum / selectedTiles.length;
		const ptAvg = ptSum / selectedTiles.length;

		popPercent = Math.min(100, (popAvg / MAX_POP) * 100);
		ptPercent = Math.min(100, (ptAvg / MAX_PT) * 100);

		const center =
			selectedTiles.length === 1
				? getCenterFromGeometry(selectedTiles[0])
				: getAverageCenter(selectedTiles);

		if (!center) {
			locationName = null;
			stops = [];
			return;
		}

		const [lng, lat] = center;

		if (selectedTiles.length === 1) {
			try {
				const res = await fetch(
					`https://base.klimadashboard.org/get-location-name?lat=${lat}&lon=${lng}`
				);
				const data = await res.json();
				locationName = data.name;
			} catch (e) {
				console.error('Geocoding failed', e);
				locationName = null;
			}
		} else {
			locationName = null;
		}

		try {
			const res = await fetch(
				`https://base.klimadashboard.org/get-nearby-stops?lat=${lat}&lon=${lng}&radius_km=0.5`
			);
			const data = await res.json();
			stops = data || [];
		} catch (e) {
			console.error('Stop fetch failed', e);
			stops = [];
		}
	}

	const scaleBar = (val, max = 100) => `width: ${Math.min(100, (val / max) * 100)}%`;

	const getInterval = (interval) => {
		if (!interval || isNaN(interval)) return '–';
		if (interval < 120) return `alle ${Math.round(interval)} min.`;
		return `alle ${Math.round(interval / 60)} Std.`;
	};

	$: mismatch = ptPercent - popPercent;
</script>

<div
	class="bg-white text-lg dark:bg-gray-900 border border-current/10 shadow p-4 rounded-2xl -mt-10 z-30 relative max-w-3xl mx-auto"
>
	{#if selectedTiles.length > 0}
		<h2 class="text-2xl font-bold mb-2">
			Qualität des öffentlichen Verkehrs <span class="font-normal"
				>nahe <span class="underline underline-offset-4 decoration-current/20"
					>{locationName || 'unbekannt'}</span
				>

				im Vergleich zur Bevölkerungsdichte {#if selectedTiles.length > 1}(Durchschnittswerte über {selectedTiles.length}
					Zellen){/if}</span
			>
		</h2>

		<div class="mb-2">
			{#if mismatch < -10}
				<p>
					Dieses Gebiet ist <span class="underline underline-offset-4 decoration-[#e53e3e]"
						>nicht ausreichend</span
					> an den öffentlichen Verkehr angebunden.
				</p>
			{:else if mismatch > 30}
				<p>
					Dieses Gebiet ist <span class="underline underline-offset-4 decoration-[#3FB375]"
						>besonders gut</span
					> an den öffentlichen Verkehr angebunden.
				</p>
			{:else}
				<p>Die Anbindung an den öffentlichen Verkehr in diesem Gebiet ist relativ ausgewogen.</p>
			{/if}
		</div>

		{#if popPercent && ptPercent}
			<Tachometer {popPercent} {ptPercent} />
		{/if}

		<h3 class="mb-2 mt-6 font-bold">Regionen mit Ausbaupotential</h3>
		<table class="text-sm">
			<thead>
				<tr>
					<th>Priorität</th>
					<th>Region</th>
					<th>Ausbaulücke</th>
					<th>Link zur Karte</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>#1</td>
					<td>Region ABC</td>
					<td>(in Entwicklung)</td>
					<td> </td>
				</tr>
			</tbody>
		</table>

		{#if stops.length > 0}
			<h3 class="mb-2 mt-6 font-bold">Haltestellen in deiner Nähe</h3>
			<div class="max-w-full overflow-scroll text-sm">
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Kategorie</th>
							<th>Intervall</th>
							<th>Linien</th>
						</tr>
					</thead>
					<tbody>
						{#each stops as stop}
							<tr>
								<td>{stop.name}</td>
								<td>{stop.category}</td>
								<td>{getInterval(stop.interval)}</td>
								<td>
									{#each stop.lines.filter((d) => d !== 'nan') as line}
										<span class="bg-gray-200 mr-1 px-1 py-0.5 rounded text-sm font-bold"
											>{line}</span
										>
									{/each}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="text-sm text-gray-500">Keine Haltestellen in der Nähe.</p>
		{/if}
	{:else}
		<p>
			Wähle eine Region aus, um mehr Informationen zu der Anbindung an den öffentlichen Nahverkehr
			zu erhalten.
		</p>
	{/if}
	<p class="text-sm opacity-70">
		Datenquelle: <a
			class="underline underline-offset-2"
			href="https://www.oerok.gv.at/raum/themen/raumordnung-und-mobilitaet">ÖROK ÖV-Güteklassen</a
		>
		|
		<a
			class="underline underline-offset-2"
			href="https://human-settlement.emergency.copernicus.eu/download.php?ds=pop"
			>POP Global Human Settlement Layer</a
		>
	</p>
</div>

<style>
	@reference "tailwindcss/theme";
	table {
		@apply w-full text-left;
	}

	td,
	th {
		@apply py-1 border-b border-current/20;
	}
</style>
