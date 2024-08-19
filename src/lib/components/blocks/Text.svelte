<script>
	import { glossaryItem } from '$lib/stores/glossary';
	import { onMount } from 'svelte';

	export let block;

	let htmlString = block.content.text;

	function replaceGlossaryPlaceholders(htmlString) {
		return htmlString.replace(/{{glossary:([^}]+)}}/g, (match, variable) => {
			// Return a button with a data-term attribute
			return `<span class="glossary-label" data-term="${variable}"></span>`;
		});
	}

	// Replace placeholders with buttons containing data-term attributes
	htmlString = replaceGlossaryPlaceholders(htmlString);

	// Handle the click event
	function handleButtonClick(event) {
		const term = event.target.dataset.term;
		if (term) {
			$glossaryItem = term;
		}
	}

	// Use onMount to set up event listeners
	onMount(() => {
		// Attach the event listener to the parent container
		const container = document.getElementById(block.id);
		container.addEventListener('click', handleButtonClick);

		// Cleanup event listener when the component is destroyed
		return () => {
			container.removeEventListener('click', handleButtonClick);
		};
	});
</script>

<div class="my-8 text-lg container text" id={block.id}>
	<div class="max-w-4xl">
		{@html htmlString}
	</div>
</div>

<style>
	:global(.text a) {
		@apply border-b border-b-gray-300;
	}

	:global(.text p) {
		@apply my-4;
	}
</style>
