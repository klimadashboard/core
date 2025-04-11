<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import Chart from './Chart.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import { page } from '$app/state';

	$: getData = async (activeLayer) => {
		const directus = getDirectusInstance();
		const code = page.data?.page?.code || '';
		const regionId = activeLayer === 'federalState' ? 'at|burgenland' : code;
		const data = await directus.request(
			readItems('emissions', {
				filter: {
					_and: [
						{
							region: {
								_eq: regionId
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

	$: promise = getData(activeLayer);

	const views = [
		{
			key: 'federalState',
			label: 'Bundesland'
		},
		{
			key: 'municipality',
			label: 'Gemeinde'
		}
	];

	let activeLayer = views[0].key;
</script>

<Switch
	type="small"
	{views}
	bind:activeView={activeLayer}
	on:itemClick={(event) => {
		activeLayer = event.detail;
	}}
/>

<div class="mt-2">
	{#await promise then data}
		<Chart {data} />
	{/await}
</div>
