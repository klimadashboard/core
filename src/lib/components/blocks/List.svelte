<script>
	export let block;
</script>

<div class="container">
	<h2 class="text-sm uppercase font-semibold tracking-wider text-gray-500 mb-2">
		{block.content.label}
	</h2>
	<div class="block-list">
		{@html block.content.text}
	</div>
</div>
