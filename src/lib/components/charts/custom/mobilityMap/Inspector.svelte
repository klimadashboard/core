<script>
	export let selectedTiles = [];
	export let gueteklassColors;

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

	const getInterval = (interval) => {
		if (!interval || isNaN(interval)) return '–';
		if (interval < 120) return `alle ${Math.round(interval)} min.`;
		return `alle ${Math.round(interval / 60)} Std.`;
	};

	$: gueteklassen = Object.values(gueteklassColors).map((d, i) => ({
		label: Object.keys(gueteklassColors)[i],
		color: d,
		active: selectedTiles?.[0]?.properties?.gueteklass == Object.keys(gueteklassColors)[i]
	}));
</script>

<div
	class="bg-white text-lg dark:bg-gray-900 border border-current/10 shadow p-4 rounded-2xl -mt-16 z-30 relative max-w-3xl mx-auto"
>
	<div class="flex rounded-full overflow-hidden">
		{#each gueteklassen as g}
			<div
				class="grid p-2 flex-1 {g.active ? 'border-2 opacity-100' : 'opacity-70'}"
				style="background-color: {g.color}"
			>
				<span class="m-auto {g.active ? 'font-bold' : ''}">{g.label}</span>
			</div>
		{/each}
	</div>
	<div class="flex justify-between text-sm opacity-80">
		<div class="border-l border-l-current/50 pt-4 pl-1 leading-[0.8em] ml-8">
			keine öffentliche Anbindung
		</div>
		<div class="border-r border-r-current/50 pt-4 pr-1 leading-[0.8em] mr-8">
			sehr gute Anbindung
		</div>
	</div>

	{#if selectedTiles.length > 0}
		<h2 class="text-2xl font-bold mb-2 mt-4">
			<span class="font-normal"
				><span class="underline underline-offset-4 decoration-current/20"
					>{locationName || 'unbekannt'}</span
				>: Anbindung an den öffentlichen Verkehr
			</span>
		</h2>

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
			<p class="text-sm mt-6 text-gray-500">Keine Haltestellen in der Nähe.</p>
		{/if}
	{:else}
		<p class="mt-4">
			Wähle eine Region aus, um mehr Informationen zu der Anbindung an den öffentlichen Nahverkehr
			zu erhalten.
		</p>
	{/if}
	<p class="text-sm opacity-70 mt-2">
		Datenquelle: <a
			class="underline underline-offset-2"
			href="https://www.oerok.gv.at/raum/themen/raumordnung-und-mobilitaet">ÖROK ÖV-Güteklassen</a
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
