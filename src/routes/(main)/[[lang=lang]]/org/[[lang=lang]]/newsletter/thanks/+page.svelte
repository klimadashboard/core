<script>
	import { page } from '$app/state';

	$: isEn = page.data.language?.code === 'en';
</script>

<div class="container p-4 py-16">
	<h1 class="text-4xl mb-4 text-balance">
		{isEn ? 'You’re confirmed!' : 'Deine Adresse ist bestätigt!'}
	</h1>

	<p class="text-lg mt-1">
		{isEn
			? 'You will now receive our newsletter.'
			: 'Du erhältst ab sofort unseren Newsletter. Danke für deine Anmeldung!'}
	</p>
	<p class="mt-6">
		<a href="/" class="underline underline-offset-2 hover:no-underline">
			{isEn ? 'Back to homepage' : 'Zurück zur Startseite'}
		</a>
	</p>
</div>
