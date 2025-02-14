<script>
	import { page } from '$app/state';

	let popularPages = $derived(page.data.site?.translations[0]?.popular_pages);
</script>

<div class="relative">
	<div
		class="absolute pointer-events-none right-0 top-0 bottom-0 w-16 bg-linear-to-l from-white dark:from-gray-950 to-transparent"
	/>

	<div class="overflow-auto">
		<div class="flex mt-4 gap-2">
			{#each popularPages as item}
				<a href={item.link} class="shrink-0 button">{item.label}</a>
			{/each}
		</div>
	</div>
</div>
