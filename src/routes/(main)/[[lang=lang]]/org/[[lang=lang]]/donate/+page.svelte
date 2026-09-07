<script lang="ts">
	import { browser } from '$app/environment';
	import Projects from './Projects.svelte';
	import Checkout from './Checkout.svelte';
	import PaymentMethods from '$lib/components/PaymentMethods.svelte';
	import { IconLock } from '@tabler/icons-svelte-runes';
	import { page } from '$app/state';
	import getDirectusInstance from '$lib/utils/directus';
	import { calculateCardFee, MIN_DONATION_EUR } from '$lib/utils/donationFee';
	import { onMount } from 'svelte';
	import { getStripe } from '$lib/stripe-client';

	export let data;

	// ───────────────────────────────── UI state
	let error = '';

	// Instant checkout: a PaymentIntent is created automatically (debounced) once the
	// required fields are filled in — no extra "continue" step. The "Jetzt spenden"
	// button is always visible; it's just disabled/grey until that's ready, and the
	// Express Checkout (Apple Pay / Google Pay / Link) buttons load in additionally
	// once the real Checkout mounts.
	let clientSecret: string | null = null;
	let creatingIntent = false;
	let cardSuccess = false;
	let lastIntentFingerprint = '';
	let lastChargeFingerprint = '';
	let intentTimer: ReturnType<typeof setTimeout>;

	// Recurring donations (Stripe Subscriptions, monthly only) — same amounts as
	// one-time, managed afterwards via Stripe's own Customer Portal.
	type Frequency = 'onetime' | 'recurring';
	let frequency: Frequency = 'onetime';
	let portalUrl: string | null = null;

	$: isValid =
		name &&
		email &&
		amount >= MIN_DONATION_EUR &&
		(country !== 'AT' || birthdate) &&
		(country === 'AT' || !wantsReceipt || (birthdate && addressLine && zip && city));

	// Result after returning from a redirect-based payment method (rare — most
	// wallets/cards confirm inline without ever leaving the page).
	type CheckoutStatus = 'idle' | 'success' | 'processing' | 'error';
	let checkoutStatus: CheckoutStatus = 'idle';
	$: done = checkoutStatus === 'success' || cardSuccess;

	// Form fields
	let name = '';
	let email = '';
	let birthdate = ''; // "YYYY-MM-DD" — required for AT (tax reporting) or an opted-in receipt

	// Country drives the tax-deductibility messaging + which fields are needed.
	let country = 'AT';
	let wantsReceipt = false; // only relevant/shown when country !== 'AT'
	let state = '';
	let zip = '';
	let city = '';
	let addressLine = '';
	let details2 = '';
	let coverFee = false;
	let newsletter = false; // optional, opt-in — the only genuine consent on this form

	// Countries from Directus
	type CountryOption = { id: string; name_de: string };
	let countries: CountryOption[] = data.countries ?? [];

	// Amount (DONATION amount, excludes any covered fee). `customAmount` is kept
	// separate so the free-text field stays empty while a preset is selected,
	// rather than echoing the preset back at the donor.
	let amount: number | '' = 50;
	let customAmount = '';
	const suggestedAmounts = [30, 50, 100, 200];

	// Bank transfer details — shown in the FAQ as a manual alternative, not a form.
	const iban = 'AT04 3412 9000 0893 6452';
	const bic = 'GENOAT21XXX';
	const bankName = 'Raiffeisenbank Gunskirchen';
	const receiverName = 'Klimadashboard';

	onMount(async () => {
		const presetAmount = page.url.searchParams.get('amount');
		const piClientSecret = page.url.searchParams.get('payment_intent_client_secret');

		if (presetAmount) {
			const parsed = parseFloat(presetAmount);
			if (!isNaN(parsed) && parsed > 0) {
				amount = parsed;
				// An amount that isn't one of the presets belongs in the free-text field,
				// otherwise it would look like nothing is selected at all.
				if (!suggestedAmounts.includes(parsed)) customAmount = String(parsed);
			}
		}

		// Returning from a redirect-based payment method (SEPA, some bank redirects) —
		// card/Apple Pay/Google Pay never leave the page, so this is the rare fallback.
		if (piClientSecret) {
			checkoutStatus = 'processing';
			const stripe = await getStripe();
			const result = await stripe?.retrievePaymentIntent(piClientSecret);
			if (result?.paymentIntent?.status === 'succeeded') {
				checkoutStatus = 'success';
				window.rybbit?.event('Donation Success', { method: 'card', redirected: 'true' });
			} else if (result?.paymentIntent?.status === 'processing') {
				checkoutStatus = 'processing';
			} else {
				checkoutStatus = 'error';
			}
		}

		if (presetAmount || piClientSecret) {
			const url = new URL(window.location.href);
			url.searchParams.delete('amount');
			url.searchParams.delete('payment_intent_client_secret');
			url.searchParams.delete('payment_intent');
			window.history.replaceState({}, '', url.toString());
		}

		try {
			if (!countries?.length) {
				const directus = getDirectusInstance(fetch);
				// @ts-ignore
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
			if (!countries.find((c) => c.id === country)) {
				const at = countries.find((c) => c.id === 'AT');
				country = at?.id ?? countries[0]?.id ?? 'AT';
			}
		} catch (e) {
			console.error('Failed to load countries from Directus', e);
		}
	});

	function amountEUR(a: number | ''): number {
		return typeof a === 'number' ? Math.max(0, a) : 0;
	}
	function selectSuggestedAmount(val: number) {
		amount = val;
		customAmount = '';
		window.rybbit?.event('Donation Amount', { amount: val, preset: 'true' });
	}
	function handleCustomAmount(e: Event) {
		customAmount = (e.currentTarget as HTMLInputElement).value;
		const parsed = parseFloat(customAmount);
		amount = isNaN(parsed) ? '' : parsed;
	}
	function selectFrequency(f: Frequency) {
		frequency = f;
		window.rybbit?.event('Donation Frequency', { frequency: f });
	}
	function toggleWantsReceipt() {
		wantsReceipt = !wantsReceipt;
		window.rybbit?.event('Donation Receipt Toggle', { wantsReceipt: String(wantsReceipt) });
	}

	// ───────────────────────────────── Instant checkout: create/refresh the
	// PaymentIntent automatically whenever the relevant fields settle (debounced),
	// instead of waiting for an explicit "continue" click.
	$: if (browser) {
		// What the donor actually gets charged, kept separate from the rest.
		const charge = JSON.stringify({ amount: amountEUR(amount), frequency, coverFee });
		const fp = JSON.stringify({
			charge,
			newsletter,
			name,
			email,
			country,
			birthdate,
			wantsReceipt,
			addressLine,
			zip,
			city,
			state,
			details2
		});

		// A Stripe Elements group is pinned to one PaymentIntent for its whole life —
		// it cannot be re-pointed at another. So the moment the charge changes, the
		// mounted element is stale and must be torn down immediately, not after the
		// debounce: otherwise Apple Pay would happily confirm the previous intent
		// (which is how a monthly donation once went through as a one-off charge).
		if (charge !== lastChargeFingerprint) {
			lastChargeFingerprint = charge;
			clientSecret = null;
		}

		if (isValid && fp !== lastIntentFingerprint) {
			lastIntentFingerprint = fp;
			clearTimeout(intentTimer);
			intentTimer = setTimeout(createPaymentIntent, 600);
		} else if (!isValid && clientSecret) {
			clientSecret = null;
		}
	}

	async function createPaymentIntent() {
		creatingIntent = true;
		error = '';
		try {
			const res = await fetch(`${window.location.pathname}/api/create-payment-intent`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					amount: amountEUR(amount),
					frequency,
					coverFee,
					newsletter,
					name,
					email,
					country,
					birthdate: birthdate || undefined,
					wantsReceipt,
					address:
						country !== 'AT' && wantsReceipt
							? {
									addressLine,
									zip,
									city,
									state: state || undefined,
									details2: details2 || undefined
								}
							: undefined
				})
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message || 'Zahlung konnte nicht vorbereitet werden.');
			}
			const body = await res.json();
			clientSecret = body.clientSecret;
		} catch (e: any) {
			error = e?.message || 'Zahlung konnte nicht vorbereitet werden. Bitte versuche es erneut.';
			clientSecret = null;
		} finally {
			creatingIntent = false;
		}
	}

	async function handleCardSuccess() {
		cardSuccess = true;
		window.rybbit?.event('Donation Success', {
			method: 'card',
			frequency,
			amount: amountEUR(amount)
		});

		if (frequency === 'recurring' && clientSecret) {
			try {
				const res = await fetch(`${window.location.pathname}/api/create-portal-session`, {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ clientSecret })
				});
				if (res.ok) {
					const body = await res.json();
					portalUrl = body.url ?? null;
				}
			} catch (e) {
				console.error('Failed to create portal session', e);
			}
		}
	}
	function handleCardError(e: CustomEvent) {
		window.rybbit?.event('Donation Error', { method: 'card', message: e.detail?.message });
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

	<p class="text-lg mt-4">
		Fundierte Klimapolitik braucht klare Fakten. Mit deiner Spende stärkst du den Verein
		Klimadashboard, sicherst unsere Arbeit langfristig, ermöglichst neue Datenvisualisierungen,
		schaffst Jobs und bringst mehr Transparenz in Klimadaten.
	</p>

	<p class="text-lg mt-4">
		Unsere Einnahmen & Ausgaben <a href="/finance" class="underline underline-offset-2"
			>legen wir transparent offen</a
		>.
	</p>

	{#if done}
		<div
			class="mt-6 rounded-2xl border border-green-300 dark:border-green-800 bg-green-100 dark:bg-green-900/25 px-4 py-3 text-green-900 dark:text-green-200"
			id="success"
		>
			<p class="font-semibold">Danke für deine Spende! 💚</p>
			<p class="text-sm mt-1">
				{#if frequency === 'recurring'}
					Deine monatliche Spende wurde erfolgreich eingerichtet. Vielen Dank für deine dauerhafte
					Unterstützung!
				{:else}
					Deine Zahlung wurde erfolgreich abgeschlossen. Vielen Dank für deine Unterstützung!
				{/if}
				{#if country === 'AT'}
					Wir melden deine Spende automatisch ans Finanzamt.
				{/if}
				Bei Fragen:
				<a href="mailto:team@klimadashboard.org" class="underline">team@klimadashboard.org</a>.
			</p>
			{#if frequency === 'recurring' && portalUrl}
				<a href={portalUrl} class="inline-block mt-2 text-sm underline underline-offset-2">
					Monatliche Spende verwalten oder kündigen
				</a>
			{/if}
		</div>
	{:else}
		{#if checkoutStatus === 'processing'}
			<div
				class="mt-6 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/25 px-4 py-3 text-amber-900 dark:text-amber-200"
			>
				<p class="font-semibold">Zahlung wird verarbeitet …</p>
				<p class="text-sm mt-1">
					Wir bestätigen deine Zahlung gerade. Das kann bei manchen Zahlungsarten etwas dauern — du
					bekommst in Kürze eine Bestätigung per E-Mail.
				</p>
			</div>
		{:else if checkoutStatus === 'error'}
			<div
				class="mt-6 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/25 px-4 py-3 text-amber-900 dark:text-amber-200"
			>
				<p class="font-semibold">Zahlung nicht abgeschlossen</p>
				<p class="text-sm mt-1">
					Deine Zahlung konnte nicht bestätigt werden. Deine Karte wurde dabei nicht belastet. Du
					kannst unten jederzeit einen neuen Spendenversuch starten.
				</p>
			</div>
		{/if}

		<div
			class="mt-8 bg-white dark:bg-gray-900 border border-current/10 rounded-3xl shadow-sm p-5 sm:p-6"
		>
			<!-- ───────────────── Einmalig / Monatlich — segmented control.
			     Native radios inside a fieldset (same a11y pattern as $lib/components/ui
			     RadioGroup, restyled to the donation green and able to sit inline). -->
			<fieldset class="mb-5">
				<legend class="sr-only">Wie oft möchtest du spenden?</legend>
				<div class="flex p-1 gap-1 rounded-full bg-gray-100 dark:bg-gray-800 max-w-xs mx-auto">
					{#each [{ value: 'onetime', label: 'Einmalig' }, { value: 'recurring', label: 'Monatlich' }] as opt}
						<label class="flex-1 relative">
							<input
								type="radio"
								name="frequency"
								value={opt.value}
								checked={frequency === opt.value}
								on:change={() => selectFrequency(opt.value as Frequency)}
								class="sr-only peer"
							/>
							<span
								class="block text-center text-sm font-medium py-2 rounded-full cursor-pointer transition-colors
									peer-focus-visible:ring-2 peer-focus-visible:ring-green-600 peer-focus-visible:ring-offset-1
									{frequency === opt.value
									? 'bg-green-600 text-white shadow-sm'
									: 'hover:bg-white/70 dark:hover:bg-gray-700'}"
							>
								{opt.label}
							</span>
						</label>
					{/each}
				</div>
			</fieldset>

			<!-- ───────────────── Amount -->
			<fieldset>
				<legend
					class="block w-full text-center text-sm font-bold uppercase tracking-wide opacity-70 mb-3"
				>
					{frequency === 'recurring' ? 'Deine monatliche Spende' : 'Deine Spende'}
				</legend>
				<div class="grid grid-cols-4 gap-2">
					{#each suggestedAmounts as amt}
						<label class="relative">
							<input
								type="radio"
								name="amount"
								value={amt}
								checked={amount === amt}
								on:change={() => selectSuggestedAmount(amt)}
								class="sr-only peer"
							/>
							<span
								class="block text-center py-2.5 rounded-xl border font-medium cursor-pointer transition-colors
									peer-focus-visible:ring-2 peer-focus-visible:ring-green-600 peer-focus-visible:ring-offset-1
									{amount === amt
									? 'bg-green-600 text-white border-transparent'
									: 'border-gray-200 dark:border-gray-700 hover:border-green-600'}"
							>
								€{amt}
							</span>
						</label>
					{/each}
				</div>

				<label
					class="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5 focus-within:ring-2 focus-within:ring-green-600"
				>
					<span class="opacity-60" aria-hidden="true">€</span>
					<span class="sr-only">Anderer Betrag in Euro</span>
					<input
						type="number"
						min="1"
						max="9999"
						step="1"
						placeholder="Anderer Betrag"
						class="w-full bg-transparent outline-none"
						value={customAmount}
						on:input={handleCustomAmount}
					/>
					{#if frequency === 'recurring'}
						<span class="text-sm opacity-60 whitespace-nowrap">/ Monat</span>
					{/if}
				</label>
			</fieldset>
			{#if amount && amount < MIN_DONATION_EUR}
				<p class="text-sm mt-2 text-center opacity-70">
					Mindestspende mit Kartenzahlung sind {MIN_DONATION_EUR}€, damit die Verwaltungskosten im
					Rahmen bleiben. Du kannst aber sehr gern direkt per Überweisung spenden, siehe unten.
				</p>
			{/if}

			<!-- ───────────────── Donor info -->
			<div class="grid gap-3 mt-6">
				<div class="grid sm:grid-cols-2 gap-3">
					<div class="flex flex-col gap-1">
						<label for="name">Name</label>
						<input
							id="name"
							type="text"
							class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2"
							bind:value={name}
							required
						/>
					</div>
					<div class="flex flex-col gap-1">
						<label for="email">Email</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2"
							required
						/>
					</div>
				</div>

				<div class="flex flex-col gap-1 sm:max-w-xs">
					<label for="country">Land</label>
					<select
						id="country"
						class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2"
						bind:value={country}
					>
						{#if !countries.length}
							<option value="AT">Österreich</option>
						{:else}
							{#each countries as c}
								<option value={c.id}>{c.name_de}</option>
							{/each}
						{/if}
					</select>
				</div>

				{#if country === 'AT'}
					<div
						class="rounded-2xl border border-green-300 dark:border-green-800 bg-green-100 dark:bg-green-900/25 px-4 py-3 text-green-900 dark:text-green-200 text-sm"
					>
						<b>Deine Spende ist in Österreich steuerlich absetzbar.</b> Wir melden sie automatisch mit
						deinem Namen & Geburtsdatum ans Finanzamt — dafür brauchen wir nur dein Geburtsdatum, keine
						Adresse.
					</div>
					<div class="flex flex-col gap-1 sm:max-w-xs">
						<label for="birthdate">Geburtsdatum</label>
						<input
							id="birthdate"
							type="date"
							bind:value={birthdate}
							class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2"
							min="1900-01-01"
							required
						/>
					</div>
				{:else}
					<div
						class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm"
					>
						Spenden aus {countries.find((c) => c.id === country)?.name_de ?? 'diesem Land'} sind bei
						uns aktuell nicht steuerlich absetzbar.
						<button
							type="button"
							class="underline underline-offset-2 font-medium ml-1"
							on:click={toggleWantsReceipt}
						>
							{wantsReceipt
								? 'Doch keine Spendenbescheinigung nötig'
								: 'Ich möchte trotzdem eine Spendenbescheinigung'}
						</button>
					</div>

					{#if wantsReceipt}
						<div class="flex flex-col gap-1 sm:max-w-xs">
							<label for="birthdate">Geburtsdatum</label>
							<input
								id="birthdate"
								type="date"
								bind:value={birthdate}
								class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2"
								min="1900-01-01"
								required
							/>
						</div>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div class="flex flex-col gap-1 sm:col-span-2">
								<label for="addressLine">Straße & Nr.</label>
								<input
									id="addressLine"
									type="text"
									bind:value={addressLine}
									class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2"
									required
								/>
							</div>
							<div class="flex flex-col gap-1">
								<label for="zip">PLZ</label>
								<input
									id="zip"
									type="text"
									bind:value={zip}
									class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2"
									required
								/>
							</div>
							<div class="flex flex-col gap-1">
								<label for="city">Ort</label>
								<input
									id="city"
									type="text"
									bind:value={city}
									class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2"
									required
								/>
							</div>
							<div class="flex flex-col gap-1">
								<label for="details2">Adresszusatz (optional)</label>
								<input
									id="details2"
									type="text"
									bind:value={details2}
									class="w-full rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2"
								/>
							</div>
						</div>
					{/if}
				{/if}
			</div>

			<div class="mt-4 grid gap-2">
				{#if amount && amountEUR(amount) >= MIN_DONATION_EUR}
					{@const { fee } = calculateCardFee(amountEUR(amount))}
					<label class="flex items-start gap-2 text-sm cursor-pointer opacity-80">
						<input type="checkbox" bind:checked={coverFee} class="mt-0.5" />
						<span>
							Ich übernehme die {frequency === 'recurring' ? 'monatliche ' : ''}Kartengebühr von
							<b>€{fee.toFixed(2)}</b>, damit 100% meiner Spende ankommt.
						</span>
					</label>
				{/if}

				<!-- Optional and unticked: marketing email is the one thing here that
				     genuinely needs consent, so it stays separate from the donation. -->
				<label class="flex items-start gap-2 text-sm cursor-pointer opacity-80">
					<input type="checkbox" bind:checked={newsletter} class="mt-0.5" />
					<span>
						Ja, ich möchte den Klimadashboard-Newsletter mit neuen Datenvisualisierungen erhalten.
						Abmeldung jederzeit möglich.
					</span>
				</label>
			</div>

			{#if error}
				<p class="text-red-600 text-sm mt-3">{error}</p>
			{/if}

			<!-- ───────────────── Checkout: always-visible button, Express Checkout
			     (Apple Pay / Google Pay / Link) loads in additionally once ready -->
			<div class="mt-6">
				{#if clientSecret}
					<!-- Keyed on the secret: Stripe Elements read it once at mount, so a
					     changed intent needs a brand-new component, not an updated prop. -->
					{#key clientSecret}
						<Checkout
							{clientSecret}
							amountLabel={`€${(coverFee ? calculateCardFee(amountEUR(amount)).total : amountEUR(amount)).toFixed(2)}${frequency === 'recurring' ? '/Monat' : ''}`}
							returnUrl={`${page.url.origin}${page.url.pathname}`}
							on:success={handleCardSuccess}
							on:error={handleCardError}
						/>
					{/key}
				{:else}
					<button
						type="button"
						disabled
						class="w-full py-3 rounded-full bg-green-700 text-white font-bold opacity-40 cursor-not-allowed"
					>
						{creatingIntent ? 'Wird vorbereitet …' : 'Jetzt spenden'}
					</button>
					{#if !isValid}
						<p class="text-sm text-center opacity-60 mt-2">Bitte Betrag, Name und Email angeben.</p>
					{/if}
				{/if}

				<!-- ───────────────── Trust strip + Art. 13 DSGVO notice.
				     An information duty, not a consent one: the donation itself is
				     processed on the basis of contract and legal obligation
				     (bookkeeping, Finanzamt-Meldung), so there is nothing here to
				     tick — only to disclose. -->
				<div class="mt-4 flex flex-col items-center gap-2">
					<p class="flex items-center gap-1.5 text-xs opacity-70">
						<IconLock size={15} stroke={1.5} aria-hidden="true" />
						Sichere, SSL-verschlüsselte Zahlung über Stripe. Wir speichern keine Kartendaten.
					</p>
					<p class="text-xs opacity-70 text-center max-w-md">
						Wir verarbeiten deine Angaben, um deine Spende abzuwickeln, sie zu verbuchen und —
						in Österreich — ans Finanzamt zu melden. Mehr dazu in unserer
						<a href="/datenschutz" class="underline underline-offset-2">Datenschutzerklärung</a>.
					</p>
					<PaymentMethods />
				</div>
			</div>
		</div>
	{/if}

	<!-- Info blocks -->
	<div class="text-lg my-16">
		<h3 class="font-bold">Kann ich meine Spende von der Steuer absetzen?</h3>
		<p>
			In Österreich ja — deine Spende wird mit deinem Namen & Geburtsdatum automatisch ans Finanzamt
			gemeldet. In anderen Ländern ist unser Verein aktuell noch nicht gemeinnützig, Spenden sind
			dort daher nicht absetzungsfähig; du kannst aber trotzdem eine formale Spendenbescheinigung
			anfordern.
		</p>

		<h3 class="font-bold mt-4">Kann ich meine monatliche Spende ändern oder kündigen?</h3>
		<p>
			Ja, jederzeit — über die <a href="/donate/manage" class="underline underline-offset-2"
				>Verwaltung deiner Spende</a
			>
			schicken wir dir einen Link zu, mit dem du deine Zahlungsmethode ändern oder deine monatliche Spende
			beenden kannst.
		</p>

		<h3 class="font-bold mt-4">Kann ich auch per Banküberweisung spenden?</h3>
		<p>Ja. Überweise deinen Wunschbetrag direkt an:</p>
		<p class="font-mono text-base mt-2 leading-relaxed">
			{receiverName}<br />
			IBAN: {iban}<br />
			BIC: {bic}<br />
			{bankName}
		</p>
		<p class="mt-2">
			Bitte gib als Verwendungszweck deinen Namen an. Bist du in Österreich steuerpflichtig, ergänze
			zusätzlich dein Geburtsdatum (TT.MM.JJJJ) — nur so können wir deine Spende deinem Namen
			zuordnen und automatisch ans Finanzamt melden.
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
			Bist du in Österreich steuerpflichtig, melden wir deine Spende automatisch ans Finanzamt —
			eine gesonderte Spendenbescheinigung brauchst du dafür nicht. Aus anderen Ländern kannst du
			beim Spenden angeben, dass du eine formale Spendenbescheinigung möchtest; sie ist aktuell aber
			nicht steuerlich absetzbar, da unser Verein dort noch nicht gemeinnützig ist.
		</p>

		<p class="mt-4 opacity-70">&hearts; Danke für deine Unterstützung.</p>
	</div>
</div>
