<script>
	import Block from './index.svelte';
	export let block;

	const map = [{
		width: 1,
		classes: "col-span-1"
	},{
		width: 2,
		classes: "col-span-2"
	}, {
		width: 3,
		classes: "col-span-2 lg:col-span-3"
	}, {
		width: 4,
		classes: "col-span-2 lg:col-span-4"
	}]
</script>

<div class="grid gap-1 grid-cols-2 lg:grid-cols-4 p-1">
	{#each block.blocks as b}
		<div class="{map.find(d => d.width == b.width)?.classes} rounded-2xl overflow-hidden">
			<Block data={[b]} />
		</div>
	{/each}
</div>