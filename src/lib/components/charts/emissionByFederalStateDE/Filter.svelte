<script>
	export let regions;
	export let selectedRegion;
	export let gastypes;
	export let selectedGas;
</script>

<select id="region-select" bind:value={selectedRegion}>
	{#each regions as region}
		<option value={region}>{region}</option>
	{/each}
</select>

<select id="gas-select" bind:value={selectedGas}>
	{#each gastypes as gastype}
		<option value={gastype}>{gastype}</option>
	{/each}
</select>
