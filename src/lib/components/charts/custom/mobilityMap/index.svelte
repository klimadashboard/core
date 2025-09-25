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

	const categories = [
		{ category: 'I', gueteklass: 'A' },
		{ category: 'II', gueteklass: 'B' },
		{ category: 'III', gueteklass: 'C' },
		{ category: 'IV', gueteklass: 'D' },
		{ category: 'V', gueteklass: 'E' },
		{ category: 'VI', gueteklass: 'F' },
		{ category: 'VII', gueteklass: 'G' },
		{ category: null, gueteklass: 'none' }
	];

	let selectedDate = '20241023';
</script>

<div class="min-h-[50vh] relative">
	<Map bind:selectedRegion bind:selectedTiles {gueteklassColors} {selectedDate} {categories} />
	<Inspector bind:selectedRegion bind:selectedTiles {gueteklassColors} {categories} />
</div>
