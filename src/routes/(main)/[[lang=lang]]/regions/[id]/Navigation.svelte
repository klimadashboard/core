<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	export let sections;
</script>

<div class="sticky top-12 py-4 bg-white dark:bg-gray-950 z-50" id="top">
	<div class="container overflow-auto">
		<div class="flex md:justify-between gap-4">
			{#each sections.filter((d) => d.countries?.includes(PUBLIC_VERSION) && d.navigation !== false) as section}
				<a href="#{section.id}" class="button">
					{@html section.icon}
					<span class="whitespace-nowrap">{section.title}</span></a
				>
			{/each}
		</div>
	</div>
	<div
		class="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-white dark:to-gray-950 pointer-events-none"
	></div>
</div>
