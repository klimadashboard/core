<script>
	export let selectedRegion;
</script>

<div
	class="bg-white dark:bg-gray-900 border border-current/10 shadow p-3 rounded-2xl -mt-10 z-30 relative max-w-3xl mx-auto"
>
	{#if selectedRegion}
		<h2 class="text-2xl font-bold">
			Mobilität in {selectedRegion.coordinates[0]}, {selectedRegion.coordinates[1]}
		</h2>
		<p>{selectedRegion.properties.pop} Einwohner*innen</p>
		<p>{selectedRegion.properties.pt} Öffi-Anbindung</p>
		<p>{selectedRegion.properties.mismatch} Mismatch</p>
	{:else}
		<p>
			Wähle eine Region aus, um mehr Informationen zu der Anbindung an den öffentlichen Nahverkehr
			zu erhalten.
		</p>
	{/if}
</div>
