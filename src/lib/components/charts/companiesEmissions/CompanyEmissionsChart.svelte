<script>
	import BarChart from '../chartBar.svelte';

	export let data;
	export let selectedCompanies;
	export let selectedScope = '1';
	export let selectedYear;
	$: console.log(
		'🚀 ~ file: CompanyEmissionsChart.svelte:9 ~ selectedCompanies:',
		selectedCompanies
	);
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:10 ~ selectedScope:', selectedScope);
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:11 ~ selectedYear:', selectedYear);
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:3 ~ data:', data);

	let dataset = {};
	const categoryColors = {
		scope1: '#E59E1A',
		scope2: '#4DB263',
		scope3: '#8C8C8C'
	};

	// TODO: Filter by scope
	// Restructure data
	$: {
		if (data && selectedScope) {
			dataset = {};

			data.forEach((entry) => {
				const [year, scope] = entry.Year_Scope.split('_');
				if (!selectedScope.includes(scope[scope.length - 1])) {
					console.log(`Don't include ${scope} into dataset.`);
					return;
				}

				if (!dataset[year]) {
					dataset[year] = [];
				}

				Object.keys(entry).forEach((key) => {
					if (key !== 'Year_Scope') {
						// && entry[key] !== 'na'

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
						const existingCompany = dataset[year].find((company) => company.label === key);

						if (existingCompany) {
							existingCompany.categories.push(category.categories[0]);
						} else {
							dataset[year].push(category);
						}
					}
				});
			});
		}
		console.log('🚀 ~ file: CompanyEmissionsChart.svelte:60 ~ dataset:', dataset);
	}

	let chartData = dataset[selectedYear];
	$: {
		let selectedCompanyNames = selectedCompanies.map((company) => company.name);

		// filter by selectedCompanies
		chartData = dataset[selectedYear].filter((entry) => {
			return selectedCompanyNames.includes(entry.label);
		});

		console.log('ChartData filtered:', chartData);
	}
</script>

<BarChart data={chartData} visualisation="stacked" />
