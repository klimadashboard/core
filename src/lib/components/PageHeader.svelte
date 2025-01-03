<script>
	import { page } from '$app/stores';
	import Search from './Search.svelte';
	import PopularPages from './PopularPages.svelte';
</script>

<div class="pt-24 g-1 lg:grid grid-cols-4">
	<div />
	<div class="col-span-2 px-4">
		<h1 />

		<h2 class="text-3xl font-bold">Daten und Fakten zur Klimakrise in Österreich</h2>
		<p>Beschreibung der Seite</p>

		{#if $page.params.slug == ''}
			<Search />
			<PopularPages />
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
	<div />
</div>
