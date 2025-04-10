<script>
	import ChartLine from '$lib/components/charts/chartLine.svelte';
	import Papa from 'papaparse';
	import dayjs from 'dayjs';
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

	let dataGasImports;
	const getGasImportDataBySource = async function (source_name) {
		try {
			const directus = getDirectusInstance(fetch);
			let gas_imports = await directus.request(
				readItems('gas_imports', {
					filter: {
						_and: [
							{
								Country: { _eq: PUBLIC_VERSION.toUpperCase() }
							},
							{
								_or: [
									{
										import_country: {
											name_de: { _eq: source_name }
										}
									},
									{ import_source: { _eq: source_name } }
								]
							}
						]
					},
					limit: -1,
					fields: ['import_country.name_de', 'import_source', 'date', 'value'],
					sort: ['date']
				})
			);
			gas_imports = gas_imports.map((row) => ({
				...row,
				date: new Date(row.date).toLocaleDateString('de-DE', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric'
				})
			}));
			console.log(source_name, ': ', gas_imports);
		} catch (error) {
			console.error('Error fetching suggestions:', error);
		}
	};

	$: getGasImportDataBySource('Deutschland Import');

	let rawData;

	Papa.parse('https://data.klimadashboard.org/de/energy/fossil/gas_imports-bundesnetzagentur.csv', {
		download: true,
		dynamicTyping: true,
		header: true,
		skipEmptyLines: true,
		complete: function (results) {
			if (results) {
				rawData = results.data;
			}
		}
	});

	$: data = rawData?.splice(rawData.length - 365).map((e, i) => {
		return {
			...e,
			x: i,
			label: e['                     .']
		};
	});
	$: console.log(data);
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
