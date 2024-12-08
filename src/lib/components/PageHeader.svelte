<script>
	import { page } from '$app/stores';
	import Search from './Search.svelte';
	console.log(page);
</script>

<div class="p-3 bg-gradient-green">
	<p class="border-b">Chart</p>
	<h1 class="text-2xl font-bold">Titel der Seite</h1>
	<p>Beschreibung der Seite</p>

	<Search />

	<div class="text-sm mt-4">
		<div>Open Source</div>
		<div class="flex gap-2">
			<h3>Bekannt aus</h3>
			<p>profil.at</p>
			<p>derstandard.at</p>
			<p>ORF</p>
		</div>
	</div>
</div>
