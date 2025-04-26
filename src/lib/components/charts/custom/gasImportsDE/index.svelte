<script>
	import ChartLine from '$lib/components/charts/chartLine.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';

	const keys = [
		'Tschechien',
		'Niederlande',
		'Belgien',
		'Polen',
		'Norwegen',
		'Dänemark',
		'Frankreich',
		'Österreich',
		'Schweiz',
		'Russland',
		'LNG',
		'Deutschland Import'
	];
	const labels = [
		'Tschechien',
		'Niederlande',
		'Belgien',
		'Polen',
		'Norwegen',
		'Dänemark',
		'Frankreich',
		'Österreich',
		'Schweiz',
		'Russland',
		'LNG',
		'Deutschland Import'
	];
	const colors = [
		'#4e79a7',
		'#f28e2c',
		'#e15759',
		'#76b7b2',
		'#59a14f',
		'#edc949',
		'#af7aa1',
		'#ff9da7',
		'#9c755f',
		'#bab0ab',
		'#8CAED9',
		'#A56BC8',
		'#072F58'
	];

	const pivot = (data, key, category) => {
		// Step 1: Create a map to track the rows by date
		const map = {};

		// Step 2: Iterate over the data array and populate the map
		data.forEach((item) => {
			if (!map[item[key]]) {
			// If a row for this date doesn't exist, create a new row
			map[item[key]] = { label: item[key] };
			}

			// Set the value for the category dynamically (e.g. "Fruit", "Vegetable")
			map[item[key]][item[category]] = item.value;
		});

		// Step 3: Convert the map values to an array
		return Object.values(map);
	};

	let data;
	const getGasImportData = async function () {
		var d = new Date();
		d.setDate(d.getDate() - 365);

		try {
			const directus = getDirectusInstance(fetch);
			let gas_imports = await directus.request(
				readItems('gas_imports', {
					filter: {
						_and: [
							{
								Country: { _eq: PUBLIC_VERSION.toUpperCase() },
								date: { _gte: d }
							},
						]
					},
					limit: -1,
					fields: ['import_country.name_de', 'import_source', 'date', 'value'],
					sort: ['date']
				})
			);
			gas_imports = gas_imports.map((row, i) => ({
				...row,
				category: row.import_source === null ? row.import_country.name_de: row.import_source,
				label: new Date(row.date).toLocaleDateString('de-DE', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric'
				})
			}));
			const pivot_table = pivot(gas_imports, "label", "category")
			data = pivot_table.map((e, i) => {
				return {
					...e,
					x: i
				}
			})//.splice(pivot_table.length - 365)
		} catch (error) {
			console.error('Error fetching suggestions:', error);
		}
	};

	$: getGasImportData();

</script>

<div class="h-80">
	{#if data}
		<ChartLine
			showZeroValuesInLegend={false}
			{data}
			{labels}
			{keys}
			{colors}
			xTicksInterval={52}
			unit={'GWh/Tag'}
			showTotal={false}
		/>
	{/if}
</div>
