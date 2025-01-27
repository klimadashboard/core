<script>
	import { page } from '$app/stores';
</script>

<div class="relative">
	<div class="absolute pointer-events-none right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white dark:from-gray-900 to-transparent"></div>

<div class="overflow-scroll ">
<div class="flex mt-4 gap-2">
	{#each $page.data.site.popular_pages as item}
		<a
			href={item.link}
			class="shrink-0 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
			>{item.label}</a
		>
	{/each}
</div>
</div>
</div>
