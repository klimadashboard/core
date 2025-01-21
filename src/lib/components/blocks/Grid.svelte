<script>
	import Block from './index.svelte';
	export let block;
	console.log(block);
</script>

<div class="grid gap-1 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 p-1">
	{#each block.blocks as b}
		<div class="col-span-{b.width} rounded-2xl overflow-hidden">
			<Block data={[b]} />
		</div>
	{/each}
</div>

<!-- col-span-1 col-span-2 col-span-3 col-span-4 -->
