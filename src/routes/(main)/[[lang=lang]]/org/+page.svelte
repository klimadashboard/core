<script>
	import Team from './Team.svelte';
</script>

<div class="container pt-24">
	<h1 class="text-4xl max-w-sm">Wir machen Klimawissenschaft zugänglich. Für alle.</h1>

	<p class="mt-8 text-xl max-w-md">Als Verein bauen wir Datenvisualisierungen, die...</p>
</div>

<div class="container grid grid-cols-3 gap-1 my-8">
	<a
		href="https://klimadashboard.at"
		target="_blank"
		class="rounded-2xl bg-gray-50 dark:bg-gray-900 p-3"
	>
		<h3 class="text-xl">Klimadashboard.at</h3>
	</a>
	<a
		href="https://klimadashboard.de"
		target="_blank"
		class="rounded-2xl bg-gray-50 dark:bg-gray-900 p-3"
	>
		<h3 class="text-xl">Klimadashboard.de</h3>
	</a>
	<a
		href="https://emission-tracker.eu"
		target="_blank"
		class="rounded-2xl bg-gray-50 dark:bg-gray-900 p-3"
	>
		<h3 class="text-xl">EU Emission Tracker</h3>
	</a>
</div>

<Team />

<div class="grid grid-cols-3 container my-10">
	<div>
		<p>Open Data</p>
	</div>
	<div>
		<p>Open Finance</p>
	</div>
	<div>
		<p>Open Source</p>
	</div>
</div>
