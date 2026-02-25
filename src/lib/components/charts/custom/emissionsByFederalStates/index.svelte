<script>
	import Chart from './Chart.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { pivot_multikey } from '$lib/utils/data';
	import { getYearlyPopulationByRegionID } from '$lib/utils/directus.helper';

	export let chart;
	export let v;
	export let onChartData = undefined;

	const SECTORS = [
		{ key: 'Energie', label: 'Energie' },
		{ key: 'Industrie', label: 'Industrie' },
		{ key: 'Verkehr', label: 'Verkehr' },
		{ key: 'Gebäude', label: 'Gebäude' },
		{ key: 'Landwirtschaft', label: 'Landwirtschaft' },
		{ key: 'Müll', label: 'Abfallwirtschaft' },
		{ key: 'F-Gase', label: 'Fluorierte Gase' }
	];

	let dataset = [];
	let maxYear;

	const getEmissionsData = async function () {
		try {
			const directus = getDirectusInstance(fetch);
			let data = await directus.request(
				readItems('emissions_data', {
					filter: {
						_and: [
							{
								country: { _eq: PUBLIC_VERSION.toUpperCase() },
								source: { _eq: 'BLI 2025 (1990-2023)' },
								type: { _eq: 'Gesamt' }
							}
						]
					},
					sort: 'year,category.label',
					fields: [
						'category.label',
						'gas.name',
						'gas.unit',
						'id',
						'region.id',
						'region.name',
						'source',
						'type',
						'value',
						'year'
					],
					limit: -1
				})
			);

			data = data.map((row, i) => ({
				id: row.id,
				source: row.source,
				value: row.value,
				year: row.year,
				region_id: row.region?.id,
				region: row.region?.name,
				sektor: row.category?.label,
				pollutant: row.gas?.name,
				unit: row.gas?.unit,
				classification: row.type
			}));

			const sektors = [...new Set(data.map((row) => row.sektor))];

			const pivot_table = pivot_multikey(
				data,
				['year', 'classification', 'pollutant', 'region', 'region_id', 'source', 'unit'],
				'sektor'
			);

			// fetch population data
			const regions = [...new Set(data?.map((row) => row.region_id))];
			const temp_populations = {};
			for (const i in regions) {
				temp_populations[regions[i]] = await getYearlyPopulationByRegionID(regions[i]);
			}

			// add percapita data
			dataset = pivot_table.map((row) => {
				const pop = temp_populations[row.region_id].find(
					(pop_row) => row.year === new Date(pop_row.period).getFullYear()
				);
				const new_row = { ...row };

				for (const key in sektors) {
					const sektor = sektors[key];
					new_row[sektor + '_percapita'] = row[sektor] / pop?.value;
				}
				new_row['population'] = pop?.value;
				return new_row;
			});

			maxYear = [...dataset].sort((a, b) => b.year - a.year)[0].year;

			// Pass table data to Card for CSV export / snapshots
			if (onChartData) {
				const regionNames = [...new Set(data.map((d) => d.region))].sort();
				const latestData = data.filter((d) => d.year === maxYear);
				const availableSectors = [...new Set(data.map((d) => d.sektor))];

				const columns = [
					{ key: 'region', label: 'Region', align: 'left' },
					...SECTORS.filter((s) => availableSectors.includes(s.key)).map((s) => ({
						key: s.key,
						label: v?.[s.key] || s.label,
						align: 'right',
						format: (val) =>
							typeof val === 'number' ? Math.round(val).toLocaleString('de-AT') : '–'
					})),
					{
						key: 'total',
						label: 'Gesamt',
						align: 'right',
						format: (val) =>
							typeof val === 'number' ? Math.round(val).toLocaleString('de-AT') : '–'
					}
				];

				const tableRows = regionNames.map((region) => {
					const regionData = latestData.filter((d) => d.region === region);
					const row = { region };
					let total = 0;
					for (const s of SECTORS) {
						const val = regionData.find((d) => d.sektor === s.key)?.value ?? null;
						row[s.key] = val;
						if (val != null) total += val;
					}
					row.total = total > 0 ? total : null;
					return row;
				});

				onChartData({
					raw: data,
					table: {
						columns,
						rows: tableRows,
						filename: 'emissionen_bundeslaender'
					},
					placeholders: {
						dataYear: String(maxYear)
					},
					meta: {
						source: 'Bundesländer Inventur, Umweltbundesamt'
					}
				});
			}
		} catch (error) {
			console.error('Error fetching emission data:', error);
		}
	};

	$: getEmissionsData();
</script>

{#if dataset && maxYear}
	<Chart data={dataset} {maxYear} />
{/if}
