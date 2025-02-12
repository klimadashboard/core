<script>
	import Builder from './builder/index.svelte';
	import Custom from './custom/index.svelte';
	import Wrapper from './Wrapper.svelte';
	import { page } from '$app/stores';
	export let chart;
	export let hideWrapper = false;

	/* todo: fix this in API call */
	chart = {
		...chart,
		content: chart.translations.find((t) => t.languages_code === $page.data.language.code)
	};

	let ChartComponent = chart.type === 'builder' ? Builder : Custom;
</script>

{#if hideWrapper}
	<svelte:component this={ChartComponent} {chart} />
{:else}
	<Wrapper {chart}>
		<svelte:component this={ChartComponent} {chart} />
	</Wrapper>
{/if}
