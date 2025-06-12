<script lang="ts">
	import { onMount } from 'svelte';
	import Search from '$lib/components/Search.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import ComingSoon from './ComingSoon.svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import formatNumber from '$lib/stores/formatNumber';

	export let data;

	const defaultView = {
		at: { center: [13.333, 47.5], zoom: 6 },
		de: { center: [10.45, 51.1657], zoom: 4.5 }
	};

	const { center, zoom } = defaultView[PUBLIC_VERSION] || defaultView.de;

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

	let searchQuery = '';
	let map;

	onMount(() => {
		map = new maplibregl.Map({
			container: 'map',
			style: {
				version: 8,
				sources: {
					carto: {
						type: 'raster',
						tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
						tileSize: 256,
						attribution: '© OpenStreetMap contributors © CARTO'
					}
				},
				layers: [{ id: 'carto-basemap', type: 'raster', source: 'carto' }]
			},
			center,
			zoom
		});

		map.on('load', () => {
			map.addSource('points', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: geoJson
				}
			});

			map.addLayer({
				id: 'unclustered-point',
				type: 'circle',
				source: 'points',
				paint: {
					'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 2, 12, 8],
					'circle-stroke-width': 1,
					'circle-stroke-color': '#fff',
					'circle-color': [
						'match',
						['get', 'layer'],
						'state',
						'#f97316',
						'district',
						'#22c55e',
						'municipality',
						'#3b82f6',
						'#6b7280'
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
				const layerLabel = e.features[0].properties.layer_label;

				new maplibregl.Popup({ closeButton: false, closeOnClick: false })
					.setLngLat(coordinates)
					.setHTML(`<strong>${name}</strong> (${layerLabel})`)
					.addTo(map);
			});

			map.on('mouseleave', 'unclustered-point', () => {
				map.getCanvas().style.cursor = '';
				const popups = document.getElementsByClassName('maplibregl-popup');
				if (popups.length) popups[0].remove();
			});
		});
	});

	let layerFilter = 'all';

	$: filteredRegions = [...data.regions]
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
	);

	const regionIndex = new Map(data.regions.map((r) => [r.id, r]));
	const parentCache = new Map();

	function getRegionParent(region) {
		if (!region?.parents || !Array.isArray(region.parents)) return false;

		if (parentCache.has(region.id)) return parentCache.get(region.id);

		for (const parent of region.parents) {
			const match = regionIndex.get(parent.id);
			if (match?.layer === 'state') {
				parentCache.set(region.id, match.name);
				return match.name;
			}
		}

		parentCache.set(region.id, false);
		return false;
	}
</script>

<div class="">
	<ComingSoon />

	<div class="py-8 bg-gradient-green">
		<div class="container">
			<h1 class="text-2xl font-bold max-w-md mb-3 leading-tight">
				Wie ist das Klima bei dir vor Ort? <br />Gib eine Region ein oder lass dich orten!
			</h1>
			<Search />
			<p class="text-lg mt-3 max-w-md text-balance leading-tight">
				{formatNumber(data.regions.length)} Klimadashboards zeigen, wo die Regionen in der Klimawende
				stehen.
			</p>
		</div>
	</div>

	<div id="map"></div>

	<div class="container pb-20">
		<div class="mt-8 text-lg text">
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
				<a class="hover:underline" href={`/regions/${smallestArea.id}`}>{smallestArea.name}</a>. Mit
				exakt
				{popClosestCurrentYear.population} Einwohnern ist
				<a class="hover:underline" href={`/regions/${popClosestCurrentYear.id}`}
					>{popClosestCurrentYear.name}</a
				>
				die Region mit der Einwohneranzahl, die am nähesten zum aktuellen Jahr ist. Und die Region am
				Ende des Alphabets
				<a class="hover:underline" href={`/regions/${lastAlpha.id}`}>{lastAlpha.name}</a> freut sich
				auch auf deinen Besuch.
			</p>
		</div>

		<div class="mt-8">
			<label for="layerFilter" class="block font-medium mb-1">Filtern nach Ebene</label>
			<select id="layerFilter" bind:value={layerFilter} class="border rounded p-1">
				<option value="all">Alle</option>
				<option value="state">Bundesland</option>
				<option value="district">Landkreis</option>
				<option value="municipality">Gemeinde</option>
			</select>
		</div>

		<div class="mt-6">
			<h2 class="text-xl font-semibold mb-2">Regionen (alphabetisch)</h2>
			{#each Object.keys(groupedRegions).sort() as letter}
				<div class="mb-8">
					<h3 class="text-5xl font-light">{letter}</h3>
					<ul class="grid gap-2 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
						{#each groupedRegions[letter] as region}
							<li>
								<a
									class="hover:underline underline-offset-2 leading-1"
									href={`/regions/${region.id}`}
									>{region.name} ({region.layer_label})<br />
									{#if getRegionParent(region)}
										<span class="opacity-70">{getRegionParent(region)}</span>{/if}
								</a>
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
		height: 70vh;
		max-height: 400px;
		margin-bottom: 2rem;
	}

	.text a {
		@apply opacity-80 hover:opacity-100 underline transition-all duration-200;
	}
</style>
