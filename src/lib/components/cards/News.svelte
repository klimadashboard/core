<script>
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
						status: {
							_eq: 'published'
						}
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

<div class="flex flex-col h-full">
	<div class="h-[1px] bg-gray-200" />
	<div class="h-[1px] mt-1 bg-gray-200" />
	<div class="h-[1px] mt-1 bg-gray-200" />
	<div class="flex items-center gap-2 mt-4">
		<div class="pulse" />
		<h3 class="uppercase font-bold tracking-wider text-sm relative">Was heute wichtig ist</h3>
	</div>

	{#await promise then news}
		<ul class="kd_news font-sans">
			{#each news as item}
				<li class="my-2">{@html item.text}</li>
			{/each}
		</ul>

		{#if news[0].author}
			<div class="flex items-center gap-2 mt-auto">
				<div class="h-16 w-16 rounded-full bg-gray-400 overflow-hidden relative">
					<img
						src="https://base.klimadashboard.org/assets/{news[0].author.avatar}"
						alt=""
						class="absolute w-full h-full object-cover inset-0"
					/>
				</div>
				<div class="leading-tight">
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
	:global(.kd_news a) {
		@apply underline decoration-gray-200 underline-offset-2;
	}

	:global(.kd_news a:hover) {
		@apply decoration-gray-800;
	}
</style>
