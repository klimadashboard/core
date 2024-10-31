<script>
	import { onMount } from 'svelte';
	import { glossaryItem } from '$lib/stores/glossary';

	export let htmlString;

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

	let container;

	// Use onMount to set up event listeners
	onMount(() => {
		// Attach the event listener to the parent container

		container.addEventListener('click', handleButtonClick);

		// Cleanup event listener when the component is destroyed
		return () => {
			container.removeEventListener('click', handleButtonClick);
		};
	});
</script>

<div bind:this={container}>
	{@html htmlString}
</div>
