<script>
	export let block;
</script>

<div class="container">
	<div class="my-4 text-lg {block.content.fullwidth == 'true' ? 'w-full' : ''}" id={block.id}>
		{@html block.content.text}
	</div>
</div>
