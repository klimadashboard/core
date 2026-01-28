<script>
	import Header from '$lib/components/sections/header/index.svelte';
	import Footer from '$lib/components/sections/footer/index.svelte';
	import { page } from '$app/stores';
</script>

<Header />

<main class="py-20 container" style="min-height:60vh;">
	<h1 class="text-4xl mb-4">Entschuldigung! 🚨</h1>
	<p class="text-lg max-w-2xl">
		Diese Seite konnte nicht gefunden werden oder ein Teil dieser Seite ist fehlerhaft. Navigieren
		Sie zu einer anderen Seite oder probieren Sie es später erneut. Falls dieser Fehler bestehen
		bleibt, schreiben Sie uns gern an <a
			href="mailto:team@klimadashboard.org"
			class="underline underline-offset-2">team@klimadashboard.org</a
		>.
	</p>
	<p class="font-mono mt-16">{$page.error.message}</p>
</main>

<Footer />
