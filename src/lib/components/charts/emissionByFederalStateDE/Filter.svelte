<script>
	export let regions;
	export let selectedRegion;
	export let gastypes;
	export let selectedGas;
	export let availableRegions;
	export let endYear = 2030; // New prop for end year

	function handleRegionChange(event) {
		const newRegion = event.target.value;
		if (availableRegions.includes(newRegion)) {
			selectedRegion = newRegion;
		}
	}

	function handleEndYearChange(event) {
		endYear = parseInt(event.target.value);
	}
</script>

<div class="flex flex-wrap gap-4 items-start sm:justify-start">
	<div class="relative text-gray-600">
		<svg xmlns="http://www.w3.org/2000/svg" class="absolute pointer-events-none top-3 h-6 right-2 transform -translate-y-0.5 icon-tabler-selector" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><polyline points="8 9 12 5 16 9"></polyline><polyline points="16 15 12 19 8 15"></polyline></svg>
		<select 
			id="region-select" 
			value={selectedRegion}
			on:change={handleRegionChange}
			class="block appearance-none w-full bg-gray-200 border border-gray-100 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 max-w-sm"
		>
			{#each regions as region}
				<option 
					value={region} 
					disabled={!availableRegions.includes(region)}
					class={!availableRegions.includes(region) ? 'text-gray-400' : ''}
				>
					{region}
				</option>
			{/each}
		</select>
	</div>
	<div class="relative text-gray-600">
		<svg xmlns="http://www.w3.org/2000/svg" class="absolute pointer-events-none top-3 h-6 right-2 transform -translate-y-0.5 icon-tabler-selector" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><polyline points="8 9 12 5 16 9"></polyline><polyline points="16 15 12 19 8 15"></polyline></svg>
		<select 
			id="gas-select" 
			bind:value={selectedGas}
			class="block appearance-none w-full bg-gray-200 border border-gray-100 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 max-w-sm"
		>
			{#each gastypes as gastype}
				<option value={gastype}>{gastype}</option>
			{/each}
		</select>
	</div>
	<div class="relative text-gray-600">
		<fieldset>
			<legend class="sr-only">End Year</legend>
			<div class="flex items-center space-x-4">
				<label class="inline-flex items-center">
					<input type="radio" class="form-radio" name="endYear" value="2030" checked={endYear === 2030} on:change={handleEndYearChange}>
					<span class="ml-2">2030</span>
				</label>
				<label class="inline-flex items-center">
					<input type="radio" class="form-radio" name="endYear" value="2040" checked={endYear === 2040} on:change={handleEndYearChange}>
					<span class="ml-2">2040</span>
				</label>
			</div>
		</fieldset>
	</div>
</div>