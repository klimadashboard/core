<script>
	import BarChart from '../chartBar.svelte';

	export let data;
	export let selectedCompanies;
	export let selectedScope;
	export let selectedYear;
	$: console.log(
		'🚀 ~ file: CompanyEmissionsChart.svelte:9 ~ selectedCompanies:',
		selectedCompanies
	);
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:10 ~ selectedScope:', selectedScope);
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:11 ~ selectedYear:', selectedYear);
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:3 ~ data:', data);

	const dataset = {};
	const categoryColors = {
		scope1: '#E59E1A',
		scope2: '#4DB263',
		scope3: '#8C8C8C',
		scope12: '#cd34b5'
	};

	data.forEach((entry) => {
		const [year, scope] = entry.Year_Scope.split('_');

		if (!dataset[year]) {
			dataset[year] = [];
		}

		Object.keys(entry).forEach((key) => {
			if (key !== 'Year_Scope' && scope !== 'scope12') {
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
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:60 ~ dataset:', dataset);

	const chartData = dataset[selectedYear];
</script>

<BarChart data={chartData} visualisation="stacked" />
