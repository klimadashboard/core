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
				readItems('news', { sort: ['-date_published'], limit: 5 })
			);
			return response;
		} catch (err) {
			return [];
		}
	};

	$: promise = getNews();
</script>

<div class="flex flex-col h-full">
	<div class="flex items-center gap-2">
		<div class="pulse" />
		<h3 class="uppercase font-bold tracking-wider text-sm relative">Was heute wichtig ist</h3>
	</div>

	{#await promise then news}
		<ul class="text-lg kd_news">
			{#each news as item}
				<li class="my-2">{@html item.text}</li>
			{/each}
		</ul>

		<div class="flex items-center gap-2 mt-auto">
			<div class="h-12 w-12 rounded-full bg-gray-400" />
			<div class="leading-tight">
				<p class="font-bold">Zusammengestellt von David Jablonski</p>
				<p class="opacity-70">Team Klimadashboard</p>
			</div>
		</div>
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
