<script lang="ts">
	import { enhance } from '$app/forms';
	import Projects from './Projects.svelte';
	import { page } from '$app/state';
	import formatNumber from '$lib/stores/formatNumber';
	import getDirectusInstance from '$lib/utils/directus';

	export let data;

	// ───────────────────────────────── UI state
	let isSubmitting = false;
	let success = false;
	let isValid = false;
	let error = '';
	let qrCodeUrl = '';

	$: isValid = name && email && dob && zip && city && amount > 19;

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

	// Countries from Directus
	type CountryOption = { id: string; name_de: string };
	let countries: CountryOption[] = data.countries ?? [];

	// Amount (DONATION amount)
	let amount: number | '' = 50;
	let customAmount: string = '';
	const suggestedAmounts = [30, 50, 100, 200];

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

	// Load countries from Directus on client if not provided by SSR
	import { onMount } from 'svelte';
	onMount(async () => {
		try {
			if (!countries?.length) {
				const directus = getDirectusInstance(fetch);
				// Adjust collection name/fields if your table differs
				const res = await directus.request<any[]>(
					// @ts-ignore
					(await import('@directus/sdk')).readItems('countries', {
						fields: ['id', 'name_de'],
						limit: 500,
						sort: ['name_de']
					})
				);
				if (Array.isArray(res)) countries = res as CountryOption[];
			}
			// Ensure current country exists; if not, pick AT or first
			if (!countries.find((c) => c.id === country)) {
				const at = countries.find((c) => c.id === 'AT');
				country = at?.id ?? countries[0]?.id ?? 'AT';
			}
		} catch (e) {
			// Fallback silently; user can still type
			console.error('Failed to load countries from Directus', e);
		}
	});

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
	function calculateCardTotals(donation: number) {
		const fee = Math.round((donation * 0.014 + 0.25) * 100) / 100;
		const net = Math.round((donation - fee) * 100) / 100; // what arrives if fees were NOT extra
		const total = Math.round((donation + fee) * 100) / 100; // donor pays donation+fee when fees are added extra
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
					amount: totalCents, // TOTAL (donation + fee)
					donationAmount: donationCents, // breakdown for metadata/receipts
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
</script>

<div class="max-w-3xl mx-auto p-4">
	<p class="text-sm">
		<a
			href={page.url.searchParams.get('returnTo')
				? page.url.searchParams.get('returnTo')
				: 'https://klimadashboard.org'}
			class="opacity-80 underline hover:opacity-100 underline-offset-2"
		>
			&larr; zurück zu
			{#if page.url.searchParams.get('returnTo')}
				{cleanURL(page.url.searchParams.get('returnTo'))}
			{:else}
				klimadashboard.org
			{/if}
		</a>
	</p>
	<h1 class="text-4xl mb-4 mt-8 text-balance">
		<img src="/logo.svg" class="inline w-8 rounded -translate-y-1" alt="Klimadashboard" />
		Deine Spende für
		<em class="not-italic underline underline-offset-4 decoration-green-600">mehr Fakten</em>
		und
		<em class="not-italic underline underline-offset-4 decoration-green-600">mehr Tempo</em>
		in der Klimawende
	</h1>

	<!-- Progress -->
	{#if raisedAmount > 0}
		<div class="rounded-full overflow-hidden mt-4 bg-gray-100 h-10 w-full relative">
			<div
				class="absolute top-0 left-0 bottom-0 bg-green-600 rounded-full"
				style="width: {(raisedAmount / goalAmount) * 100}%"
			>
				<p class="text-white absolute right-2 text-lg p-1.5">
					<b>{formatNumber(Math.round(raisedAmount))}€</b> von {formatNumber(goalAmount)}€ gesammelt
				</p>
			</div>
		</div>
	{/if}

	<p class="text-lg mt-4">
		Im Jahr 2026 [PLATZHALTER]. Mit deiner Spende hilfst du uns, den Verein Klimadashboard
		langfristig auf ein stabiles Fundament zu stellen, Arbeitsplätze zu schaffen und mehr
		Transparenz in Klimadaten zu bringen.
	</p>

	<p class="text-lg mt-4">
		In Österreich melden wir deine Spende automatisch ans Finanzamt und sie ist von deiner Steuer
		absetzbar. Unsere Einnahmen & Ausgaben <a href="/finance" class="underline underline-offset-2"
			>legen wir transparent offen</a
		>.
	</p>

	<!-- ───────────────── Amount selector -->
	<section class="mt-8">
		<div class="relative w-max mx-auto">
			<p class="text-center uppercase font-bold tracking-wide mb-1">Deine Spende</p>
			<input
				class="block bg-gray-100 rounded-full w-[6ch] pl-10 pr-4 py-1.5 text-left text-5xl font-light"
				type="number"
				min="1"
				max="9999"
				step="1"
				bind:value={amount}
				on:input={handleCustomAmountInput}
			/>
			<span
				class="absolute left-4 bottom-3 text-3xl font-light opacity-50 select-none"
				aria-hidden="true">€</span
			>
		</div>

		<p class="text-base mt-2 text-center">
			{#if amount < 20}
				Damit die Verwaltungskosten im Rahmen bleiben, bitten wir um eine Mindestspende von 20€.
			{:else}
				Danke! Mit {amountEUR(amount)}€ können wir Server & Projekte finanzieren.
			{/if}
		</p>

		<div class="grid gap-1 grid-cols-4 mt-2">
			{#each suggestedAmounts as amt}
				<button
					type="button"
					class="cursor-pointer px-3 py-1.5 rounded-full border hover:bg-gray-50"
					class:selected={amount === amt}
					on:click={() => selectSuggestedAmount(amt)}
				>
					€{amt}
				</button>
			{/each}
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
			<section class="grid md:grid-cols-2 gap-1">
				<label
					class={`rounded-2xl border p-4 cursor-pointer ${paymentMethod === 'bank' ? 'bg-green-600 !text-white border-none' : ''}`}
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
							<p class="font-bold text-xl">Banküberweisung &hearts;</p>
							<ul class="text-sm space-y-1 leading-tight list-disc pl-5 mt-2">
								<li>Du bekommst im Anschluss einen QR-Code bzw. IBAN für die Überweisung.</li>
								<li>100% deiner Spende kommen dem Klimadashboard zu Gute.</li>
							</ul>
						</div>
					</div>
				</label>

				<label
					class={`rounded-2xl border p-4 cursor-pointer ${paymentMethod === 'card' ? 'bg-green-600 !text-white border-none' : ''}`}
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
							<p class="font-bold text-xl">Kreditkarte | Apple Pay | Google Pay</p>
							<ul class="space-y-1 text-sm leading-tight list-disc pl-5 mt-2">
								<li>Sicher und schnell via Stripe.</li>
								{#if amount}
									{@const donation = amountEUR(amount)}
									{@const { fee, total } = calculateCardTotals(donation)}
									<li>
										Zusätzlich zu deiner €{donation.toFixed(2)} Spende werden Gebühren in der Höhe von
										{fee.toFixed(2)}€ fällig.
									</li>
								{/if}
							</ul>
						</div>
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
						<label for="dob">Geburtsdatum</label>
						<input id="dob" name="dob" type="date" bind:value={dob} class="input" required />
					</div>
				</div>

				<div class="grid">
					<div class="flex flex-col gap-1">
						<label for="email">Email</label>
						<input id="email" name="email" type="email" bind:value={email} class="input" required />
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
						<label for="details2">Adresszusatz (optional)</label>
						<input
							id="details2"
							name="details2"
							type="text"
							bind:value={addressDetails2}
							class="input"
						/>
					</div>

					<!-- Country: Select from Directus -->
					<div class="flex flex-col gap-1">
						<label for="country">Land</label>
						<select id="country" name="country" class="input" bind:value={country} required>
							{#if !countries.length}
								<option value="AT">Österreich</option>
							{:else}
								{#each countries as c}
									<option value={c.id}>{c.name_de}</option>
								{/each}
							{/if}
						</select>
					</div>
				</div>

				{#if error}
					<p class="text-red-600">{error}</p>
				{/if}
			</section>

			<!-- Sticky bottom CTA -->
			<div
				class="fixed left-1/2 -translate-x-1/2 bottom-4 bg-white/90 border border-current/20 backdrop-blur shadow-2xl z-50 rounded-full"
			>
				<div class="flex items-center h-full">
					<div class="px-3 py-1 text-sm">
						{#if amount}
							{@const donation = amountEUR(amount)}
							{@const fee = paymentMethod === 'card' ? calculateCardTotals(donation).fee : 0}
							{@const total =
								paymentMethod === 'card' ? calculateCardTotals(donation).total : donation}
							<p class="tabular-nums leading-tight flex items-center">
								€{donation.toFixed(2)} Spende + €{fee.toFixed(2)} Gebühren
								<span class="inline-block h-4 w-[1px] bg-black mx-1"></span>
								<b> €{total.toFixed(2)} Gesamt</b>
							</p>
						{:else}
							<span>Bitte Betrag wählen</span>
						{/if}
					</div>

					<button
						type="button"
						class="px-5 py-3 rounded-r-full bg-green-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={isSubmitting || !isValid}
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
								// ensure ISO alpha-2 is submitted in standard form submit as well
								const hidden = document.querySelector<HTMLInputElement>('input[name="countryIso"]');
								if (!hidden) {
									const el = document.createElement('input');
									el.type = 'hidden';
									el.name = 'countryIso';
									el.value = computeCampaiCountry(country);
									document.querySelector('form')?.appendChild(el);
								} else hidden.value = computeCampaiCountry(country);

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
