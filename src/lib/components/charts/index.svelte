<script>
	import Builder from './builder/index.svelte';
	import Custom from './custom/index.svelte';
	import Wrapper from './Wrapper.svelte';
	import { locale } from '$lib/stores/i18n';

	export let chart;
	export let hideWrapper = false;

	/* todo: fix this in API call */
	chart = { ...chart, content: chart.translations.find((t) => t.languages_code === $locale) };
</script>

{#if hideWrapper}
	{#if chart.type == 'builder'}
		<Builder {chart} />
	{:else}
		<Custom {chart} />
	{/if}
{:else}
	<Wrapper {chart}>
		{#if chart.type == 'builder'}
			<Builder {chart} />
		{:else}
			<Custom {chart} />
		{/if}
	</Wrapper>
{/if}

<style>
	:global(.data-notices h3, .data-notices h4) {
		@apply mt-4;
	}

	:global(.data-notices h3) {
		@apply text-2xl;
	}

	:global(.data-notices ul) {
		@apply list-disc list-outside pl-5 py-2;
	}

	:global(.data-notices ol) {
		@apply list-decimal list-inside py-2;
	}

	:global(.data-notices li p) {
		@apply whitespace-nowrap inline;
	}
</style>
