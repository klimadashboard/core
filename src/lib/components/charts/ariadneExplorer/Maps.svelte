<script>
	import Map from './Map.svelte';
	import { error } from '@sveltejs/kit';

	export let data;
	export let years;
	export let selectedPolicy;
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
		<div class="flex space-x-2">
			{#each years as year}
				<div class="text-center">
					<Map data={data.filter((d) => d.year == year)} {topo} bind:selectedFeature />
					<p class="text-gray-700">{year}</p>
					{#if selectedFeature}
						<p class="text-4xl">
							{data.find(
								(d) =>
									d.year == year &&
									d.code == selectedFeature.properties.RS &&
									d.policy == selectedPolicy
							)['support.rd']}%
						</p>
						<p>
							Zustimmung in
							{selectedFeature.properties.GEN}
						</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
{:catch error}
	{error}
{/await}
