<script lang="ts">
	import getDirectusInstance from '$lib/utils/directus';
	import { readUsers } from '@directus/sdk';

	let team;

	const getTeam = async () => {
		const directus = getDirectusInstance(fetch);
		const response = await directus.request(
			readUsers({
				filter: {}
			})
		);
		console.log(response);
		return response;
	};

	let promise = getTeam();
</script>

{#await promise then team}
	<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-1">
		{#each team as member}
			<div class="w-full min-h-[20em] bg-gray-800 relative rounded-2xl overflow-hidden">
				{#if member.avatar}
					<img
						class="absolute inset-0 w-full h-full object-cover"
						src="https://base.klimadashboard.org/assets/{member.avatar}?key=small"
						alt=""
					/>
				{/if}

				<div
					class="bg-gradient-to-b from-transparent to-black/50 absolute bottom-0 left-0 right-0 h-1/2"
				>
					<p class="absolute bottom-0 text-white text-xl p-3 leading-tight">
						{member.first_name}
						{member.last_name}
					</p>
				</div>
			</div>
		{/each}
	</div>
{/await}
