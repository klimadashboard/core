<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import dayjs from 'dayjs';
	import RelativeTime from 'dayjs/plugin/relativeTime';
	import { page } from '$app/stores';
	dayjs.extend(RelativeTime);

	async function getNews(langCode) {
		const directus = getDirectusInstance();
		try {
			const response = await directus.request(
				readItems('news', {
					filter: {
						_and: [{ status: { _eq: 'published' } }, { sites: { _icontains: PUBLIC_VERSION } }]
					},
					deep: {
						translations: {
							_filter: {
								languages_code: { _eq: langCode }
							}
						}
					},
					sort: ['-date_created'],
					limit: 3,
					fields: ['*.*']
				})
			);

			return response.map((item) => ({
				...item,
				text: item.translations[0]?.text
			}));
		} catch (err) {
			console.error(err);
			return [];
		}
	}

	// Reactive statement: re-run getNews whenever $page.data.language.code changes.
	$: promise = getNews($page.data.language.code);
</script>

<div class="flex flex-col h-full border border-current/20 rounded-2xl p-3">
	<div class="flex items-center gap-2 border-b text-red-700">
		<div class="pulse"></div>
		<h3 class="font-bold">{$page.data.translations.newsTitle}</h3>
	</div>

	{#await promise then news}
		<ul class="kd_news text-base mb-2">
			{#each news as item}
				<li class="my-2">{@html item.text}</li>
			{/each}
		</ul>

		{#if news[0]?.author}
			<div class="flex flex-wrap items-center gap-2 mt-auto">
				<div class="h-12 w-12 rounded-full bg-gray-400 overflow-hidden relative shrink-0">
					<img
						src="https://base.klimadashboard.org/assets/{news[0].author.avatar}?key=tiny"
						alt=""
						class="absolute w-full h-full object-cover inset-0"
					/>
				</div>
				<div class="leading-tight text-sm">
					<p class="font-bold">
						{$page.data.translations.newsCreatedBy}
						{news[0].author.first_name}
						{news[0].author.last_name}
					</p>
					<p class="opacity-70">Team Klimadashboard</p>
				</div>
			</div>
		{/if}
	{/await}
</div>

<style>
	@reference "tailwindcss/theme";
	:global(.kd_news a) {
		@apply underline decoration-gray-200 underline-offset-2;
	}

	:global(.kd_news a:hover) {
		@apply decoration-gray-800;
	}

	:global(.kd_news li:not(:last-child):after) {
		content: '–';
		@apply block opacity-50 -my-2 translate-y-0.5;
	}
</style>
