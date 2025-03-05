<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import Chart from './Chart.svelte';

	$: getData = async () => {
		const directus = getDirectusInstance();
		const data = await directus.request(
			readItems('emissions', {
				filter: {
					region: {
						_eq: 'at'
					}
				}
			})
		);
		return data;
	};

	$: promise = getData();
</script>

<div class="h-40">
	{#await promise then data}
		<Chart {data} />
	{/await}
</div>
