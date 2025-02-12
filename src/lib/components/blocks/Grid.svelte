<script>
	import Block from './index.svelte';
	export let block;
</script>

<div class="grid gap-1 grid-cols-2 lg:grid-cols-4 p-1">
	{#each block.blocks as b}
		<div class="{b.width} rounded-2xl overflow-hidden row-span-{b.height}">
			<Block data={[b]} />
		</div>
	{/each}
</div>

<!-- row-span-1 row-span-2 row-span-3 row-span-4 col-span-1 col-span-2 col-span-2 lg:col-span-3 lg:col-span-1 lg:col-span-4-->
