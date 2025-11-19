<script lang="ts">
	import { enhance } from '$app/forms';
	import Projects from './Projects.svelte';
	import DonationStatusBar from '../DonationStatusBar.svelte';
	import { page } from '$app/state';
	import formatNumber from '$lib/stores/formatNumber';
	import getDirectusInstance from '$lib/utils/directus';
	import { tick } from 'svelte';
	import { onMount } from 'svelte';
	import dayjs from 'dayjs';

	export let data;

	// ───────────────────────────────── UI state
	let isSubmitting = false;
	let success = false;
	let isValid = false;
	let error = '';
	let qrCodeUrl = '';

	$: isValid = name && email && dob && zip && city && amount > 19;

	// Result after returning from Stripe Checkout
	type CheckoutStatus = 'idle' | 'success' | 'cancel' | 'error';
	let checkoutStatus: CheckoutStatus = 'idle';
	let stripeSessionId: string | null = null;

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
	$: goalAmount = 20000;

	// put these next to your other state
	let copied: Record<string, boolean> = {};
	let copyingAll = false;

	async function copy(key: string, text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = { ...copied, [key]: true };
			setTimeout(() => (copied = { ...copied, [key]: false }), 1400);
		} catch {
			// noop; optionally show error
		}
	}

	async function copyAll() {
		const remittance = `${name} ${dob}`;
		const block = [
			`Betrag: €${(amount as number).toFixed(2)}`,
			`Empfänger: ${receiverName}`,
			`IBAN: ${cleanIban}`,
			`BIC: ${bic}`,
			`Bank: ${bank}`,
			`Verwendungszweck: ${remittance}`
		].join('\n');
		try {
			await navigator.clipboard.writeText(block);
			copyingAll = true;
			setTimeout(() => (copyingAll = false), 1400);
		} catch {}
	}

	// Load countries from Directus on client if not provided by SSR
	onMount(async () => {
		const status = page.url.searchParams.get('status');
		const sessionId = page.url.searchParams.get('session_id');

		if (status === 'success' && sessionId) {
			checkoutStatus = 'success';
			stripeSessionId = sessionId;
		} else if (status === 'cancel') {
			checkoutStatus = 'cancel';
		}

		// Optional: clean URL
		if (status || sessionId) {
			const url = new URL(window.location.href);
			url.searchParams.delete('status');
			url.searchParams.delete('session_id');
			window.history.replaceState({}, '', url.toString());
		}

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

	// Stripe fees: 1.5% + €0.25 (EU cards)
	function calculateCardTotals(donation: number) {
		const rate = 0.015;
		const fixed = 0.25;

		// Calculate exact fee needed so that net ≈ donation
		const rawFee = (donation + fixed) / (1 - rate) - donation;

		// Fees must be rounded UP to avoid under-collecting
		const fee = Math.ceil(rawFee * 100) / 100;

		const total = Math.round((donation + fee) * 100) / 100;

		// What would arrive if the donor did NOT cover the fees
		const stripeFeeIfNotCovered = Math.round((donation * rate + fixed) * 100) / 100;
		const net = Math.round((donation - stripeFeeIfNotCovered) * 100) / 100;

		return { fee, net, total };
	}

	function buildEpcQr(amountNum: number, donorName: string, donorDob: string) {
		const version = '002'; // 002 oder 003, 002 ist sehr kompatibel
		const charset = '1'; // 1 = UTF-8
		const identification = 'SCT'; // SEPA Credit Transfer
		const purpose = ''; // optional (z. B. "CHAR")
		const reference = ''; // strukturiert (RF...), hier leer
		const remittance = `Spende ${donorName || 'Anonymous'} (${dayjs(donorDob).format('DD.MM.YYYY')})`; // unstrukturiert
		const info = ''; // frei, optional

		const amount = `EUR${amountNum.toFixed(2)}`; // genau zwei Dezimalstellen, Punkt als Dezimaltrenner

		const epcData = [
			'BCD',
			version,
			charset,
			identification,
			bic, // BIC an Position 5 (leer möglich, aber viele Apps in AT/DE mögen ihn)
			receiverName, // 6
			cleanIban, // 7 (ohne Leerzeichen)
			amount, // 8
			purpose, // 9
			reference, // 10 (strukturiert)
			remittance, // 11 (unstrukturiert)
			info // 12
		].join('\n');

		return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=svg&data=${encodeURIComponent(epcData)}`;
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

	<DonationStatusBar />

	<p class="text-lg mt-4">
		Fundierte Klimapolitik braucht klare Fakten. Mit deiner Spende stärkst du den Verein
		Klimadashboard, sicherst unsere Arbeit langfristig, ermöglichst neue Datenvisualisierungen,
		schaffst Jobs und bringst mehr Transparenz in Klimadaten.
	</p>

	<p class="text-lg mt-4">
		In Österreich melden wir deine Spende automatisch ans Finanzamt, denn sie ist von deiner Steuer
		absetzbar. Unsere Einnahmen & Ausgaben <a href="/finance" class="underline underline-offset-2"
			>legen wir transparent offen</a
		>.
	</p>

	{#if checkoutStatus === 'success'}
		<div class="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-green-900">
			<p class="font-semibold">Danke für deine Spende! 💚</p>
			<p class="text-sm mt-1">
				Deine Zahlung über Stripe wurde erfolgreich abgeschlossen. Vielen Dank für deine
				Unterstützung! Wenn du in Österreich ansässig bist, melden wir deine Spende automatisch ans
				Finanzamt. Bei Fragen:
				<a href="mailto:team@klimadashboard.org" class="underline">team@klimadashboard.org</a>.
			</p>
		</div>
	{:else if checkoutStatus === 'cancel'}
		<div class="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
			<p class="font-semibold">Zahlung abgebrochen</p>
			<p class="text-sm mt-1">
				Die Zahlung bei Stripe wurde abgebrochen. Deine Karte wurde dabei nicht belastet. Du kannst
				unten jederzeit einen neuen Spendenversuch starten.
			</p>
		</div>
	{/if}

	{#snippet CopyBtn({ key, text, title = 'Kopieren' })}
		<button
			type="button"
			class="opacity-80 hover:opacity-100 cursor-pointer"
			on:click={() => copy(key, text)}
			aria-label={title}
			{title}
		>
			{#if !copied[key]}
				<!-- copy icon -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="w-5 h-5"
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path
						d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z"
					/>
					<path
						d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1"
					/>
				</svg>
			{:else}
				<!-- copied check icon -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="w-5 h-5"
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path
						d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z"
					/>
					<path
						d="M4.012 16.737a2 2 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1"
					/>
					<path d="M11 14l2 2l4 -4" />
				</svg>
			{/if}
		</button>
	{/snippet}

	{#snippet DetailRow({ label, value, key, text, ddClass = 'font-mono text-sm break-words' })}
		<dt class="text-sm text-black/60 border-b border-current/10 mt-4 first:mt-0">{label}</dt>
		<div class="flex items-center gap-2 mt-2">
			<dd class={ddClass}>{value}</dd>
			{@render CopyBtn({ key, text, title: `${label} kopieren` })}
		</div>
	{/snippet}

	{#if success}
		<h2 class="text-3xl mb-2 pt-10" id="success">Nur noch ein Schritt für deine Spende.</h2>
		<p class="mb-4 text-lg">
			Hier sind alle notwendigen Informationen für deine Banküberweisung. Kopiere sie in deine
			Banking App oder scanne den QR-Code mit deiner Banking-App, um deine Spende zu überweisen.
			Vielen Dank!
		</p>

		<div class="bg-white shadow-2xl border border-current/10 p-4 rounded-2xl max-w-sm mx-auto">
			<!-- Left: details -->
			<div>
				<p class="font-light text-4xl tabular-nums -translate-x-1">
					€{formatNumber((amount as number).toFixed(2))}
				</p>
				<dl class="mt-3">
					{@render DetailRow({
						label: 'Empfänger',
						value: receiverName,
						key: 'empf',
						text: receiverName
					})}

					{@render DetailRow({
						label: 'IBAN',
						value: iban, // display pretty
						key: 'iban',
						text: cleanIban, // copy clean (no spaces)
						ddClass: 'font-mono text-sm break-all'
					})}

					{@render DetailRow({
						label: 'BIC',
						value: bic,
						key: 'bic',
						text: bic,
						ddClass: 'font-mono text-sm break-all'
					})}

					{@render DetailRow({
						label: 'Bank',
						value: bank,
						key: 'bank',
						text: bank
					})}

					{@render DetailRow({
						label: 'Verwendungszweck',
						value: `${name} ${dob}`,
						key: 'vz',
						text: `${name} ${dob}`
					})}
				</dl>

				<div class="flex items-center gap-2 mt-4">
					<button type="button" class="text-sm" on:click={copyAll}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="w-5 h-5 inline"
							><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
								d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z"
							/><path
								d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1"
							/></svg
						>
						{copyingAll ? 'Alles kopiert ✓' : 'Alles kopieren'}
					</button>
				</div>
			</div>

			<!-- Right: QR -->
			{#if qrCodeUrl}
				<div class="flex flex-col items-center">
					<img src={qrCodeUrl} alt="Bank transfer QR code" class="w-32 h-32" />
					<p class="leading-none text-sm text-center mt-2 opacity-70">
						Scan mit deiner Banking-App
					</p>
				</div>
			{/if}
		</div>
	{:else}
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

		<!-- Form -->
		<form
			method="POST"
			action="?/donate"
			use:enhance={({ form }) => {
				isSubmitting = true;
				error = '';
				return async ({ result, update }) => {
					isSubmitting = false;

					if (result.type === 'redirect') {
						// Card path: server told us to go to Stripe Checkout
						window.location.href = result.location;
						return;
					}

					if (result.type === 'success') {
						// Bank path: show bank details + QR
						const data: any = result.data || {};
						success = true;
						error = '';
						qrCodeUrl = buildEpcQr(Number(data.amount), data.name, data.dob);
						await update({ reset: false });
						name = data.name ?? name;
						dob = data.dob ?? dob;
						amount = data.amount ?? amount;

						await tick();
						document
							.getElementById('success')
							?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
						<input
							id="dob"
							name="dob"
							type="date"
							bind:value={dob}
							class="input"
							min="1900-01-01"
							required
						/>
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
				class="fixed left-1/2 -translate-x-1/2 bottom-4 bg-white/90 border border-current/20 backdrop-blur shadow-2xl z-50 rounded-full w-max max-w-[90vw]"
			>
				<div class="flex items-center h-full">
					<div class="px-3 py-1 text-xs sm:text-sm">
						{#if amount}
							{@const donation = amountEUR(amount)}
							{@const fee = paymentMethod === 'card' ? calculateCardTotals(donation).fee : 0}
							{@const total =
								paymentMethod === 'card' ? calculateCardTotals(donation).total : donation}
							<p
								class="tabular-nums leading-tight flex items-center flex-col sm:flex-row text-center"
							>
								€{donation.toFixed(2)} Spende + €{fee.toFixed(2)} Gebühren
								<span class="sm:inline-block h-4 w-[1px] bg-black mx-1 hidden"></span>
								<b> €{total.toFixed(2)} Gesamt</b>
							</p>
						{:else}
							<span>Bitte Betrag wählen</span>
						{/if}
					</div>

					<button
						type="submit"
						class="px-5 py-3 rounded-r-full bg-green-700 text-white font-bold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed leading-tight"
						disabled={isSubmitting || !isValid}
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
