<script>
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';

	let selectedRegion;
</script>

<div>
	<Map bind:selectedRegion />
	<Inspector bind:selectedRegion />
</div>
