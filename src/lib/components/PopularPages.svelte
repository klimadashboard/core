<script>
	import { page } from '$app/stores';
</script>

<div class="flex mt-4 gap-2">
	{#each $page.data.site.popular_pages as item}
		<a
			href={item.link}
			class="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
			>{item.label}</a
		>
	{/each}
</div>
