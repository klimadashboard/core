<script>
	import LineChart from '../chartLine.svelte';

	export let rawData;
	export let selectedCompanies;
	export let selectedScopes = '1';
	export let selectedYear;
	export let freezeYAxis;
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:5 ~ data:', rawData);
	$: console.log(
		'🚀 ~ file: CompanyEmissionsChart.svelte:9 ~ selectedCompanies:',
		selectedCompanies
	);
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:10 ~ selectedScope:', selectedScopes);
	$: console.log('🚀 ~ file: CompanyEmissionsChart.svelte:11 ~ selectedYear:', selectedYear);

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
			if (!selectedScopes.includes(scope[scope.length - 1])) {
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

	let dataset = [];
	let keys;
	let labels;
	let colors;
	$: {
		if (rawData && companyName && selectedScopes && selectedYear) {
			// Specify the company name to filter for
			const companyName = selectedCompanies[0].name;

			dataset = transformAndMergeData(rawData, companyName, selectedScopes);

			// Select keys, colors and labels
			if (selectedScopes.length === 1) {
				keys = [`scope${selectedScopes[0]}`];
				labels = [`Scope ${selectedScopes[0]}`];
				colors = [rawColors[selectedScopes[0] - 1]];
			} else {
				keys = rawKeys.slice(0, selectedScopes.length);
				labels = rawLabels.slice(0, selectedScopes.length);
				colors = rawColors.slice(0, selectedScopes.length);
			}

			console.log('🚀 ~ keys:', keys);
			console.log('🚀 ~ labels:', labels);
			console.log('🚀 ~ colors:', colors);
			console.log('🚀 ~ companyEmissions:', dataset);
		}
	}
</script>

{#if dataset}
	<LineChart
		data={dataset}
		{colors}
		{keys}
		{labels}
		showTotal={true}
		showAreas={true}
		visualisation={'stacked'}
	/>
{:else}
	<p>Loading...</p>
{/if}
