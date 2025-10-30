<script>
	import dayjs from 'dayjs';
	import { readItems } from '@directus/sdk';
	import getDirectusInstance from '$lib/utils/directus';

	const getData = async () => {
		const directus = getDirectusInstance();

		try {
			const data = await directus.request(
				readItems('org_events', {
					sort: ['-date']
				})
			);

			return data;
		} catch (error) {
			console.error(error);
		}
	};

	$: promise = getData();
</script>

<div class="max-w-3xl mx-auto mt-8 text-lg">
	<h1 class="text-4xl text-center">Events</h1>
	<p class="mt-4 text-center">Triff uns auf Konferenzen, Workshops und Veranstaltungen.</p>
</div>

{#await promise then data}
	<ul class="mt-8">
		{#each data as item}
			<li class="border-t border-current/10 p-4">
				<div class="container {new Date(item.date_end) < new Date() ? 'opacity-80' : ''}">
					<h3 class="text-xl">{item.title}</h3>
					<p>{item.description}</p>

					<p>
						{dayjs(item.date).format('DD.MM.YYYY')}
						{item.date_end == item.date ? '' : ' - ' + dayjs(item.date_end).format('DD.MM.YYYY')}
						| {item.location}
					</p>
				</div>
			</li>
		{/each}
	</ul>
{/await}
