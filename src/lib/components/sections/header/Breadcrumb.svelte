<script>
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';

	let breadcrumbs = [];

	const updateBreadcrumbs = () => {
		// Access the current URL from the SvelteKit page store
		const { pathname } = $page.url;

		// Split pathname and filter out empty strings
		const parts = pathname.split('/').filter(Boolean);

		// Generate breadcrumb data
		breadcrumbs = parts.map((part, index) => {
			// Create partial paths for hrefs
			const href = '/' + parts.slice(0, index + 1).join('/');

			// Use $page.data.content.title for the last part if it exists
			const isLastPart = index === parts.length - 1;
			const label =
				isLastPart && $page.data?.content?.title
					? $page.data.content.title
					: decodeURIComponent(part);

			return { label, href };
		});
	};

	// Update breadcrumbs when the component is mounted
	updateBreadcrumbs();

	// Re-run breadcrumb generation on URL changes
	afterNavigate(() => {
		updateBreadcrumbs();
	});
</script>

<div class="hidden sm:block">
	<ol class="flex space-x-2">
		{#each breadcrumbs as crumb, index}
			<li class="flex items-center">
				<span class="opacity-50 mx-2">›</span>
				<a href={crumb.href} class="hover:underline">
					{crumb.label.replace('regions', 'Regionen')}
				</a>
			</li>
		{/each}
	</ol>
</div>

<style>
	/* Add any desired styles here */
</style>
