<script lang="ts">
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';
	import type { GeoJSONFeature } from 'maplibre-gl';

	let selection: GeoJSONFeature;
</script>

<div>
	<Map bind:selection />
	<Inspector bind:selection />
</div>
