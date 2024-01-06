<script>
	import BarChart from '../chartBar.svelte';

	export let data;
	export let selectedCompanies;
	export let selectedScopes = '1';
	export let selectedYear;
	$: console.log(
		'🚀 ~ file: CompanyEmissionsChart.svelte:9 ~ selectedCompanies:',
		selectedCompanies
	);
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:10 ~ selectedScope:', selectedScopes);
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:11 ~ selectedYear:', selectedYear);
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:3 ~ data:', data);

	let dataset = {};
	const categoryColors = {
		scope1: '#E59E1A',
		scope2: '#4DB263',
		scope3: '#8C8C8C'
	};

	// Restructure and filter data
	$: {
		if (data && selectedScopes && selectedYear && selectedCompanies) {
			dataset = [];
			let selectedCompanyNames = selectedCompanies.map((company) => company.name);

			data.forEach((entry) => {
				const [year, scope] = entry.Year_Scope.split('_');
				// only include selected year
				if (year !== String(selectedYear)) {
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
							label: key,
							categories: [
								{
									label: scope,
									value: entry[key] ? parseFloat(entry[key]) : 0,
									color: categoryColors[scope]
								}
							]
						};

						// Check if the company is already in restructuredData for the current year
						const existingCompany = dataset.find((company) => company.label === key);

						if (existingCompany) {
							existingCompany.categories.push(category.categories[0]);
						} else {
							dataset.push(category);
						}
					}
				});
			});
		}
		console.log('🚀 ~ file: CompanyEmissionsChart.svelte:60 ~ dataset:', dataset);
	}
</script>

<BarChart data={dataset} visualisation="stacked" />
