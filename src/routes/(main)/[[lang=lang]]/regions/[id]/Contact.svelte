<script lang="ts">
	import getDirectusInstance from '@/lib/utils/directus';
	import { readUsers } from '@directus/sdk';

	function shuffleArray<T>(array: T[]): T[] {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	const getTeamMembers = async () => {
		const directus = getDirectusInstance(fetch);
		const response = await directus.request(readUsers({}));
		response.push({
			first_name: 'David',
			last_name: 'Jablonski',
			avatar: '62dd5e5c-c076-49de-9021-9f09f79f121c'
		});
		return shuffleArray(response);
	};

	let promise = getTeamMembers();
</script>

<div
	class="my-4 container grid md:grid-cols-2 gap-8 items-center justify-between border-y py-4 border-y-current/10"
>
	<div class="">
		{#await promise then team}
			<div class="flex flex-wrap gap-5 md:m-4">
				{#each team as member}
					{#if member.avatar}
						<img
							class="w-20 h-20 object-cover rounded-full"
							style="transform: translate({Math.random() * 5}px, {Math.random() * 5}px);"
							src="https://base.klimadashboard.org/assets/{member.avatar}?key=small"
							alt="{member.first_name} {member.last_name}"
						/>
					{/if}
				{/each}
			</div>
		{/await}
	</div>
	<div class="max-w-2xl text-lg space-y-1 leading-snug">
		<h2 class="text-2xl font-bold">Wir machen Klimawissenschaft zugänglich.</h2>
		<p class=" ">
			Das Klimadashboard wird von einem unabhängigen Verein mit einem interdisziplinären Team
			gebaut. Unsere Mission ist es, Klimawissenschaft für alle zugänglich zu machen.
		</p>
		<p>
			Wie sollen wir das Klimadashboard für deine Region weiterentwickeln? Wir freuen uns auf deine
			Nachricht!
		</p>
		<a
			href="mailto:team@klimadashboard.org"
			target="_blank"
			class="button mt-2 w-max flex items-center gap-1"
		>
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
				class="icon icon-tabler icons-tabler-outline icon-tabler-mail"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z"
				/><path d="M3 7l9 6l9 -6" /></svg
			><span>team@klimadashboard.org</span></a
		>
	</div>
</div>
