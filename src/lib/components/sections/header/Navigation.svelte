<script>
	import { page } from '$app/state';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
</script>

<div class="container text-base mb-4">
	<ul class="flex gap-4 flex-col sm:flex-row justify-between">
		{#each page.data.site.translations[0].navigation_primary as c}
			<li class="flex-1 md:border-r md:last:border-r-0 border-current/20">
				<h3 class="font-bold">{c.title}</h3>
				<ul>
					{#each c.links as l}
						<li>
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
