<script>
	export let block;
</script>

<div class="container grid md:grid-cols-3 gap-4">
	{#each block.content.navigation as item}
		<a href={item.link} class="relative border border-gray-200 rounded hover:bg-gray-200 transition overflow-hidden">
			{#if item.image}
			<img src="https://klimadashboard.org/@/file/{item.image}" alt="{item.image.alt}" class="">
			{/if}
			<div class="p-4">
			{#if item.eyebrow}
			<span class="uppercase tracking-wide font-semibold text-sm text-gray-500">{item.eyebrow}</span>
			{/if}
			{#if item.label}
			<h3 class="text-2xl mt-1">{item.label}</h3>
			{/if}
			{#if item.text}
			<p class="mt-2 text-lg">{item.text}</p>
			{/if}
			</div>
			<svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="absolute bottom-4 right-4"><path d="M1 7H15" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9 13L15 7" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9 1L15 7" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
		</a>
	{/each}
</div>