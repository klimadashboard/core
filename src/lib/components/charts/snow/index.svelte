<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems, readItem } from '@directus/sdk';
	import Loader from '$lib/components/Loader.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import Chart from './Chart.svelte';
	import { page } from '$app/stores';

	let selectedStation = 101;

	let tableName = PUBLIC_VERSION == 'de' ? 'de_dwd_data' : 'at_geosphere_data';

	function groupDataByWinter(data) {
		const winters = {};

		data.forEach((entry) => {
			const date = new Date(entry.date);
			const month = date.getMonth(); // 0 (January) to 11 (December)
			const year = date.getFullYear();

			// Include only October (9) to April (3)
			if (month >= 10) {
				// October to December
				const winterKey = `${year}/${year + 1}`;

				if (!winters[winterKey]) {
					winters[winterKey] = [];
				}
				winters[winterKey].push(entry);
			} else if (month <= 2) {
				// January to April
				const winterKey = `${year - 1}/${year}`;

				if (!winters[winterKey]) {
					winters[winterKey] = [];
				}
				winters[winterKey].push(entry);
			}
			// Ignore months May (4) to September (8)
		});

		// Transform the winters object into an array with label and data
		return Object.keys(winters).map((winterKey) => ({
			label: winterKey,
			data: winters[winterKey].map((entry, index) => ({
				...entry
			}))
		}));
	}

	$: getData = async function () {
		const directus = getDirectusInstance(fetch);
		if (selectedStation) {
			const data = await directus.request(
				readItems(tableName, {
					fields: ['date', 'sh'],
					filter: {
						_and: [
							{
								station: {
									id: {
										_eq: parseInt(
											$page.url.searchParams.get('weatherStation')
												? parseInt($page.url.searchParams.get('weatherStation'))
												: 555
										)
									}
								}
							}
						]
					},
					limit: -1
				})
			);

			const wintersData = groupDataByWinter(data);

			return wintersData;
		} else {
			return false;
		}
	};

	$: promise = getData();
</script>

<div>
	{#await promise}
		<Loader showText={true} />
	{:then data}
		<Chart {data} />
	{:catch error}
		{error}
	{/await}
</div>
