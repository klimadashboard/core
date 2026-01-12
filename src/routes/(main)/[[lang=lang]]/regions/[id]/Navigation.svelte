<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	import MapOverlay from './MapOverlay.svelte';
	import { page } from '$app/state';

	let mapOverlayOpen = false;

	function openMap(layerId = null) {
		mapOverlayOpen = true;
		// TODO: set active layer if layerId provided
	}
	export let sections;
</script>

<!-- Fixed navigation at bottom -->
<nav
	class="fixed left-1/2 -translate-x-1/2 bottom-4 z-50 flex items-center text-sm font-medium"
>
	<ul
		class="max-w-[60vw] overflow-scroll no-scrollbar px-2 py-1 rounded-full border border-current/10 bg-white/80 dark:bg-black/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-sm flex items-center"
	>
		{#each sections.filter((d) => d.countries?.includes(PUBLIC_VERSION) && d.navigation !== false) as section}
			<li>
				<a
					href="#{section.id}"
					class="flex gap-1 items-center px-3 py-1 rounded-full transition hover:bg-black hover:text-white dark:hover:text-black dark:hover:bg-white {section.active
						? 'bg-black text-white dark:bg-white dark:text-black'
						: ''}"
				>
					{@html section.icon}
					<span class="whitespace-nowrap">{section.title}</span></a
				>
			</li>
		{/each}
	</ul>
	<button
		class="bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center px-3 py-2 ml-2 gap-1 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-sm"
		on:click={() => openMap()}
		aria-label="Karte öffnen"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="w-4 h-4"
		>
			<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
			<path d="M9 3v15" />
			<path d="M15 6v15" />
		</svg>
		<span>Karte</span>
	</button>
</nav>

<!-- Map Overlay -->
{#if mapOverlayOpen}
	<MapOverlay
		regionId={page.data.page.id}
		regionName={page.data.page.name}
		on:close={() => (mapOverlayOpen = false)}
	/>
{/if}
