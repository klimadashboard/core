<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	import { scaleLinear } from 'd3-scale';
	import { max } from 'd3-array';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import formatNumber from '$lib/stores/formatNumber';

	let data = [];

	async function getData() {
		const directus = getDirectusInstance();
		try {
			const response = await directus.request(
				readItems('emissions', {
					filter: {
						_and: [
							{ region: { _eq: PUBLIC_VERSION } },
							{
								category: {
									_eq: 'total'
								}
							}
						]
					},
					sort: ['period'],
					fields: ['*']
				})
			);

			data = await response.map((e) => {
				return {
					x: e.period,
					y: e.value
				};
			});
			return data;
		} catch (err) {
			console.error(err);
			return [];
		}
	}

	// Reactive statement: re-run getNews whenever $page.data.language.code changes.
	$: promise = getData();

	$: yScale = scaleLinear()
		.domain([0, max(data, (d) => d.y)])
		.range([0, 40]);

	let chartWidth;
</script>

{#await promise then data}
	<div class="flex h-14 items-end justify-between relative border-b" bind:clientWidth={chartWidth}>
		{#each data as d}
			<div
				style="height: {Math.round(yScale(d.y))}px; width: {chartWidth / data.length - 2}px;"
				class="bg-current {d == data[data.length - 1] ? 'opacity-100' : 'opacity-50'}"
			></div>
		{/each}
	</div>
	<div class="flex text-xs gap-2 mt-1">
		<p class="shrink-0">{data[0].x}: {formatNumber(data[0].y)} t</p>
		<div class="border-t w-full translate-y-2"></div>
		<p class="shrink-0">{data[data.length - 1].x}: {formatNumber(data[data.length - 1].y)} t</p>
	</div>
{/await}
