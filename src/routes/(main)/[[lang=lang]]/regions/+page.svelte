<script>
  import { onMount } from 'svelte';
  import Search from '$lib/components/Search.svelte';
  import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
  import mapboxgl from 'mapbox-gl';

  export let data;

  let geoJson = data.regions.filter(d => d.center).map(d => ({
    type: 'Feature',
    properties: {
      id: d.id,
      name: d.name
    },
    geometry: {
      type: 'Point',
      coordinates: d.center.map(c => parseFloat(c))
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
      // Add GeoJSON source
      map.addSource('points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: geoJson
        }
      });

      // Add layer for the GeoJSON points
      map.addLayer({
        id: 'places',
        filter: ['==', ['geometry-type'], 'Point'],
        type: 'circle',
        source: 'points',
        paint: {
          'circle-radius': 5,
          'circle-stroke-width': 2,
          'circle-color': '#000',
          'circle-stroke-color': 'white'
        }
      });

      // Add click event listener for the points
      map.on('click', 'places', (e) => {
        const features = e.features[0];
        if (features && features.properties.id) {
          const regionId = features.properties.id;
          window.location.href = `/regions/${regionId}`;
        }
      });

      // Change the cursor to a pointer when over a point
      map.on('mouseenter', 'places', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      // Change it back to the default when not over a point
      map.on('mouseleave', 'places', () => {
        map.getCanvas().style.cursor = '';
      });
    });
  });
</script>


<style>
  #map {
    width: 100%;
    height: 500px;
    margin-bottom: 2rem;
  }
</style>

<div class="">
  <!-- Map Container -->
  <div id="map"></div>

  <div class="container pb-20">
	<Search />
  </div>
</div>
