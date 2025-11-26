<script>
	import { readItems } from '@directus/sdk';
	import getDirectusInstance from '$lib/utils/directus';
	import Chart from './Chart.svelte';

	// Optional: allow passing regionId, fall back to your example region
	export let regionId = 'dd4fd7ac-aa2b-4762-8902-1be6ef2fcdb2';

	const getData = async () => {
		try {
			const directus = getDirectusInstance(fetch);

			const data = await directus.request(
				readItems('mobility_modal_split', {
					filter: regionId ? { region: { _eq: regionId } } : undefined,
					sort: 'year,category',
					fields: ['year', 'category', 'region', 'value'],
					limit: -1
				})
			);

			return data;
		} catch (e) {
			console.error(e);
		}
	};

	const promise = getData();
</script>

{#await promise then data}
	<Chart {data} />
{/await}
