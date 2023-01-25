<script>
	import { page } from '$app/stores';
</script>

<div class="container py-16">
	<h1 class="text-4xl mb-4">Entschuldigung, hier gab es einen Fehler.</h1>
	<p>{$page.error.message}</p>
</div>
