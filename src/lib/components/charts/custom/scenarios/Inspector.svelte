<script>
	export let selection;
	// export let indicators;
	// export let warmingLevels;

	$: if (selection) {
		console.log(selection);
	}
</script>

<div class="bg-white dark:bg-dark-800 rounded-2xl p-3 -mt-8 relative z-50 max-w-3xl mx-auto shadow">
	<h2>Inspector</h2>
	{#if selection}
		<div class="grid md:grid-cols-2 gap-4">
			AAA
			<!-- {#each indicators as indicator}
				<div>
					<h3 class="font-bold">{indicator.label}</h3>
					<p>Definition</p>
					{#each warmingLevels as warmingLevel}
						<h4>{warmingLevel.label}</h4>
						<div>{selectedFeature[indicator.key + '_' + warmingLevel.key].q50}</div>
						{#if selectedFeature[indicator.key + '_' + warmingLevel.key].trust < 1}
							<div>
								<span>Trust:</span>
								{selectedFeature[indicator.key + '_' + warmingLevel.key].trust}
							</div>
						{/if}
					{/each}
				</div>
			{/each} -->
		</div>
	{/if}
</div>
