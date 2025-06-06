<script>
	export let regions;
	export let filteredRegions;
	export let selectedRegion;

	let searchTerm = '';

	$: if (searchTerm.length > 2) {
		filteredRegions = regions.filter((r) =>
			r.name.toLowerCase().includes(searchTerm.toLowerCase())
		);
	} else {
		filteredRegions = [];
	}

	$: if (selectedRegion) {
		filteredRegions = [];
		searchTerm = '';
	}
</script>

<div>
	<input
		type="search"
		bind:value={searchTerm}
		class="input w-full my-2"
		placeholder="Suche nach einer Region..."
	/>
</div>
