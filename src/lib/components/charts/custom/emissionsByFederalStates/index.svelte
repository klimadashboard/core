<script>
	import Chart from './Chart.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { pivot_multikey } from '$lib/utils/data';
	import { getYearlyPopulationByRegionID } from '$lib/utils/directus.helper';

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
		} catch (error) {
			console.error('Error fetching emission data:', error);
		}
	};

	$: getEmissionsData();
</script>

{#if dataset && maxYear}
	<Chart data={dataset} {maxYear} />
{/if}
