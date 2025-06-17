<script>
	import Search from '../Search.svelte';
</script>

<div class="rounded-2xl p-3 border border-current/20 h-full relative">
	<h2 class="font-bold border-b">Regionale Klimadashboards</h2>

	<p class="mt-2 mb-4 text-lg leading-snug text-balance pr-16">
		Wie läuft die Klimawende in deiner Stadt oder Gemeinde?
	</p>

	<div class="mt-auto">
		<Search />
	</div>

	<div
		class="absolute top-3 right-2 w-16 h-16 bg-red-500 rounded-full grid place-items-center rotate-5"
	>
		<span class="text-white font-bold m-auto uppercase text-center leading-none"
			>Jetzt<br />neu!</span
		>
	</div>
</div>
