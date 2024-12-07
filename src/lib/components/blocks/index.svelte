<script>
	import Heading from './Heading.svelte';
	import Markdown from './Markdown.svelte';
	import Chart from './Chart.svelte';
	import Toggle from './Toggle.svelte';
	import Tabs from './Tabs.svelte';
	import Navigation from './Navigation.svelte';
	import Image from './Image.svelte';
	import Numbers from './Numbers.svelte';
	import ChartPeople from './ChartPeople.svelte';
	import ChartBar from './ChartBar.svelte';
	import Quote from './Quote.svelte';
	import List from './List.svelte';
	import Grid from './Grid.svelte';
	import Text from './Text.svelte';
	import Media from './Media.svelte';
	import Donation from './Donation.svelte';
	import Quiz from './Quiz.svelte';
	import Quotes from './Quotes.svelte';
	import Live from './Live.svelte';

	export let data;
	console.log(data);

	const blocks = [
		{
			type: 'block_live',
			component: Live
		},
		{
			type: 'block_richtext',
			component: Text
		},
		{
			type: 'block_media',
			component: Media
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
			type: 'heading',
			component: Heading
		},
		{
			type: 'markdown',
			component: Markdown
		},
		{
			type: 'block_chart',
			component: Chart
		},
		{
			type: 'tabs',
			component: Tabs
		},
		{
			type: 'block_toggle',
			component: Toggle
		},
		{
			type: 'navigation',
			component: Navigation
		},
		{
			type: 'image',
			component: Image
		},
		{
			type: 'numbers',
			component: Numbers
		},
		{
			type: 'chartPeople',
			component: ChartPeople
		},
		{
			type: 'chartBars',
			component: ChartBar
		},
		{
			type: 'quote',
			component: Quote
		},
		{
			type: 'list',
			component: List
		}
	];
</script>

{#each data as block}
	<svelte:component
		this={blocks.find((d) => d.type == block.collection).component}
		block={block.item}
	/>
{/each}
