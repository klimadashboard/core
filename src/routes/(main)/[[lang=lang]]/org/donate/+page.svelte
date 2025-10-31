<script lang="ts">
	import { enhance } from '$app/forms';
	import FAQ from './FAQ.svelte';
	import Finance from './Finance.svelte';
	import Projects from './Projects.svelte';
	import { page } from '$app/state';
	import formatNumber from '$lib/stores/formatNumber';

	export let data;
	console.log(data.donationAccount);

	// UI state
	let isSubmitting = false;
	let success = false;
	let error = '';
	let qrCodeUrl = '';

	// Form fields (mirrors; server reads FormData)
	let name = '';
	let email = '';
	let message = '';
	let dob = ''; // "YYYY-MM-DD"

	// Address
	let country = 'AT';
	let state = '';
	let zip = '';
	let city = '';
	let addressLine = '';
	let addressDetails2 = '';

	// Amount
	let amount: number | '' = 50;
	let customAmount: string = '';
	const suggestedAmounts = [25, 50, 100];

	// Bank/QR constants
	const iban = 'AT04 3412 9000 0893 6452';
	const cleanIban = iban.replace(/\s/g, '');
	const receiverName = 'Verein Klimadashboard';
	const bic = 'GENOAT21XXX';
	const bank = 'Raiffeisenbank Gunskirchen';

	function selectSuggestedAmount(val: number) {
		amount = val;
		customAmount = '';
	}

	function handleCustomAmountInput(e: Event) {
		customAmount = (e.target as HTMLInputElement).value;
		const parsed = parseFloat(customAmount);
		if (!isNaN(parsed)) amount = parsed;
		else amount = '';
	}

	function calculateStripeFee(a: number) {
		const fee = Math.round((a * 0.014 + 0.25) * 100) / 100;
		const net = Math.round((a - fee) * 100) / 100;
		return { fee, net };
	}

	function buildEpcQr(amountNum: number, donorName: string) {
		const remittance = `Donation from ${donorName || 'Anonymous'}`;
		const epcData = [
			'BCD',
			'001',
			'1',
			'SCT',
			receiverName,
			cleanIban,
			bic,
			`EUR${amountNum.toFixed(2)}`,
			remittance,
			''
		].join('\n');

		return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
			epcData
		)}&format=svg`;
	}

	// optional: keep your Stripe redirect separate from the form action
	async function payWithStripeRedirect() {
		if (!name || !email || !amount || (amount as number) <= 0) {
			error = 'Bitte fülle alle Pflichtfelder korrekt aus.';
			return;
		}
		isSubmitting = true;
		error = '';
		try {
			const cents = Math.round((amount as number) * 100);
			const res = await fetch('/api/stripe/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amount: cents, name, email, dob, message })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.error || 'Stripe checkout failed.');
			window.location.href = data.url;
		} catch (e: any) {
			error = e?.message || 'Etwas ist schiefgelaufen. Bitte versuche es erneut.';
		} finally {
			isSubmitting = false;
		}
	}

	function cleanURL(url: string) {
		return url.replace(/^https?:\/\//, '');
	}

	$: raisedAmount = data?.donationAccount?.balanceAmount / 100 ?? 0;
	$: goalAmount = 15000;
</script>

<nav
	class="fixed bottom-4 left-1/2 -translate-x-1/2 text-sm font-bold rounded-full px-3 py-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur bg-white shadow-2xl border border-current/20"
>
	{#if page.url.searchParams.get('returnTo')}
		<a href={page.url.searchParams.get('returnTo')} class="">
			zurück zu {cleanURL(page.url.searchParams.get('returnTo'))}</a
		>
	{:else}
		<a href="https://klimadashboard.org" target="_blank">klimadashboard.org</a>
	{/if}
</nav>

<div class="max-w-3xl mx-auto m-1 pt-16">
	<h1 class="text-4xl mb-4 text-balance">
		Deine Spende für
		<em class="not-italic underline underline-offset-4 decoration-green-600">mehr Fakten</em>
		und
		<em class="not-italic underline underline-offset-4 decoration-green-600">mehr Tempo</em>
		in der Klimawende
	</h1>

	<p class="text-lg">[PLATZHALTER]</p>

	<div class="grid grid-cols-3 gap-1 text-lg leading-snug my-8">
		{#if raisedAmount > 0}
			<div class="col-span-3 rounded-2xl overflow-hidden mt-4 bg-green-200 h-10 w-full relative">
				<div
					class="absolute top-0 left-0 bottom-0 bg-green-700 rounded-2xl"
					style="width: {(raisedAmount / goalAmount) * 100}%"
				>
					<div
						class="w-full h-full animate-pulse bg-gray-900 opacity-50 rounded-2xl absolute"
					></div>
					<p class="text-white absolute right-2 text-lg p-1.5">
						<b>{formatNumber(raisedAmount)}€</b> von {formatNumber(goalAmount)}€ gesammelt
					</p>
				</div>
			</div>
		{/if}
		<div class="col-span-2 rounded-2xl bg-[#313B72] text-white p-3">
			<b>Transparenz.</b> [PLATZHALTER]
		</div>
		<div class="row-span-2 rounded-2xl bg-[#EA9010] p-3">
			<b>Projekte.</b> [PLATZHALTER]
		</div>
		<div class="col-span-2 rounded-2xl bg-[#7EE081] p-3">[PLATZHALTER]</div>
	</div>

	{#if success}
		<!-- SHOWN ONLY AFTER the server action returned success -->
		<h2 class="text-3xl mb-2">Danke für deine Spende! 💚</h2>
		<p class="mb-4">Hier sind die Überweisungsdetails und dein QR-Code:</p>

		<div class="flex items-center gap-4 justify-between bg-white shadow-xl border p-4 rounded-2xl">
			<div>
				<div class="font-mono text-sm mt-2">
					<p>{receiverName}</p>
					<p>{iban}</p>
					<p>{bic}</p>
					<p>{bank}</p>
					<p>€{(amount as number).toFixed(2)}</p>
					<p>{name} | {dob}</p>
				</div>
			</div>
			{#if qrCodeUrl}
				<div class="relative">
					<img src={qrCodeUrl} alt="Bank transfer QR code" class="w-24 h-24" />
					<p class="leading-none text-sm text-center w-24 mt-1">Scan mit deiner Banking-App</p>
				</div>
			{/if}
		</div>
	{:else}
		<!-- IMPORTANT:
		     - method="POST"
		     - action="?/donate" (named action in +page.server.ts)
		     - use:enhance takes a FUNCTION, not an object -->
		<form
			method="POST"
			action="?/donate"
			use:enhance={({ form /*, data, action, cancel, submitter, controller */ }) => {
				isSubmitting = true;
				error = '';

				// Return a callback to handle the server response
				return async ({ result, update }) => {
					isSubmitting = false;

					// result is an ActionResult: { type: 'success'|'failure'|'redirect'|'error', data? }
					if (result.type === 'success') {
						const data: any = result.data || {};
						success = true;
						error = '';
						// Build QR using values confirmed by the server
						qrCodeUrl = buildEpcQr(Number(data.amount), data.name);

						// Apply default update (keeps page.form in sync). Prevent auto-reset if you like:
						await update({ reset: false });

						// Sync local fields with server-returned values (optional)
						name = data.name ?? name;
						dob = data.dob ?? dob;
						amount = data.amount ?? amount;
					} else if (result.type === 'failure') {
						// Validation failure from action — you could read result.data for field errors
						const data: any = result.data || {};
						error = data?.error || 'Bitte Eingaben prüfen.';
						await update({ reset: false });
					} else if (result.type === 'error') {
						error = 'Serverfehler. Bitte später erneut versuchen.';
						// No update() needed — SvelteKit will route to error page on full submission,
						// but with enhance we can just keep the UI here.
					}
					// 'redirect' is handled by SvelteKit automatically
				};
			}}
		>
			<!-- Amount -->
			<div class="flex flex-col gap-1">
				<label>Deine Spende</label>
				<div class="grid gap-4 grid-cols-4">
					{#each suggestedAmounts as amt}
						<label class="button">
							<button type="button" on:click={() => selectSuggestedAmount(amt)}>€{amt}</button>
						</label>
					{/each}
					<label>
						<input
							type="number"
							min="1"
							name="amount"
							placeholder="Eigener Betrag (€)"
							bind:value={amount}
							on:input={handleCustomAmountInput}
							required
						/>
					</label>
				</div>
				<input type="hidden" name="customAmount" value={customAmount} />
			</div>

			<!-- Donor info -->
			<div class="grid gap-3 mt-4">
				<div class="flex flex-col gap-1">
					<label for="name">Name</label>
					<input id="name" name="name" type="text" class="input" bind:value={name} required />
				</div>

				<div class="flex flex-col gap-1">
					<label for="email">Email</label>
					<input id="email" name="email" type="email" bind:value={email} class="input" required />
				</div>

				<div class="flex flex-col gap-1">
					<label for="dob">Geburtsdatum</label>
					<input id="dob" name="dob" type="date" bind:value={dob} class="input" required />
					<p class="text-xs opacity-50">Damit wir deine Spende an das Finanzamt melden können.</p>
				</div>

				<!-- Address -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div class="flex flex-col gap-1">
						<label for="addressLine">Straße & Nr.</label>
						<input
							id="addressLine"
							name="addressLine"
							type="text"
							bind:value={addressLine}
							class="input"
							required
						/>
					</div>
					<div class="flex flex-col gap-1">
						<label for="zip">PLZ</label>
						<input id="zip" name="zip" type="text" bind:value={zip} class="input" required />
					</div>
					<div class="flex flex-col gap-1">
						<label for="city">Ort</label>
						<input id="city" name="city" type="text" bind:value={city} class="input" required />
					</div>
					<div class="flex flex-col gap-1">
						<label for="state">Bundesland (optional)</label>
						<input id="state" name="state" type="text" bind:value={state} class="input" />
					</div>
					<div class="flex flex-col gap-1">
						<label for="country">Land</label>
						<input id="country" name="country" type="text" bind:value={country} class="input" />
					</div>
					<div class="flex flex-col gap-1 md:col-span-2">
						<label for="details2">Adresszusatz (optional)</label>
						<input
							id="details2"
							name="details2"
							type="text"
							bind:value={addressDetails2}
							class="input"
						/>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<label for="message">Nachricht (optional)</label>
					<textarea id="message" name="message" rows="3" bind:value={message} class="input"
					></textarea>
				</div>

				<!-- Primary actions -->
				<div class="flex items-center gap-3 mt-2">
					<button type="submit" class="button" disabled={isSubmitting || !amount}>
						{isSubmitting ? 'Wird gesendet …' : 'Spende anlegen'}
					</button>

					{#if amount}
						{@const { fee } = calculateStripeFee(amount as number)}
						<button
							type="button"
							class="button"
							on:click={payWithStripeRedirect}
							disabled={isSubmitting}
						>
							{isSubmitting ? 'Weiter zu Stripe …' : `Oder mit Stripe (Gebühr ~€${fee.toFixed(2)})`}
						</button>
					{/if}
				</div>

				{#if error}
					<p class="text-red-600">{error}</p>
				{/if}
			</div>
		</form>
	{/if}

	<FAQ />
	<Finance />
	<Projects />
</div>

<style>
	@reference "tailwindcss/theme";
	.input {
		@apply rounded-xl border px-3 py-2;
	}
	.button {
		@apply rounded-xl border px-4 py-2 bg-black text-white hover:opacity-90;
	}
	summary {
		@apply font-bold mt-2;
	}
</style>
