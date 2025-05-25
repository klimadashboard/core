<script lang="ts">
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';
	import type { GeoJSONFeature } from 'maplibre-gl';

	let selection: GeoJSONFeature;
	export let indicators: { key: string; label: string; labelLong: string }[];
	export let warmingLevels: { key: string; label: string }[];
	export let activeIndicator: string;
	export let activeWarming: string;
</script>

<div>
	<Map bind:selection bind:indicators bind:warmingLevels bind:activeIndicator bind:activeWarming />
	<Inspector
		bind:selection
		bind:indicators
		bind:warmingLevels
		bind:activeIndicator
		bind:activeWarming
	/>
</div>
