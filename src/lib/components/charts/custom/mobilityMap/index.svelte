<script>
	import Map from './Map.svelte';
	import Inspector from './Inspector.svelte';

	let selectedRegion;
	let selectedTiles;

	const gueteklassColors = {
		none: '#f0f0f0',
		G: '#d73027',
		F: '#fc8d59',
		E: '#fee08b',
		D: '#d9ef8b',
		C: '#91cf60',
		B: '#1a9850',
		A: '#006837'
	};
</script>

<div>
	<Map bind:selectedRegion bind:selectedTiles {gueteklassColors} />
	<Inspector bind:selectedRegion bind:selectedTiles {gueteklassColors} />
</div>
