<script>
	import { page } from '$app/stores';
	import Search from './Search.svelte';
	import PopularPages from './PopularPages.svelte';

	$: tags = $page.data.content.tags || [];
</script>

<div class="m-1 py-8 rounded-2xl">
	<div class="container">
		{#if $page.data.content}
			<!--
		<h1 class="font-bold tracking-wide uppercase">{$page.data.content.title}</h1>
		-->

			<h2 class="text-3xl md:text-5xl font-bold max-w-2xl">
				{$page.data.content.heading ? $page.data.content.heading : $page.data.content.title}
			</h2>
		{/if}

		<div class="opacity-80 mt-4 sm:text-lg leading-tight">
			{#if true == true}
				<p>Zuletzt aktualisiert am XX.XX.2024.</p>
				<p>
					{#each tags as tag}
						{tag}
					{/each}
				</p>
			{/if}

			{#if $page.params.slug == ''}
				<div class="mb-4 mt-2 saturate-0">
					<p>
						Science-based. Open. Up-to-date.<br />
						Bekannt aus DER STANDARD, ORF, APA, Stern.de
					</p>
				</div>
			{/if}
		</div>

		{#if $page.params.slug == ''}
			<Search />
			<PopularPages />
		{/if}
	</div>
</div>
