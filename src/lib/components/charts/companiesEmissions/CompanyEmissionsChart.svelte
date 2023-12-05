<script>
	import BarChart from '../chartBar.svelte';

	// TODO: Pass in selected companies as prop and filter data based on that

	// TODO: In order to use line chart, data needs to be restructured
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

	// function uniqueFilter(value, index, self) {
	// 	return self.indexOf(value) === index;
	// }

	const years = data.map((d) => d.Year_Scope.split('_')[0]);
	const companies = data.map((entry) =>
		Object.getOwnPropertyNames(entry).filter((d) => d !== 'Year_Scope')
	);
	let dataset = {};

	for (let year of years) {
		for (const entry of data) {
			const currentYear = entry.Year_Scope.split('_')[0];
			const scope = entry.Year_Scope.split('_')[1];

			// filter out 'Year_Scope'
			const companyValues = {};
			for (const key in entry) {
				if (key !== 'Year_Scope') {
					companyValues[key] = entry[key];
				}
			}

			// add year and/or scope to dataset
			if (year == currentYear) {
				dataset[currentYear] = {
					...dataset[currentYear],
					[scope]: {
						...companyValues
					}
				};
			}
		}
	}
	console.log('🚀 ~ file: CompanyEmissionsChart.svelte:20 ~ dataset:', dataset);

	const labels = data.map((d) => d.Name);
	const colors = [
		'#ffd700',
		'#ffb14e',
		'#fa8775',
		'#ea5f94',
		'#cd34b5',
		'#9d02d7',
		'#0000ff',
		'#ffd700',
		'#ffb14e',
		'#ea5f94',
		'#cd34b5',
		'#9d02d7',
		'#0000ff',
		'#ffd700',
		'#ffb14e',
		'#ea5f94',
		'#cd34b5',
		'#9d02d7',
		'#ffd700',
		'#ffb14e'
	];
	const keys = ['2015_scope1'];
</script>

<BarChart {data} />
