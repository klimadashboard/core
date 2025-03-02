<script>
	import Builder from './builder/index.svelte';
	import Custom from './custom/index.svelte';
	import Wrapper from './Wrapper.svelte';
	import { page } from '$app/stores';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItem } from '@directus/sdk';
	import { resolvePlaceholders } from '$lib/utils/placeholderUtils.js';

	export let type;
	export let id;
	export let options;
	export let hideWrapper = false;

	$: getChart = async (locale) => {
		const directus = getDirectusInstance();
		const response = await directus.request(
			readItem('charts', id, {
				fields: ['*', 'translations.*'],
				filter: {
					status: {
						_eq: 'published'
					}
				},
				deep: {
					translations: {
						_filter: {
							languages_code: { _eq: locale }
						}
					}
				}
			})
		);

		const chart = {
			...response,
			content: response.translations[0]
		};

		const resolvedChart = await resolvePlaceholders(chart);

		return {
			chart: resolvedChart,
			chartComponent: response.type === 'builder' ? Builder : Custom
		};
	};

	$: promise = getChart($page.data.language.code);
</script>

{#await promise then c}
	{#if hideWrapper || type == 'small'}
		<svelte:component this={c.chartComponent} chart={c.chart} {type} {options} />
	{:else}
		<Wrapper chart={c.chart}>
			<svelte:component this={c.chartComponent} chart={c.chart} {type} {options} />
		</Wrapper>
	{/if}
{:catch error}
	<p>Could not load chart.</p>
{/await}
