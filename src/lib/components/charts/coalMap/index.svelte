<script>
	import Map from './Map.svelte';
	import Loader from '$lib/components/Loader.svelte';

	async function getData() {
		let response = await fetch(`/data_temp/coal.json`);
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
