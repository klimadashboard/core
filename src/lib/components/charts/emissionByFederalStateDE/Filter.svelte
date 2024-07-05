<script>
	export let regions;
	export let selectedRegion;
</script>

<select bind:value={selectedRegion}>
	{#each regions as region}
		<option value={region}>{region}</option>
	{/each}
</select>
