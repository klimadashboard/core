<script>
	import { onMount } from 'svelte';
	import News from './News.svelte';
	import Donation from './Donation.svelte';
	import Region from './Region.svelte';
	import About from './About.svelte';
	import Quiz from './Quiz.svelte';
	import Quotes from './Quotes.svelte';
	export let block;

	let ComponentToRender = null;

	const components = {
		news: News,
		donation: Donation,
		region: Region,
		about: About,
		quiz: Quiz,
		quotes: Quotes
		// Add more mappings as needed
	};

	onMount(() => {
		ComponentToRender = components[block.key] || null;
	});
</script>

{#if ComponentToRender}
	<svelte:component this={ComponentToRender} />
{:else}
	<p>No component available for the key: {block.key}</p>
{/if}
