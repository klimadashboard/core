<script lang="ts">
	export let data;

	const member = data.member;
	const authoredPages: any[] = data.authoredPages ?? [];

	function pageUrl(page: any): string {
		const domain = page.site?.domain;
		const tr = page.translations?.[0];
		if (!domain || !tr?.slug) return '#';
		return `https://${domain}/${tr.slug}`;
	}

	function pageTitle(page: any): string {
		return page.translations?.[0]?.title ?? page.translations?.[0]?.heading ?? '';
	}

	function siteName(page: any): string {
		return page.site?.domain ?? '';
	}
</script>

<svelte:head>
	<title>{member.first_name} {member.last_name} – Klimadashboard</title>
</svelte:head>

<div class="min-h-screen bg-white dark:bg-gray-950 dark:text-white">
	<!-- Profile header -->
	<div class="max-w-2xl mx-auto px-4 py-8 text-center">
		{#if member.avatar}
			<img
				src="https://base.klimadashboard.org/assets/{member.avatar}?key=medium"
				alt="{member.first_name} {member.last_name}"
				class="w-36 h-36 rounded-full object-cover mx-auto ring-4 ring-current/10"
			/>
		{:else}
			<div
				class="w-36 h-36 rounded-full mx-auto bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold opacity-40"
			>
				{(member.first_name ?? '?')[0]}{(member.last_name ?? '')[0]}
			</div>
		{/if}

		<div class="mt-5">
			{#if member.title}
				<p class="text-xs font-bold uppercase tracking-widest opacity-50">{member.title}</p>
			{/if}
			<h1 class="text-3xl font-bold mt-1">{member.first_name} {member.last_name}</h1>
		</div>

		{#if member.description}
			<p class="mt-6 leading-relaxed opacity-70 max-w-lg mx-auto">{member.description}</p>
		{/if}
	</div>

	<!-- Authored pages -->
	{#if authoredPages.length}
		<div class="max-w-2xl mx-auto px-4 pb-16">
			<h2 class="font-bold mb-3 opacity-60 uppercase tracking-widest text-sm">Projekte</h2>
			<div class="grid gap-2 sm:grid-cols-2">
				{#each authoredPages as page}
					<a
						href={pageUrl(page)}
						target="_blank"
						rel="noopener noreferrer"
						class="group flex flex-col rounded-xl border border-current/10 bg-current/5 p-4 hover:bg-current/10 transition"
					>
						<h3 class="font-semibold leading-tight group-hover:underline">{pageTitle(page)}</h3>
						<p class="mt-1.5 text-xs opacity-40">{siteName(page)}</p>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</div>
