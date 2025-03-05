<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import Chart from './Chart.svelte';

	$: getData = async () => {
		const directus = getDirectusInstance();
		const data = await directus.request(
			readItems('emissions', {
				filter: {
					_and: [
						{
							region: {
								_eq: 'at|wien'
							}
						},
						{
							value: {
								_gte: 0
							}
						}
					]
				},
				limit: -1,
				sort: ['period']
			})
		);
		return data;
	};

	$: promise = getData();
</script>

<div class="">
	{#await promise then data}
		<Chart {data} />
	{/await}
</div>
