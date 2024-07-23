<script>
	import { createEventDispatcher } from 'svelte';
	import SearchBox from '$lib/components/SearchBox.svelte';
	import Papa from 'papaparse';

	export let selectedFeature;

	let data;

	Papa.parse('https://data.klimadashboard.org/de/geo/municipality_lookup.csv', {
		download: true,
		dynamicTyping: true,
		header: true,
		skipEmptyLines: true,
		complete: function (results) {
			if (results) {
				data = results.data;
			}
		}
	});

	let searchBox;

	export function reset() {
		selectedFeature = false;
		searchBox?.reset();
	}

	const dispatch = createEventDispatcher();

	$: searchItems = data?.map((feature, i) => ({
		key: i,
		title: feature.municipality_code + ' ' + feature.municipality_name,
		subtitle: feature.region_name || null,
		region_code: feature.region_code
	}));
</script>

{#if searchItems}
	<SearchBox
		bind:this={searchBox}
		items={searchItems}
		placeholder={selectedFeature ? selectedFeature : 'PLZ eingeben...'}
		on:selectItem={(e) =>
			e.detail ? (selectedFeature = e.detail.item.region_code) : (selectedFeature = false)}
	/>
	{#if selectedFeature}
		<button on:mousedown={reset}>Reset</button>
	{/if}
{/if}
