<script>
	import { page } from '$app/state';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
</script>

<div class="container text-base mb-4 max-h-[calc(100vh-6rem)] overflow-auto">
	<ul class="grid gap-6 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
		{#each page.data.site.translations[0].navigation_primary as c}
			<li class="flex-1 border-b pb-4 border-current/20">
				<h3 class="font-bold">{c.title}</h3>
				<ul>
					{#each c.links as l}
						<li class="leading-tight my-1">
							<a
								href={l.link}
								on:click={() => dispatch('linkClicked')}
								class="hover:underline underline-offset-2">{l.label}</a
							>
						</li>
					{/each}
				</ul>
			</li>
		{/each}
	</ul>
</div>
