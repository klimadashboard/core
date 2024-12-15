<script>
	import { page } from '$app/stores';
	import Search from './Search.svelte';
	console.log(page);
</script>

<div class="g-1 py-8">
	<div class="container">
		{#if $page.url.pathname.includes('region')}
			<p class="border-b border-b-white pb-2 mb-2 uppercase font-bold tracking-wide text-sm">
				Region
			</p>
		{:else if $page.url.pathname.includes('chart')}
			<p class="border-b border-b-white pb-2 mb-2 uppercase font-bold tracking-wide text-sm">
				Chart
			</p>
		{/if}

		<h1 class="text-4xl font-bold">Titel der Seite</h1>
		<p>Beschreibung der Seite</p>

		{#if $page.params.slug == ''}
			<Search />
		{/if}

		<div class="text-sm mt-4">
			<div class="flex items-center gap-1 opacity-80">
				<img class="w-16" src="/icons/general/by.svg" alt="Creative Commons" />
				<p>Alle Grafiken frei verwendbar.</p>
			</div>
			<div class="flex gap-2">
				<h3>Bekannt aus</h3>
				<p>profil.at</p>
				<p>derstandard.at</p>
				<p>ORF</p>
			</div>
		</div>
	</div>
</div>
