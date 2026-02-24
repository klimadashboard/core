<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Blocks from '$lib/components/blocks/index.svelte';

	export let data;

	$: hasToggleBlocks = data.page.blocks?.some((b) => b.collection === 'block_toggle');
</script>

<PageHeader />
{#if hasToggleBlocks}
	<div itemscope itemtype="https://schema.org/FAQPage">
		<Blocks data={data.page.blocks} chartSnapshots={data.chartSnapshots} />
	</div>
{:else}
	<Blocks data={data.page.blocks} chartSnapshots={data.chartSnapshots} />
{/if}
