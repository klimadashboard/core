<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Blocks from '$lib/components/blocks/index.svelte';
	import ChapterNav from '$lib/components/ChapterNav.svelte';

	export let data;

	$: hasToggleBlocks = data.page.blocks?.some((b) => b.collection === 'block_toggle');

	// chapter menu: built from <h2 id="…"> headings in rich-text blocks (see ChapterNav.svelte)
	let blocksRoot;
</script>

<PageHeader />
<div bind:this={blocksRoot}>
	{#if hasToggleBlocks}
		<div itemscope itemtype="https://schema.org/FAQPage">
			<Blocks data={data.page.blocks} chartSnapshots={data.chartSnapshots} />
		</div>
	{:else}
		<Blocks data={data.page.blocks} chartSnapshots={data.chartSnapshots} />
	{/if}
</div>
<ChapterNav root={blocksRoot} />
