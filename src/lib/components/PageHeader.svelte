<script>
	import { page } from '$app/stores';
	import Search from './Search.svelte';
	import PopularPages from './PopularPages.svelte';
</script>

<div class="pt-16">
	<div class="container">
		{#if $page.data.content}
			<!--
		<h1 class="font-bold tracking-wide uppercase">{$page.data.content.title}</h1>
		-->

			<h2 class="text-3xl md:text-5xl font-bold max-w-2xl">
				{$page.data.content.heading ? $page.data.content.heading : $page.data.content.title}
			</h2>
		{/if}

		{#if $page.params.slug == ''}
			<div class="mb-4 mt-2 saturate-0">
				<p>
					Science-based. Open. Up-to-date.<br />
					Bekannt aus DER STANDARD, ORF, APA, Stern.de
				</p>
			</div>
		{/if}

		{#if $page.params.slug == ''}
			<Search />
			<PopularPages />
		{/if}
	</div>
</div>
