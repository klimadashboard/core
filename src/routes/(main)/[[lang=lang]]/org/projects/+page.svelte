<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { Splide, SplideSlide } from '@splidejs/svelte-splide';

	$: getData = async () => {
		const directus = getDirectusInstance();
		const data = await directus.request(
			readItems('org_projects', {
				fields: ['*.*'],
				limit: -1
			})
		);
		return data;
	};

	$: promise = getData();
</script>

<div class="container my-8">
	<h1 class="text-4xl font-bold">Projekte</h1>
	<p class="text-lg">Lorem ipsum dolor sit amet.</p>

	{#await promise then data}
		<h2 class="text-2xl mt-8">Geplante Projekte</h2>
		<Splide options={{ perPage: 3 }}>
			{#each data.filter((d) => d.status !== 'done') as item}
				<SplideSlide>
					<div class="bg-gray-50 p-3 rounded-2xl">{item.title}</div>
				</SplideSlide>
			{/each}
		</Splide>
		<h2 class="text-2xl mt-8">Umgesetzte Projekte</h2>
		<ul>
			{#each data.filter((d) => d.status === 'done') as item}
				<li>{item.title}</li>
			{/each}
		</ul>
	{/await}
</div>
