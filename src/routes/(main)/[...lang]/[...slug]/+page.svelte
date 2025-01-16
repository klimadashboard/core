<script>
	import Blocks from '$lib/components/blocks/index.svelte';

	export let data;
</script>

<div class="">
	<Blocks data={data.content.blocks} />
</div>
