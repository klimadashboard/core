<script>
	export let block;
</script>

<div class="container my-8">
	<blockquote class=" border-l pl-4 mr-4" id={block.id}>
		<div class="max-w-4xl text-xl">
			{@html block.content.text}
		</div>
		<p class="mt-1 text-lg text-gray-500">– {block.content.citation}</p>
	</blockquote>
</div>

<style>
</style>
