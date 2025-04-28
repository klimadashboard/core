<script>
	import { onMount } from 'svelte';
	export let selectedRegion;

	let locationName = null;

	$: if (selectedRegion?.coordinates) {
		const [lng, lat] = selectedRegion.coordinates;
		fetch(
			`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=pk.eyJ1Ijoia2xpbWFkYXNoYm9hcmQiLCJhIjoiY2x5eTl3cGR5MXQ5ZTJscXNmNXR5aG44eiJ9.iPxhi0LuuA0Nxzzp8cXU7Q&language=de`
		)
			.then((res) => res.json())
			.then((data) => {
				locationName = data.features?.[0]?.place_name || null;
			});
	}

	const scaleBar = (val, max = 100) => `width: ${Math.min(100, (val / max) * 100)}%`;

	const getInterval = (interval) => {
		if (!interval || interval == 0 || interval == NaN) {
			return '–';
		}
		if (interval < 120) {
			return 'alle ' + Math.round(interval) + ' min.';
		}
		return 'alle ' + Math.round(interval / 60) + ' Std.';
	};
</script>

<div
	class="bg-white dark:bg-gray-900 border border-current/10 shadow p-4 rounded-2xl -mt-10 z-30 relative max-w-3xl mx-auto"
>
	{#if selectedRegion}
		<h2 class="text-2xl font-bold mb-2">
			Mobilität Nähe {locationName ||
				`${selectedRegion.coordinates[0].toFixed(4)}, ${selectedRegion.coordinates[1].toFixed(4)}`}
		</h2>

		<div class="grid grid-cols-3 gap-2">
			<!-- Population -->
			<div>
				<p class="text-sm text-gray-500">Einwohner*innen</p>
				<div class="relative h-4 bg-gray-200 rounded overflow-hidden">
					<div class="relative h-4 bg-gray-200 rounded overflow-hidden">
						<div
							class="bg-[#9ecae1] h-full"
							style={scaleBar(selectedRegion.properties.mismatch, 10)}
						></div>
					</div>
				</div>
				<p class="text-sm mt-1">{selectedRegion.properties.pop}</p>
			</div>

			<!-- PT Quality -->
			<div>
				<p class="text-sm text-gray-500">Öffi-Güteklasse (0–7)</p>
				<div class="relative h-4 bg-gray-200 rounded overflow-hidden">
					<div class="bg-green-500 h-full" style={scaleBar(selectedRegion.properties.pt, 7)}></div>
				</div>
				<p class="text-sm mt-1">{selectedRegion.properties.pt}</p>
			</div>

			<!-- Mismatch -->
			<div>
				<p class="text-sm text-gray-500">Mismatch (0–10)</p>
				<div class="relative h-4 bg-gray-200 rounded overflow-hidden">
					<div
						class="bg-red-500 h-full"
						style={scaleBar(selectedRegion.properties.mismatch, 10)}
					></div>
				</div>
				<p class="text-sm mt-1">{selectedRegion.properties.mismatch}</p>
			</div>

			<div class="col-span-3">
				{#if selectedRegion.properties.nearbyStops?.length > 0}
					<h3 class="text-sm text-gray-500">Haltestellen in deiner Nähe</h3>
					<div class="max-w-full overflow-scroll">
						<table class="">
							<thead>
								<tr>
									<th>Name</th>
									<th>Kategorie</th>
									<th>Intervall</th>
									<th>Linien</th>
								</tr>
							</thead>
							<tbody>
								{#each selectedRegion.properties.nearbyStops as stop}
									<tr>
										<td>{stop.name}</td>
										<td>{stop.category}</td>
										<td class="">{getInterval(stop.interval)}</td>
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
			</div>
		</div>
	{:else}
		<p>
			Wähle eine Region aus, um mehr Informationen zu der Anbindung an den öffentlichen Nahverkehr
			zu erhalten.
		</p>
	{/if}
</div>

<style>
	@reference "tailwindcss/theme";

	/* Add some padding and responsiveness */
	table {
		@apply w-full text-left;
	}

	td,
	th {
		@apply p-1 border-gray-200 border-1;
	}
</style>
