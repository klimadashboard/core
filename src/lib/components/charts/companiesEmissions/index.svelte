<script>
	import atxCompanies from '$lib/stores/companies';

	// use companies data with `selected: true` as defaul
	$: companies = atxCompanies.map((company) => {
		return {
			...company,
			selected: true
		};
	});

	$: console.log(companies.map((c) => c.selected));

	function selectAll() {
		for (let [c] of companies.entries()) {
			companies[c].selected = true;
		}
	}
	function deselectAll() {
		for (let [c] of companies.entries()) {
			companies[c].selected = false;
		}
	}

	// Filter
	$: allSelected = companies.reduce((selected, company) => selected && company.selected, true);
	$: allDeselected = companies.reduce(
		(deselected, company) => deselected && !company.selected,
		true
	);
</script>

<div>
	<button
		class="text-blue underline disabled:opacity-50"
		disabled={allSelected}
		on:click={() => {
			selectAll();
		}}>Alle auswählen</button
	><br />
	<button
		class="text-blue underline disabled:opacity-50"
		disabled={allDeselected}
		on:click={() => {
			deselectAll();
		}}>Alle abwählen</button
	><br />
	{#each companies as company}
		<input type="checkbox" id="company-filter-{company.logo}" bind:checked={company.selected} />
		<label for="company-filter-{company.logo}">{company.name}</label><br />
	{/each}
	<br />

	<br />
	Auswahl der Scopes
	<select>
		<option>Scope 1</option>
		<option>Scope 2</option>
		<option>Scope 3</option>
		<option>Scope 1+2</option>
		<option>Scope 1+2+3</option>
	</select>
	<br />

	<mark>Line-Chart mit bisherigen Emissionen</mark>

	<div style="border: 1px solid black">
		<strong>Ausgewählte Unternehmen:</strong>
		<ul>
			{#each companies as company}
				{#if company.selected}
					<li>{company.name}</li>
				{/if}
			{/each}
		</ul>
	</div>
</div>
