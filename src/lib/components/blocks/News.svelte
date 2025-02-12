<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import dayjs from 'dayjs';
	import 'dayjs/locale/de-at';
	import RelativeTime from 'dayjs/plugin/relativeTime';

	dayjs.extend(RelativeTime);
	dayjs.locale('de-at');

	$: getNews = async function () {
		const directus = getDirectusInstance();
		try {
			const response = await directus.request(
				readItems('news', {
					filter: {
						_and: [
							{
								status: {
									_eq: 'published'
								}
							},
							{
								sites: {
									_icontains: PUBLIC_VERSION
								}
							}
						]
					},
					sort: ['-date_created'],
					limit: 3,
					fields: ['*.*']
				})
			);
			return response;
		} catch (err) {
			return [];
		}
	};

	$: promise = getNews();
</script>

<div class="flex flex-col h-full border border-current/20 rounded-2xl p-3">
	<div class="flex items-center gap-2 border-b text-red-700">
		<div class="pulse hidden sm:block" />
		<h3 class="font-bold">Was heute wichtig ist</h3>
	</div>

	{#await promise then news}
		<ul class="kd_news text-base">
			{#each news as item}
				<li class="my-2">{@html item.text}</li>
			{/each}
		</ul>

		{#if news[0].author}
			<div class="flex flex-wrap items-center gap-2 mt-auto">
				<div class="h-12 w-12 rounded-full bg-gray-400 overflow-hidden relative shrink-0">
					<img
						src="https://base.klimadashboard.org/assets/{news[0].author.avatar}"
						alt=""
						class="absolute w-full h-full object-cover inset-0"
					/>
				</div>
				<div class="leading-tight text-sm">
					<p class="font-bold">
						Zusammengestellt von {news[0].author.first_name}
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
</style>
