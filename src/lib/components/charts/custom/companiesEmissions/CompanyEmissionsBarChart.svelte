<script>
	import BarChart from '../chartBar.svelte';

	export let data;
	export let selectedCompanies;
	export let selectedScopes = '1';
	export let selectedYear;
	export let freezeYAxis;
	export let isFocusView = false;

	const categoryColors = {
		scope1: '#E59E1A',
		scope2: '#4DB263',
		scope3: '#8C8C8C'
	};

	let dataset = [];
	// Restructure and filter data
	$: {
		if (data && selectedScopes && selectedYear && selectedCompanies) {
			dataset = [];
			let selectedCompanyNames = selectedCompanies.map((company) => company.name);

			data.forEach((entry) => {
				const [year, scope] = entry.Year_Scope.split('_');
				// only include selected year
				if (!isFocusView && year !== String(selectedYear)) {
					return;
				}
				// only include selected scopes
				if (!selectedScopes.includes(scope[scope.length - 1])) {
					console.log(`Don't include ${scope} into dataset.`);
					return;
				}

				Object.keys(entry).forEach((key) => {
					if (key !== 'Year_Scope') {
						// Only include selected companies
						if (!selectedCompanyNames.includes(key)) {
							return;
						}

						const category = {
							label: isFocusView ? year : key,
							categories: [
								{
									label: scope,
									value: entry[key] ? parseFloat(entry[key]) : 0,
									color: categoryColors[scope]
								}
							]
						};

						// Check if the company is already in restructuredData for the current year
						let existingEntry;
						if (isFocusView) {
							existingEntry = dataset.find((y) => y.label === year);
						} else {
							existingEntry = dataset.find((company) => company.label === key);
						}

						if (existingEntry) {
							existingEntry.categories.push(category.categories[0]);
						} else {
							dataset.push(category);
						}
					}
				});
			});
		}
	}
</script>

<BarChart data={dataset} visualisation="stacked" {freezeYAxis} />
