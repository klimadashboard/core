<script>
	export let block;
</script>

<div class="bg-gray-100 dark:bg-gray-800 rounded-2xl p-3 py-10 h-full">
	<h2 class="text-center text-3xl font-bold leading-tight">
		{@html block.title}
	</h2>
	<p class="text-lg text-center mx-auto max-w-md leading-snug mb-4 mt-2 text-balance">
		{@html block.text}
	</p>
	<div class="flex items-center gap-4 justify-center text-2xl">
		{#each block.links as l}
			<a href={l.link} class="border-b">{l.label}</a>
		{/each}
	</div>
</div>
