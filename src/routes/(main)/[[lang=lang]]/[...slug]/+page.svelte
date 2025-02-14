<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Blocks from '$lib/components/blocks/index.svelte';

	export let data;
</script>

<PageHeader />
<Blocks data={data.page.blocks} />
