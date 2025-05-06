<script lang="ts">
	import { onMount } from 'svelte';
	import Search from '$lib/components/Search.svelte';
	import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
	import mapboxgl from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';

	export let data;

	let geoJson = data.regions
		.filter((d) => d.center)
		.map((d) => ({
			type: 'Feature',
			properties: {
				id: d.id,
				name: d.name,
				layer: d.layer,
				layer_label: d.layer_label
			},
			geometry: {
				type: 'Point',
				coordinates: d.center.map((c) => parseFloat(c))
			}
		}));
	console.log(geoJson);

	let searchQuery = '';

	// Mapbox access token
	mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;

	let map;

	onMount(() => {
		// Initialize the map
		map = new mapboxgl.Map({
			container: 'map',
			style: 'mapbox://styles/davidjablonski/cllkz3m0801c401plbd0y9r8x',
			center: [14, 48.2082],
			zoom: 6
		});

		map.on('load', () => {
			map.addSource('points', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: geoJson
				},
				cluster: true,
				clusterMaxZoom: 10,
				clusterRadius: 30
			});

			map.addLayer({
				id: 'clusters',
				type: 'circle',
				source: 'points',
				filter: ['has', 'point_count'],
				paint: {
					'circle-color': '#888',
					'circle-radius': 14
				}
			});

			map.addLayer({
				id: 'cluster-count',
				type: 'symbol',
				source: 'points',
				filter: ['has', 'point_count'],
				layout: {
					'text-field': ['get', 'point_count_abbreviated'],
					'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
					'text-size': 12
				}
			});

			map.addLayer({
				id: 'unclustered-point',
				type: 'circle',
				source: 'points',
				filter: ['!', ['has', 'point_count']],
				paint: {
					'circle-radius': 6,
					'circle-stroke-width': 1,
					'circle-stroke-color': '#fff',
					'circle-color': [
						'match',
						['get', 'layer'],
						'state',
						'#f59e0b',
						'district',
						'#10b981',
						'municipality',
						'#3b82f6',
						'#000'
					]
				}
			});

			map.on('click', 'unclustered-point', (e) => {
				const feature = e.features[0];
				if (feature?.properties?.id) {
					window.location.href = `/regions/${feature.properties.id}`;
				}
			});

			map.on('mouseenter', 'unclustered-point', (e) => {
				map.getCanvas().style.cursor = 'pointer';
				const coordinates = e.features[0].geometry.coordinates.slice();
				const name = e.features[0].properties.name;
				const layer = e.features[0].properties.layer;
				const layerLabel = e.features[0].properties.layer_label;

				new mapboxgl.Popup({ closeButton: false, closeOnClick: false })
					.setLngLat(coordinates)
					.setHTML(`<strong>${name}</strong> (${layerLabel})`)
					.addTo(map);
			});

			map.on('mouseleave', 'unclustered-point', () => {
				map.getCanvas().style.cursor = '';
				const popups = document.getElementsByClassName('mapboxgl-popup');
				if (popups.length) popups[0].remove();
			});
		});
	});

	let layerFilter = 'all';

	// Filtered + grouped region list
	$: filteredRegions = data.regions
		.filter((r) => r.name && (!r.layer || layerFilter === 'all' || r.layer === layerFilter))
		.sort((a, b) => a.name.localeCompare(b.name));

	$: groupedRegions = filteredRegions.reduce((acc, r) => {
		const letter = r.name[0].toUpperCase();
		acc[letter] = acc[letter] || [];
		acc[letter].push(r);
		return acc;
	}, {});

	const withPopulation = data.regions.filter(
		(r) => typeof r.population === 'number' && r.layer == 'municipality'
	);
	const withArea = data.regions.filter(
		(r) => typeof r.area === 'number' && r.layer == 'municipality'
	);

	const top5 = [...withPopulation].sort((a, b) => b.population - a.population).slice(0, 5);
	const lowestPop = [...withPopulation].sort((a, b) => a.population - b.population)[0];
	const smallestArea = [...withArea].sort((a, b) => a.area - b.area)[0];
	const popClosestCurrentYear = [...withPopulation].sort(
		(a, b) =>
			Math.abs(a.population - new Date().getFullYear()) -
			Math.abs(b.population - new Date().getFullYear())
	)[0];

	const lastAlpha = [...data.regions].sort((a, b) => b.name.localeCompare(a.name))[0];

	let suggestions = [...top5, lowestPop, smallestArea, popClosestCurrentYear, lastAlpha].filter(
		(r, i, self) => self.findIndex((s) => s.id === r.id) === i
	); // remove duplicates
</script>

<div class="">
	<!-- Map Container -->
	<div id="map"></div>

	<div class="container pb-20">
		<Search />

		<!-- Suggestion Block -->
		<div class="mt-8">
			<div class="text-lg text">
				<p>
					Du kannst dir einfach eine Region auf der Karte oder der Liste unten aussuchen oder dich
					orten lassen und wir wählen deine Region ganz automatisch aus!
				</p>
				<p>
					Du weißt nicht, wohin du reisen magst? Wie wär’s mit den größten Regionen
					{#each top5 as region}
						<a class="hover:underline" href={`/regions/${region.id}`}>{region.name}</a>,
					{/each} oder der Region mit den wenigsten Einwohnern
					<a class="hover:underline" href={`/regions/${lowestPop.id}`}>{lowestPop.name}</a>? Die
					flächenmäßig kleinste Region in unserer Datenbank ist
					<a class="hover:underline" href={`/regions/${smallestArea.id}`}>{smallestArea.name}</a>.
					Mit exakt {popClosestCurrentYear.population} Einwohnern ist
					<a class="hover:underline" href={`/regions/${popClosestCurrentYear.id}`}
						>{popClosestCurrentYear.name}</a
					>
					der Region mit der Einwohneranzahl die am nähesten zum aktuellen Jahr ist. Und die Region am
					Ende des Alphabets
					<a class="hover:underline" href={`/regions/${lastAlpha.id}`}>{lastAlpha.name}</a> freut sich
					auch auf deinen Besuch.
				</p>
			</div>
		</div>

		<!-- Layer Filter -->
		<div class="mt-8">
			<label for="layerFilter" class="block font-medium mb-1">Filtern nach Ebene</label>
			<select id="layerFilter" bind:value={layerFilter} class="border rounded p-1">
				<option value="all">Alle</option>
				<option value="state">Bundesland</option>
				<option value="district">Landkreis</option>
				<option value="municipality">Gemeinde</option>
			</select>
		</div>

		<!-- Grouped Region List -->
		<div class="mt-6">
			<h2 class="text-xl font-semibold mb-2">Regionen (alphabetisch)</h2>
			{#each Object.keys(groupedRegions).sort() as letter}
				<div class="mb-8">
					<h3 class="text-5xl font-light">{letter}</h3>
					<ul class="grid gap-2 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
						{#each groupedRegions[letter] as region}
							<li>
								<a class="hover:underline" href={`/regions/${region.id}`}
									>{region.name} ({region.layer_label})</a
								>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	#map {
		width: 100%;
		height: 500px;
		margin-bottom: 2rem;
	}

	.text a {
		@apply opacity-80 hover:opacity-100 underline transition-all duration-200;
	}
</style>
