<script>
	let email = '';
	let submitted = false;
	let error = '';

	async function handleSubmit() {
		error = '';
		if (!email || !email.includes('@')) {
			error = 'Bitte gib eine gültige E-Mail-Adresse ein.';
			return;
		}

		try {
			const response = await fetch('https://YOUR-DIRECTUS-URL/items/donations_notifications', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer YOUR-DIRECTUS-ACCESS-TOKEN'
				},
				body: JSON.stringify({ email })
			});

			if (!response.ok) {
				throw new Error('Fehler beim Absenden');
			}

			email = '';
			submitted = true;
		} catch (err) {
			error = err.message;
		}
	}
</script>

<div class="container py-10">
	<h1 class="text-4xl font-bold">Spendenabsetzbarkeit</h1>
	<p class="mt-4">
		Gib hier deine E-Mail Adresse ein und wir melden uns bei dir, sobald Spenden an uns steuerlich
		absetzbar sind.
	</p>

	{#if submitted}
		<p class="mt-4 text-green-600">Vielen Dank! Wir melden uns bei dir.</p>
	{:else}
		<form class="mt-4 space-y-2" on:submit|preventDefault={handleSubmit}>
			<input
				type="email"
				bind:value={email}
				class="border p-2 rounded w-full max-w-md"
				placeholder="E-Mail-Adresse"
				required
			/>
			<button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
				Benachrichtigen
			</button>
			{#if error}
				<p class="text-red-600">{error}</p>
			{/if}
		</form>
	{/if}
</div>
