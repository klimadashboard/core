<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	export let sections;
</script>

<nav class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50" id="top">
	<ul
		class="max-w-[60vw] overflow-scroll no-scrollbar px-2 py-1 rounded-full border border-current/10 bg-white/80 dark:bg-black/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-sm flex items-center"
	>
		{#each sections.filter((d) => d.countries?.includes(PUBLIC_VERSION) && d.navigation !== false) as section}
			<li>
				<a
					href="#{section.id}"
					class="flex gap-1 items-center px-3 py-1 rounded-full text-sm font-medium transition hover:bg-black hover:text-white dark:hover:text-black dark:hover:bg-white {section.active
						? 'bg-black text-white dark:bg-white dark:text-black'
						: ''}"
				>
					{@html section.icon}
					<span class="whitespace-nowrap">{section.title}</span></a
				>
			</li>
		{/each}
	</ul>
</nav>
