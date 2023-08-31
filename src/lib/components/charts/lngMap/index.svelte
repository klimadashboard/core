<script>
	import Map from './Map.svelte';
	import Loader from '$lib/components/Loader.svelte';

	async function getData() {
		let response = await fetch(
			`https://data.klimadashboard.org/de/energy/fossil/lng_terminals.json`
		);
		let data = await response.json();
		if (response.ok) {
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
