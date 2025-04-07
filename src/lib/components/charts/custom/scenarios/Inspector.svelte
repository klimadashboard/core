<script>
	export let selectedFeature;
	export let variables;
	export let rcps;

	$: console.log(selectedFeature);
</script>

<div class="bg-white dark:bg-dark-800 rounded-2xl p-3 -mt-8 relative z-50 max-w-3xl mx-auto shadow">
	<h2>Inspector</h2>
	{#if selectedFeature}
		<div class="grid md:grid-cols-2 gap-4">
			{#each variables as variable}
				<div>
					<h3 class="font-bold">{variable.label}</h3>
					<p>Definition</p>
					{#each rcps as rcp}
						<h4>{rcp.label}</h4>
						<div>{selectedFeature[variable.key + '_' + rcp.key].q50}</div>
						{#if selectedFeature[variable.key + '_' + rcp.key].trust < 1}
							<div>
								<span>Trust:</span>
								{selectedFeature[variable.key + '_' + rcp.key].trust}
							</div>
						{/if}
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>
