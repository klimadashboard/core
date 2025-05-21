<script lang="ts">
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';
	import type { GeoJSONFeature } from 'maplibre-gl';

	let selection: GeoJSONFeature;
	let indicators: { key: string; label: string }[];
</script>

<div>
	<Map bind:selection bind:indicators />
	<Inspector bind:selection bind:indicators />
</div>
