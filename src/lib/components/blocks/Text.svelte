<script>
	export let block;
</script>

<div class="my-8 text-lg container text" id={block.id}>
	<div class="max-w-4xl">
		{@html block.content.text}
	</div>
</div>

<style>
	:global(.text a) {
		@apply border-b border-b-gray-300;
	}

	:global(.text p) {
		@apply my-4;
	}
</style>
