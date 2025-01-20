<script>
	export let block;
	console.log(block);
</script>

<div class="my-8 text-lg container text" id={block.id}>
	<div class="max-w-2xl mx-auto">
		{@html block.content}
	</div>
</div>

<style>
	:global(.text a) {
		@apply border-b border-b-gray-300;
	}

	:global(.text p) {
		@apply my-4;
	}

	:global(.text h2) {
		@apply text-2xl font-bold mt-12;
	}
</style>
