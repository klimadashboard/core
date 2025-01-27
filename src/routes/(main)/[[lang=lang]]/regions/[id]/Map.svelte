<script>
  import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
  import { onMount } from 'svelte';
  export let data;

  let chartWidth = 0;
  let chartHeight = 0;
  let staticMapUrl = "";
  let markerOffsetX = 0;
  let markerOffsetY = 0;

  $: getImage = () => {
    // Extract center coordinates and zoom level
  const centerLng = parseFloat(data.page.center[0]);
  const centerLat = parseFloat(data.page.center[1]);
  const zoom = 7; // Adjust zoom level as needed

  // Generate the Mapbox Static Image API URL
   staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${centerLng},${centerLat},${zoom}/${Math.round(chartWidth / 2)}x${Math.round(chartHeight / 2)}?access_token=${PUBLIC_MAPBOX_TOKEN}`;

  // Marker position relative to the map center
   markerOffsetX = chartWidth / 2; // Center of the image (X-axis)
   markerOffsetY = chartHeight / 2; // Center of the image (Y-axis)
  }

  $: if(chartWidth) {
    getImage();
  }
</script>

<style>

  .marker {
    position: absolute;
    width: 20px;
    height: 20px;
    background-color: green;
    border-radius: 50%;
    animation: pulse 2s infinite;
    transform: translate(-50%, -50%); /* Center the marker */
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.4);
    }
    70% {
      box-shadow: 0 0 0 20px rgba(0, 255, 0, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(0, 255, 0, 0);
    }
  }
</style>

<div id="map" class="h-full relative" bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>
    <img class="absolute h-full w-full opacity-50" src={staticMapUrl} alt="Static Map" />
    <div
    class="marker"
    style="top: {markerOffsetY}px; left: {markerOffsetX}px;"
    />
    <div class="absolute w-full h-full py-8">
    <div class="container">
      <p class="font-bold">Klimadashboard {data.page.name}</p>
      <h1 class="text-3xl md:text-5xl font-bold max-w-2xl">
        Die Daten und Fakten zur Klimakrise in {data.page.name}
      </h1>
    </div>
  </div>
</div>
