<script>
	import PageHeader from '$lib/components/PageHeader.svelte';
	import dayjs from 'dayjs';
	export let data;
	console.log(data);
</script>

<PageHeader />

<div class="container my-4">
	<div>Filter einfügen</div>
	<div>Thema: Finanzen / Emissionen / Energie / Biodiversität</div>
	<div>Quelle: Regierungsprogramm 2025-30 / Klimarat der Bürger:innen 2022</div>
</div>

<div class="grid gap-1 grid-cols-2 lg:grid-cols-4 my-8 p-1">
	{#each data.policies as policy}
		<a href={`/policies/${policy.id}`} class="p-3 bg-current/5 rounded-2xl">
			<h3 class="font-bold text-xl">
				{policy.translations[0].title}
				<span class="rounded-full px-3 py-1 bg-blue-500">{policy.status}</span>
			</h3>

			<p class="text-sm opacity-80 mt-2">
				Letzte Aktualisierung: {dayjs(policy.date_updated).format('D.M.YYYY')}
			</p>
		</a>
	{/each}
</div>
