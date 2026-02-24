<script>
	import { createEventDispatcher } from 'svelte';
	import Builder from './builder/index.svelte';
	import Custom from './custom/index.svelte';
	import Wrapper from './Wrapper.svelte';
	import Card from './Card.svelte';
	import SnapshotContent from './SnapshotContent.svelte';
	import { page } from '$app/stores';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItem } from '@directus/sdk';
	import { resolvePlaceholders } from '$lib/utils/placeholderUtils.js';

	export let type;
	export let id;
	export let options;
	export let span;
	export let hideWrapper = false;
	export let expandContent = false;
	export let snapshot = null;

	const dispatch = createEventDispatcher();

	// ?snapshot query param: show only static snapshot content (for debugging/inspection)
	$: snapshotPreview = $page.url.searchParams.has('snapshot');

	$: getChart = async (locale) => {
		const directus = getDirectusInstance();
		const response = await directus.request(
			readItem('charts', id, {
				fields: ['*', 'translations.*', 'translations.variables.*'],
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

	$: promise = snapshotPreview ? null : getChart($page.data.language.code);
</script>

<!-- Static snapshot card (SSR / awaiting chart load) — no lifecycle hooks, pure HTML -->
{#snippet snapshotCard()}
	{#if snapshot && type === 'card'}
		<div
			class="chart-card group relative bg-white h-full dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col justify-between"
			style="--span: {span};"
		>
			<div class="p-5 pb-3 min-h-[280px]">
				<SnapshotContent {snapshot} />
			</div>
		</div>
	{/if}
{/snippet}

{#if snapshotPreview}
	{@render snapshotCard()}
{:else if promise}
	{#await promise}
		{@render snapshotCard()}
	{:then c}
		{#if hideWrapper || type == 'small'}
			<svelte:component this={c.chartComponent} chart={c.chart} {type} {options} />
		{:else if type == 'card'}
			<Card chart={c.chart} {span} {expandContent} {snapshot} let:region let:regionLoading let:onChartData on:dataAvailable>
				<svelte:component
					this={c.chartComponent}
					chart={c.chart}
					{type}
					{options}
					{region}
					{regionLoading}
					{onChartData}
				/>
			</Card>
		{:else}
			<Wrapper chart={c.chart}>
				<svelte:component this={c.chartComponent} chart={c.chart} {type} {options} />
			</Wrapper>
		{/if}
	{:catch error}
		<p>Could not load chart.</p>
	{/await}
{/if}

<style>
	@reference "tailwindcss/theme";

	.chart-card {
		grid-column: span 1;
	}

	@media (min-width: 768px) {
		.chart-card {
			grid-column: span var(--span, 12);
		}
	}
</style>
