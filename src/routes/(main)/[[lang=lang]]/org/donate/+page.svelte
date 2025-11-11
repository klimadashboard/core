<script lang="ts">
	import { enhance } from '$app/forms';
	import FAQ from './FAQ.svelte';
	import Finance from './Finance.svelte';
	import Projects from './Projects.svelte';
	import { page } from '$app/state';
	import formatNumber from '$lib/stores/formatNumber';

	export let data;

	// ───────────────────────────────── UI state
	let isSubmitting = false;
	let success = false;
	let error = '';
	let qrCodeUrl = '';

	// Form fields
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

	// Amount (DONATION amount)
	let amount: number | '' = 50;
	let customAmount: string = '';
	const suggestedAmounts = [25, 50, 100];

	// Payment method
	type PaymentMethod = 'bank' | 'card';
	let paymentMethod: PaymentMethod = 'bank';

	// Bank/QR constants
	const iban = 'AT04 3412 9000 0893 6452';
	const cleanIban = iban.replace(/\s/g, '');
	const receiverName = 'Verein Klimadashboard';
	const bic = 'GENOAT21XXX';
	const bank = 'Raiffeisenbank Gunskirchen';

	// Progress
	$: raisedAmount = data?.donationAccount?.balanceAmount / 100 ?? 0;
	$: goalAmount = 15000;

	// Helpers
	function selectSuggestedAmount(val: number) {
		amount = val;
		customAmount = String(val);
	}
	function handleCustomAmountInput(e: Event) {
		customAmount = (e.target as HTMLInputElement).value;
		const parsed = parseFloat(customAmount);
		if (!isNaN(parsed)) amount = parsed;
		else amount = '';
	}
	function amountEUR(a: number | ''): number {
		return typeof a === 'number' ? Math.max(0, a) : 0;
	}

	// Stripe fees: ~1.4% + €0.25 (EU cards)
	// We keep the previous logic but also compute TOTAL = donation + fee
	function calculateCardTotals(donation: number) {
		const fee = Math.round((donation * 0.014 + 0.25) * 100) / 100;
		const net = Math.round((donation - fee) * 100) / 100; // what arrives if fees were NOT extra
		const total = Math.round((donation + fee) * 100) / 100; // what the donor pays when fees are added extra
		return { fee, net, total };
	}

	function buildEpcQr(amountNum: number, donorName: string) {
		// IMPORTANT: QR uses the DONATION amount only (no fees)
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
		return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(epcData)}&format=svg`;
	}

	// Card/Apple Pay redirect — charges DONATION + FEES (fees are extra)
	async function payWithStripeRedirect() {
		if (
			!name ||
			!email ||
			!amount ||
			(amount as number) <= 0 ||
			!zip ||
			!city ||
			!addressLine ||
			!dob
		) {
			error = 'Bitte fülle alle Pflichtfelder korrekt aus.';
			return;
		}
		isSubmitting = true;
		error = '';
		try {
			const donation = amountEUR(amount);
			const { fee, total } = calculateCardTotals(donation);
			const donationCents = Math.round(donation * 100);
			const feeCents = Math.round(fee * 100);
			const totalCents = Math.round(total * 100);

			const res = await fetch('/api/stripe/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					// Charge the TOTAL (donation + fee)
					amount: totalCents,
					// Also pass explicit breakdown for your session/metadata/receipt
					donationAmount: donationCents,
					feeAmount: feeCents,
					feesAddedExtra: true,
					name,
					email,
					dob,
					message,
					addressLine,
					zip,
					city,
					state,
					country
				})
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

	// Amount feedback tiers
	const impact = [
		{ min: 5, label: 'Deckt einen Tag Serverkosten' },
		{ min: 20, label: 'Finanziert Datenrecherchen & Aktualisierungen' },
		{ min: 50, label: 'Ermöglicht einen Workshop mit jungen Menschen' },
		{ min: 100, label: 'Finanziert eine neue Visualisierung' },
		{ min: 250, label: 'Finanziert ein kleines Feature/Datensatz' },
		{ min: 500, label: 'Beschleunigt ein größeres Projekt' }
	];
	$: currentImpact = (() => {
		const a = amountEUR(amount);
		let last = impact[0].label;
		for (const i of impact) if (a >= i.min) last = i.label;
		return last;
	})();
</script>

<div class="max-w-3xl mx-auto p-4 pt-16">
	<h1 class="text-4xl mb-4 text-balance">
		<img src="/logo.svg" class="inline w-8 rounded -translate-y-1" alt="Klimadashboard" />
		Deine Spende für
		<em class="not-italic underline underline-offset-4 decoration-green-600">mehr Fakten</em>
		und
		<em class="not-italic underline underline-offset-4 decoration-green-600">mehr Tempo</em>
		in der Klimawende
	</h1>

	<p class="text-lg">[PLATZHALTER]</p>

	<!-- Progress -->
	{#if raisedAmount > 0}
		<div class="rounded-2xl overflow-hidden mt-4 bg-green-200 h-10 w-full relative">
			<div
				class="absolute top-0 left-0 bottom-0 bg-green-700 rounded-2xl"
				style="width: {(raisedAmount / goalAmount) * 100}%"
			>
				<div class="w-full h-full animate-pulse bg-gray-900 opacity-50 rounded-2xl absolute"></div>
				<p class="text-white absolute right-2 text-lg p-1.5">
					<b>{formatNumber(raisedAmount)}€</b> von {formatNumber(goalAmount)}€ gesammelt
				</p>
			</div>
		</div>
	{/if}

	<!-- ───────────────── Amount selector -->
	<section class="mt-6 p-4 rounded-2xl border bg-white shadow-sm">
		<h2 class="text-xl font-bold mb-2">Wähle deinen Betrag</h2>

		<div class="grid gap-3">
			<div class="flex items-center gap-3">
				<input
					type="range"
					min="5"
					max="500"
					step="5"
					class="w-full accent-green-700"
					bind:value={amount}
					on:input={() => (customAmount = String(amount))}
				/>
				<div class="w-28">
					<input
						class="input w-full text-right"
						type="number"
						min="1"
						step="1"
						bind:value={customAmount}
						on:input={handleCustomAmountInput}
						placeholder="€"
					/>
				</div>
			</div>

			<div class="flex gap-2">
				{#each suggestedAmounts as amt}
					<button
						type="button"
						class="px-3 py-1.5 rounded-full border hover:bg-gray-50"
						class:selected={amount === amt}
						on:click={() => selectSuggestedAmount(amt)}
					>
						€{amt}
					</button>
				{/each}
				<button
					type="button"
					class="px-3 py-1.5 rounded-full border hover:bg-gray-50"
					on:click={() => selectSuggestedAmount(150)}
				>
					€150
				</button>
			</div>

			<!-- Impact feedback -->
			<div class="text-sm text-gray-700 flex items-center gap-2">
				<span class="inline-flex w-2.5 h-2.5 rounded-full bg-green-600"></span>
				<span>{currentImpact}</span>
			</div>
		</div>
	</section>

	{#if success}
		<!-- Success: bank details + QR (DONATION only) -->
		<h2 class="text-3xl mb-2 mt-6">Danke für deine Spende! 💚</h2>
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
		<!-- Form -->
		<form
			method="POST"
			action="?/donate"
			use:enhance={({ form }) => {
				isSubmitting = true;
				error = '';
				return async ({ result, update }) => {
					isSubmitting = false;
					if (result.type === 'success') {
						const data: any = result.data || {};
						success = true;
						error = '';
						// QR uses DONATION only
						qrCodeUrl = buildEpcQr(Number(data.amount), data.name);
						await update({ reset: false });
						name = data.name ?? name;
						dob = data.dob ?? dob;
						amount = data.amount ?? amount;
					} else if (result.type === 'failure') {
						const data: any = result.data || {};
						error = data?.error || 'Bitte Eingaben prüfen.';
						await update({ reset: false });
					} else if (result.type === 'error') {
						error = 'Serverfehler. Bitte später erneut versuchen.';
					}
				};
			}}
			class="mt-6"
		>
			<!-- Hidden canonical amount field kept in sync (DONATION only) -->
			<input type="hidden" name="amount" value={amountEUR(amount)} />

			<!-- Payment method switcher -->
			<section class="grid md:grid-cols-2 gap-3">
				<label
					class={`rounded-2xl border p-4 cursor-pointer ${paymentMethod === 'bank' ? 'ring-2 ring-green-600' : ''}`}
				>
					<input
						type="radio"
						name="paymentMethod"
						value="bank"
						class="hidden"
						bind:group={paymentMethod}
					/>
					<div class="flex items-center justify-between">
						<div>
							<p class="font-bold">Banküberweisung (empfohlen)</p>
							<p class="text-sm text-gray-600">Keine Gebühren • SEPA / Online-Banking</p>
						</div>
						<div class="text-right text-sm">
							<p>Spende: <b>€{amountEUR(amount).toFixed(2)}</b></p>
							<p>Gebühren: <b>€0.00</b></p>
							<p class="text-xs text-gray-600">Gesamt: <b>€{amountEUR(amount).toFixed(2)}</b></p>
						</div>
					</div>
				</label>

				<label
					class={`rounded-2xl border p-4 cursor-pointer ${paymentMethod === 'card' ? 'ring-2 ring-green-600' : ''}`}
				>
					<input
						type="radio"
						name="paymentMethod"
						value="card"
						class="hidden"
						bind:group={paymentMethod}
					/>
					<div class="flex items-center justify-between">
						<div>
							<p class="font-bold">Kreditkarte / Apple Pay</p>
							<p class="text-sm text-gray-600">Sicher via Stripe</p>
						</div>
						{#if amount}
							{@const donation = amountEUR(amount)}
							{@const { fee, total } = calculateCardTotals(donation)}
							<div class="text-right text-sm">
								<p>Spende: <b>€{donation.toFixed(2)}</b></p>
								<p>Gebühren: <b>€{fee.toFixed(2)}</b></p>
								<p class="text-xs text-gray-600">Gesamt: <b>€{total.toFixed(2)}</b></p>
							</div>
						{:else}
							<div class="text-right text-sm">
								<p>Spende: –</p>
								<p>Gebühren: –</p>
								<p class="text-xs text-gray-600">Gesamt: –</p>
							</div>
						{/if}
					</div>
				</label>
			</section>

			<!-- Donor info -->
			<section class="grid gap-3 mt-6">
				<div class="grid md:grid-cols-2 gap-3">
					<div class="flex flex-col gap-1">
						<label for="name">Name</label>
						<input id="name" name="name" type="text" class="input" bind:value={name} required />
					</div>
					<div class="flex flex-col gap-1">
						<label for="email">Email</label>
						<input id="email" name="email" type="email" bind:value={email} class="input" required />
					</div>
				</div>

				<div class="grid md:grid-cols-2 gap-3">
					<div class="flex flex-col gap-1">
						<label for="dob">Geburtsdatum</label>
						<input id="dob" name="dob" type="date" bind:value={dob} class="input" required />
						<p class="text-xs opacity-60">Für die automatische Meldung ans Finanzamt (AT).</p>
					</div>
					<div class="flex flex-col gap-1">
						<label for="message">Nachricht (optional)</label>
						<input id="message" name="message" type="text" bind:value={message} class="input" />
					</div>
				</div>

				<!-- Address -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div class="flex flex-col gap-1 md:col-span-2">
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
					<div class="flex flex-col gap-1 md:grid-cols-2 md:col-span-2">
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

				{#if error}
					<p class="text-red-600">{error}</p>
				{/if}
			</section>

			<!-- Sticky bottom CTA -->
			<!-- spacer so CTA doesn’t overlap content -->
			<div
				class="fixed left-1/2 -translate-x-1/2 bottom-4 bg-white/90 border border-current/20 backdrop-blur shadow-2xl z-50 rounded-full"
			>
				<div class="flex items-center gap-3">
					{#if page.url.searchParams.get('returnTo')}
						<a href={page.url.searchParams.get('returnTo')}
							>zurück zu {cleanURL(page.url.searchParams.get('returnTo'))}</a
						>
					{:else}
						<a href="https://klimadashboard.org" target="_blank">klimadashboard.org</a>
					{/if}
					<div class="flex-1 text-sm">
						{#if amount}
							{@const donation = amountEUR(amount)}
							{#if paymentMethod === 'card'}
								{@const { fee, total } = calculateCardTotals(donation)}
								<span>
									<b>Spende: €{donation.toFixed(2)}</b>
									• Gebühren: €{fee.toFixed(2)}
									• Gesamt: <b>€{total.toFixed(2)}</b>
								</span>
							{:else}
								<span>
									<b>Spende: €{donation.toFixed(2)}</b>
									• Gebühren: €0.00 • Gesamt: <b>€{donation.toFixed(2)}</b>
								</span>
							{/if}
						{:else}
							<span>Bitte Betrag wählen</span>
						{/if}
					</div>

					<button
						type="button"
						class="px-5 py-3 rounded-r-full bg-green-700 text-white font-bold disabled:opacity-50"
						disabled={isSubmitting || !amount}
						on:click={async () => {
							error = '';
							const donation = amountEUR(amount);
							if (paymentMethod === 'card') {
								await payWithStripeRedirect(); // charges donation + fee
							} else {
								// Banküberweisung: submit to server action (DONATION only)
								if (!name || !email || !dob || donation <= 0 || !zip || !city || !addressLine) {
									error = 'Bitte fülle alle Pflichtfelder korrekt aus.';
									return;
								}
								isSubmitting = true;
								const form = document.querySelector('form');
								form?.requestSubmit();
							}
						}}
					>
						{isSubmitting
							? 'Wird gesendet …'
							: paymentMethod === 'card'
								? 'Jetzt spenden (Karte / Apple Pay)'
								: 'Jetzt spenden (Überweisung)'}
					</button>
				</div>
			</div>
		</form>
	{/if}

	<!-- Info blocks -->
	<div class="text-lg my-16">
		<h3 class="font-bold">Kann ich meine Spende von der Steuer absetzen?</h3>
		<p>
			In Österreich ja. Deine Spende wird mit deinem Name & Geburtsdatum ans Finanzamt gemeldet und
			automatisch in deiner Steuererklärung berücksichtigt. In Deutschland ist unser Verein aktuell
			noch nicht gemeinnützig und Spenden daher nicht absetzungsfähig.
		</p>

		<h3 class="font-bold mt-4">
			Wofür gibt der Verein Klimadashboard Geld aus und wie finanziert er sich?
		</h3>

		<p>
			Auf unserer <a
				href="/finance"
				class="font-bold underline underline-offset-3 decoration-[#EA9010]">Open Finance</a
			>
			Seite bekommst du einen detaillierten Blick in unsere Einnahmen und Ausgaben.
		</p>

		<h3 class="font-bold mt-4">Wofür wird mein Geld verwendet?</h3>
		<p>Mit deiner Spende hilfst du uns, u. a. folgende Projekte umzusetzen und zu beschleunigen:</p>
		<Projects />

		<p class="mt-4">
			Interesse, mit einer größeren Spende gleich ein ganzes Projekt zu finanzieren? Schreib uns
			gern an <a href="mailto:team@klimadashboard.org" class="underline">team@klimadashboard.org</a
			>.
		</p>

		<h3 class="font-bold mt-4">Bekomme ich eine Spendenbescheinigung?</h3>
		<p>
			Ja, du erhältst von uns automatisch eine Spendenbescheinigung, sobald die Spende bei uns
			verbucht wurde.
		</p>

		<p class="mt-4 opacity-70">&hearts; Danke für deine Unterstützung.</p>
	</div>
</div>

<style>
	@reference "tailwindcss/theme";
	.input {
		@apply rounded-xl bg-gray-100 border-current/5 px-3 py-2;
	}
	label {
		@apply text-sm font-semibold uppercase tracking-wide text-current/80;
	}
	.button {
		@apply rounded-full;
	}
	summary {
		@apply font-bold mt-2;
	}
	:global(button.selected) {
		@apply bg-green-600 text-white;
	}
</style>
