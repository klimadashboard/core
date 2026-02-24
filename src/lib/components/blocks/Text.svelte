<script>
	export let block;
</script>

<div class="my-8 text-lg container text" id={block.id}>
	<div class="max-w-2xl mx-auto">
		{@html block.content}
	</div>
</div>

<style>
	@reference "tailwindcss/theme";
	:global(.text a) {
		@apply border-b border-b-gray-300;
	}

	:global(.text p) {
		@apply my-2;
	}

	:global(.text ul) {
		@apply list-disc;
	}

	:global(.text h2) {
		@apply text-2xl font-bold mt-12;
	}

	:global(.text h3) {
		@apply text-xl font-bold mt-8;
	}

	:global(.text h4) {
		@apply font-bold mt-4;
	}
</style>
