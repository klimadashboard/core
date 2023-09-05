<script>
	import Map from './Map.svelte';
	import Loader from '$lib/components/Loader.svelte';

	async function getData() {
		let response = await fetch(
			`https://data.klimadashboard.org/de/energy/fossil/coal_mines_plants.json`
		);
		let data = await response.json();
		if (response.ok) {
			console.log(data);
			return data;
		} else {
			throw new Error(data);
		}
	}

	$: promise = getData();
</script>

<div>
	{#await promise}
		<Loader />
	{:then data}
		<Map {data} />
	{/await}
</div>
