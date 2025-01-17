<script>
	import { page } from '$app/stores';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
</script>

<div class="container">
	<ul class="flex gap-4 flex-col sm:flex-row justify-between">
		{#each $page.data.site.navigation_primary as c}
			<li class="flex-1 border-r last:border-r-0">
				<h3 class="font-bold">{c.title}</h3>
				<ul>
					{#each c.links as l}
						<li>
							<a href={l.link} on:click={() => dispatch('linkClicked')}>{l.label}</a>
						</li>
					{/each}
				</ul>
			</li>
		{/each}
	</ul>
</div>
