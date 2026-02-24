<script>
	import Chart from './Chart.svelte';
	import Toggle from './Toggle.svelte';
	import Grid from './Grid.svelte';
	import Text from './Text.svelte';
	import News from './News.svelte';
	import Donation from './Donation.svelte';
	import Quiz from './Quiz.svelte';
	import Quotes from './Quotes.svelte';
	import Teaser from './Teaser.svelte';
	import Items from './Items.svelte';
	import Gallery from './Gallery.svelte';
	import Panel from './Panel.svelte';
	import Regions from './Regions.svelte';

	export let data;
	export let chartSnapshots = {};

	const blocks = [
		{
			type: 'block_regions',
			component: Regions
		},
		{
			type: 'block_panel',
			component: Panel
		},
		{
			type: 'block_gallery',
			component: Gallery
		},
		{
			type: 'block_richtext',
			component: Text
		},
		{
			type: 'block_news',
			component: News
		},
		{
			type: 'block_donation',
			component: Donation
		},
		{
			type: 'block_quiz',
			component: Quiz
		},
		{
			type: 'block_quotes',
			component: Quotes
		},
		{
			type: 'block_grid',
			component: Grid
		},
		{
			type: 'block_teaser',
			component: Teaser
		},
		{
			type: 'block_items',
			component: Items
		},
		{
			type: 'block_chart',
			component: Chart
		},
		{
			type: 'block_toggle',
			component: Toggle
		}
	];
</script>

{#each data as block}
	{@const component = blocks.find((d) => d.type == block.collection)?.component}
	{#if component}
		{#if block.collection === 'block_chart' || block.collection === 'block_grid'}
			<svelte:component this={component} block={block.item} {chartSnapshots} />
		{:else}
			<svelte:component this={component} block={block.item} />
		{/if}
	{/if}
{/each}
