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
			const response = await directus.request(readItems('news'));
			return response;
		} catch (err) {
			return [];
		}
	};

	$: promise = getNews();
</script>

<div class="px-4 py-8">
	<h2 class="border-b pb-2 mb-2 font-bold">Medienspiegel</h2>
	{#await promise then news}
		<div class="grid md:grid-cols-3 gap-4">
			{#each news as item}
				<a
					class="bg-white p-4 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition relative"
					href={item.url}
					target="_blank"
				>
					<h3 class="text-lg font-bold leading-tight">{item.title}</h3>
					<p class="text-gray-700">
						{item.source}
						{dayjs().to(dayjs(item.date_published))}
					</p>
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
						class="absolute right-4 top-1/2 -translate-y-1/2"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
							d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6"
						/><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg
					>
				</a>
			{/each}
		</div>
	{:catch error}
		<p>Error fetching news: {error}</p>
	{/await}
</div>
