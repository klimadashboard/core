<script>
	import Builder from './builder/index.svelte';
	import Custom from './custom/index.svelte';
	import Wrapper from './Wrapper.svelte';
	import { page } from '$app/state';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItem } from '@directus/sdk';
	export let id;
	export let hideWrapper = false;

	$: getChart = async () => {
		const directus = getDirectusInstance();
		const response = await directus.request(
			readItem('charts', id, {
				fields: ['*', 'translations.*'],
				deep: {
					translations: {
						_filter: {
							languages_code: {
								_eq: page.data.language.code
							}
						}
					}
				}
			})
		);

		const chart = {
			...response,
			content: response.translations[0]
		};

		return {
			chart,
			chartComponent: response.type === 'builder' ? Builder : Custom
		};
	};

	$: promise = getChart();

	/*

	chart = {
		...chart,
		content: chart.translations.find((t) => t.languages_code === page.data.language.code)
	};

	
	*/
</script>

{#await promise then c}
	{#if hideWrapper}
		<svelte:component this={c.chartComponent} chart={c.chart} />
	{:else}
		<Wrapper chart={c.chart}>
			<svelte:component this={c.chartComponent} chart={c.chart} />
		</Wrapper>
	{/if}
{:catch error}
	<p>Could not load chart.</p>
{/await}
