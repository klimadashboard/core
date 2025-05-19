<script>
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';

	let selectedRegion;
	let selectedTiles;
</script>

<div>
	<Map bind:selectedRegion bind:selectedTiles />
	<Inspector bind:selectedRegion bind:selectedTiles />
</div>
