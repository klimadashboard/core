<script>
	import getDirectusInstance from '$lib/utils/directus';
	import { readItems } from '@directus/sdk';

	$: getData = async () => {
		const directus = getDirectusInstance();
		const data = await directus.request(
			readItems('org_press_media', {
				filter: {
					featured: {
						_eq: true
					}
				},
				limit: 5
			})
		);
		return data;
	};

	$: promise = getData();
</script>

{#await promise then data}
	<ul class="flex justify-between bg-black rounded-2xl p-6">
		{#each data as item}
			<li>
				<img
					src="https://base.klimadashboard.org/assets/{item.logo}"
					alt={item.name}
					class="h-10 bg-black"
				/>
			</li>
		{/each}
	</ul>
{/await}
