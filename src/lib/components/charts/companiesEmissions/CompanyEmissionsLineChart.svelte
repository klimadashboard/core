<script>
	// @ts-nocheck
	import LineChart from '../chartLine.svelte';

	export let rawData;
	export let selectedCompanies;
	export let selectedScopes = ['scope1'];
	export let selectedYear;
	export let freezeYAxis;
	let isSingleCompanySelected;
	let selectedCompanyNames
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:5 ~ data:', rawData);
	$: console.log(
		'🚀 ~ file: CompanyEmissionsChart.svelte:9 ~ selectedCompanies:',
		selectedCompanies
	);
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:10 ~ selectedScope:', selectedScopes);
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:11 ~ selectedYear:', selectedYear);
	$: isSingleCompanySelected = selectedCompanies.length === 1;
	$: selectedCompanyNames = [...selectedCompanies].map((company) => company.name);

	const rawColors = ['#7CBAB3', '#575C75', '#71665B', '#B28834', '#8CAED9', '#E0A906', '#CF6317'];
	const rawLabels = ['Scope 1', 'Scope 2', 'Scope 3'];
	const rawKeys = ['scope1', 'scope2', 'scope3'];

	// Specify the company name to filter for
	const companyName = selectedCompanies[0].name;

	// Function to parse the year and scope from the "Year_Scope" string
	const parseYearScope = (yearScope) => {
		const [year, scope] = yearScope.split('_');
		return { year: parseInt(year), scope: scope };
	};

	// Transform and merge the data for the selected company
	const transformAndMergeData = (data, company) => {
		// Object to hold emissions data per year with merged scopes
		const emissionsPerYear = {};

		// Iterate over each item in the rawData
		data.forEach((item) => {
			const { Year_Scope, ...emissions } = item;
			const { year, scope } = parseYearScope(Year_Scope);

			// only include selected scopes
			if (!selectedScopes.includes(scope)) {
				return;
			}

			// If the specific company has emission data for this entry, merge it
			if (!emissionsPerYear[year]) {
				emissionsPerYear[year] = { year, unit: 'CO2', label: year }; // Initialize if not present
			}
			emissionsPerYear[year][scope] =
				emissions[company] !== 'na' ? parseInt(emissions[company]) : 0; // Merge scope data
		});

		// Convert the emissionsPerYear object into a sorted array and add the 'x' counter
		return Object.values(emissionsPerYear)
			.sort((a, b) => a.year - b.year)
			.map((item, index) => {
				return {
					...item,
					x: index // Set x to current index, starting at 0
				};
			});
	};

// Function to aggregate the emissions for selected companies and scopes
const aggregateEmissions = (data, companies, selectedScopes) => {
  const emissionsPerYear = {};
  data.forEach(item => {
    const { Year_Scope, ...emissions } = item;
    const { year } = parseYearScope(Year_Scope);
    
    // Initialize the emissions data object for the year if it does not exist
    if (!emissionsPerYear[year]) {
      emissionsPerYear[year] = { year, unit: 'CO2', label: year };
    }

    companies.forEach(company => {
      if (emissions[company]) {
        // Aggregate emission data for the company and selected scopes
        selectedScopes.forEach(scope => {
          if (!emissionsPerYear[year][company]) {
            emissionsPerYear[year][company] = 0;
          }
          if (Year_Scope.includes(scope)) {
            emissionsPerYear[year][company] += parseInt(emissions[company]);
          }					
        });
      }
    });
  });

	// Convert the emissionsPerYear object into a sorted array and add the 'x' counter
	return Object.values(emissionsPerYear).sort((a, b) => a.year - b.year).map((item, index) => {
		console.log('🚀 ~ item:', item);
		return {
			...item,
			x: index // Set x to current index, starting at 0
		};
	});
}


	let dataset = [];
	let keys;
	let labels;
	let colors;
	$: {
		if (rawData && companyName && selectedScopes && selectedYear) {

			if (isSingleCompanySelected) {
				// Specify the company name to filter for
				const companyName = selectedCompanies[0].name;
				dataset = transformAndMergeData(rawData, companyName, selectedScopes);
			} else {
				dataset = aggregateEmissions(rawData, selectedCompanyNames, selectedScopes);
				console.log("🚀 ~ dataset:", dataset)
			}


			// Select keys, colors and labels
			if (selectedScopes.length === 1) {
				keys = isSingleCompanySelected ? selectedScopes : selectedCompanyNames;
				labels = isSingleCompanySelected ? [`Scope ${selectedScopes[0].slice(-1)}`] : selectedCompanyNames;
				colors = isSingleCompanySelected ? [rawColors[parseInt(selectedScopes[0].slice(-1)) - 1]] : rawColors.slice(0, selectedCompanyNames.length);
			} else {
				keys = isSingleCompanySelected ? rawKeys.slice(0, selectedScopes.length) : selectedCompanyNames;
				labels = isSingleCompanySelected ? rawLabels.slice(0, selectedScopes.length) : selectedCompanyNames;
				colors = isSingleCompanySelected ? rawColors.slice(0, selectedScopes.length) : rawColors.slice(0, selectedCompanyNames.length);
			}

			console.log('🚀 ~ keys:', keys);
			console.log('🚀 ~ labels:', labels);
			console.log('🚀 ~ colors:', colors);
			console.log('🚀 ~ dataset:', dataset);
		}
	}
</script>

{#if dataset && selectedCompanies.length > 0 && selectedCompanies.length < 8}
	<LineChart
		data={dataset}
		{colors}
		{keys}
		{labels}
		showTotal={isSingleCompanySelected}
		showAreas={isSingleCompanySelected}
		visualisation={isSingleCompanySelected ? 'stacked' : 'non-stacked'}
	/>
{:else if selectedCompanies.length === 0}
	<p style="text-align: center;">No company selected. Select up to 7 companies.</p>
{:else if selectedCompanies.length > 6}
	<p style="text-align: center;">Too many companies selected. Select up to 7 companies.</p>
{:else}
	<p style="text-align: center;">Loading...</p>
{/if}
