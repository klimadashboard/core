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
					`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=pk.eyJ1Ijoia2xpbWFkYXNoYm9hcmQiLCJhIjoiY2x5eTl3cGR5MXQ5ZTJscXNmNXR5aG44eiJ9.iPxhi0LuuA0Nxzzp8cXU7Q&language=de`
				);
				const data = await res.json();
				locationName = data.features?.[0]?.place_name || null;
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
</script>

<div
	class="bg-white dark:bg-gray-900 border border-current/10 shadow p-4 rounded-2xl -mt-10 z-30 relative max-w-3xl mx-auto"
>
	{#if selectedTiles.length > 0}
		<h2 class="text-2xl font-bold mb-2">
			{#if selectedTiles.length === 1}
				Mobilität Nähe {locationName || 'unbekannt'}
			{:else}
				Durchschnittswerte ({selectedTiles.length} Zellen)
			{/if}
		</h2>

		<p>
			{#if selectedTiles.length === 1}
				{selectedTiles[0].properties.pt} PT // {selectedTiles[0].properties.pop} Pop
			{:else}
				Durchschnittlicher PT-Score und Bevölkerung aus {selectedTiles.length} Zellen
			{/if}
		</p>

		{#if popPercent > ptPercent}
			<p>Dieses Gebiet ist nicht ausreichend an den öffentlichen Verkehr angebunden.</p>
		{/if}

		{#if popPercent && ptPercent}
			<Tachometer {popPercent} {ptPercent} />
		{/if}

		{#if stops.length > 0}
			<h3 class="text-sm text-gray-500 mt-3">Haltestellen in deiner Nähe</h3>
			<div class="max-w-full overflow-scroll">
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
</div>

<style>
	@reference "tailwindcss/theme";
	table {
		@apply w-full text-left;
	}

	td,
	th {
		@apply p-1 border border-gray-200;
	}
</style>
