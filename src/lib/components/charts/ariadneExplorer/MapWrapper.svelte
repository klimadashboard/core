<script>
	import Map from './Map.svelte';
	import { error } from '@sveltejs/kit';

	export let data;
	export let selectedFeature = false;

	let promise = fetch('https://data.klimadashboard.org/de/geo/landkreise_simplify200.json')
		.then((x) => x.json())
		.catch(function (err) {
			throw error(500, 'Couldn’t load geodata.');
		});
</script>

{#await promise}
	loading...
{:then topo}
	{#if data}
		<Map {data} {topo} bind:selectedFeature />
	{/if}
{:catch error}
	{error}
{/await}
