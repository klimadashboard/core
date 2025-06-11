<script lang="ts">
	import { getRegions } from '$lib/utils/regions';
	let name = '';
	let email = '';
	let message = '';
	let dob;
	let region;
	let amount: number | '' = 50;
	let customAmount: string = '';
	let selectedPaymentMethod = 'bank';
	let isSubmitting = false;
	let success = false;
	let error = '';
	let qrCodeDataUrl = '';

	const suggestedAmounts = [25, 50, 100];
	const iban = 'AT04 3412 9000 0893 6452'; // Replace with your NGO's real IBAN
	const cleanIban = iban.replace(/\s/g, '');
	const receiverName = 'Verein Klimadashboard';
	const bic = 'GENOAT21XXX';
	const bank = 'Raiffeisenbank Gunskirchen';

	function selectSuggestedAmount(val: number) {
		amount = val;
		customAmount = '';
		updateQRCode();
	}

	function handleCustomAmountInput(e: Event) {
		customAmount = (e.target as HTMLInputElement).value;
		const parsed = parseFloat(customAmount);
		if (!isNaN(parsed)) amount = parsed;
		else amount = '';
		updateQRCode();
	}

	function calculateStripeFee(amount: number) {
		const fee = Math.round((amount * 0.014 + 0.25) * 100) / 100;
		const net = Math.round((amount - fee) * 100) / 100;
		return { fee, net };
	}

	let qrCodeUrl = '';

	$: console.log(amount);
	async function updateQRCode() {
		if (amount && amount > 0) {
			const remittance = `Donation from ${name || 'Anonymous'}`;
			const epcData = [
				'BCD',
				'001',
				'1',
				'SCT',
				receiverName,
				cleanIban,
				bic,
				`EUR${amount.toFixed(2)}`,
				remittance,
				'' // Optional: Purpose code or blank
			].join('\n');
			console.log(epcData);
			qrCodeUrl = epcData
				? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(epcData)}`
				: '';
		}
	}

	$: selectedPaymentMethod, amount, name, updateQRCode();

	async function handleSubmit() {
		if (!name || !email || !amount || amount <= 0 || !selectedPaymentMethod) {
			error = 'Please fill out all required fields with valid data.';
			return;
		}

		isSubmitting = true;
		error = '';

		const res = await fetch('/api/donate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name,
				email,
				message,
				amount,
				method: selectedPaymentMethod
			})
		});

		isSubmitting = false;

		if (res.ok) {
			success = true;
			name = '';
			email = '';
			message = '';
			amount = '';
			customAmount = '';
		} else {
			const data = await res.json();
			error = data?.error || 'Something went wrong. Please try again.';
		}
	}

	function getRegionParent(region, regionIndex: Map<string, any>) {
		if (!region?.parents || !Array.isArray(region.parents)) return false;

		for (const parent of region.parents) {
			const match = regionIndex.get(parent.id);
			if (match?.layer === 'state') return match.name;
		}

		return false;
	}
</script>

<div class="container py-20">
	{#if success}
		<p>🎉 Thank you for your donation!</p>
	{:else}
		<h1 class="text-4xl font-bold mb-4">Spenden</h1>

		<p class="bg-yellow-100 p-2 rounded-2xl">
			Info: Spenden an das Klimadashboard sind voraussichtlich ab Herbst 2025 steuerlich absetzbar.
			<a href="donate/notify" class="underline underline-offset-2"
				>Gib mir Bescheid, sobald es soweit ist!</a
			>
		</p>
		<form on:submit|preventDefault={handleSubmit} class="grid grid-cols-2 gap-4 mt-4">
			<div class="flex flex-col gap-1">
				<label for="name">Name</label>
				<input id="name" type="text" class="input" bind:value={name} required />
			</div>

			<div class="flex flex-col gap-1">
				<label for="email">Email</label>
				<input id="email" type="email" bind:value={email} class="input" required />
			</div>

			<div class="flex flex-col gap-1">
				<label for="dob">Geburtsdatum</label>
				<input id="dob" type="date" bind:value={dob} class="input" required />
				<p class="text-xs opacity-50">Damit wir deine Spende an das Finanzamt melden können.</p>
			</div>

			<div class="flex flex-col gap-1">
				<label for="region">Region <span class="opacity-70">optional</span></label>
				{#await getRegions()}
					<p>Regionen laden...</p>
				{:then regions}
					{@const regionIndex = new Map(regions.map((r) => [r.id, r]))}
					<select id="region" bind:value={region} class="input" required>
						<option value="">Regionen auswählen...</option>
						{#each regions
							.sort((a, b) => a.name.localeCompare(b.name))
							.filter((d) => d.visible) as region}
							<option value={region.id}>
								{region.name} [{region.country}, {getRegionParent(region, regionIndex)}]
							</option>
						{/each}
					</select>
				{/await}
				<p class="text-xs opacity-50">
					Für 365 Tage nach deiner Spende danken wir dir auf deinem regionalen Klimadashboard.
				</p>
			</div>

			<div class="flex flex-col gap-1 col-span-2">
				<label>Deine Spende</label>
				<div class="grid gap-4 grid-cols-4">
					{#each suggestedAmounts as amt}
						<label>
							<button type="button" on:click={() => selectSuggestedAmount(amt)}>
								€{amt}
							</button>
						</label>
					{/each}
					<label>
						<input
							type="number"
							min="1"
							placeholder="Custom amount (€)"
							bind:value={customAmount}
							on:input={handleCustomAmountInput}
						/>
					</label>
				</div>
			</div>

			<label
				class={`block p-4 rounded-2xl cursor-pointer transition ${
					selectedPaymentMethod === 'bank' ? 'bg-gradient-green' : 'bg-gray-100'
				}`}
			>
				<input
					type="radio"
					name="paymentMethod"
					value="bank"
					bind:group={selectedPaymentMethod}
					class="mr-2"
				/>
				<span class="font-bold">Banküberweisung &hearts;</span>
				<p class="mt-1 text-sm">
					<b>100% deiner Spende geht ans Klimadashboard.</b> Du erhältst einen QR-Code bzw. IBAN,
					mit dem die Überweisung super schnell geht. Du erhältst eine Spendenbestätigung über €{amount.toFixed(
						2
					)} an deine E-Mail Adresse innerhalb von 7 Tagen nach Zahlungseingang.
				</p>
			</label>

			<label
				class={`block p-4 rounded-2xl cursor-pointer transition ${
					selectedPaymentMethod === 'stripe' ? 'bg-gradient-green' : 'bg-gray-100'
				}`}
			>
				<input
					type="radio"
					name="paymentMethod"
					value="stripe"
					bind:group={selectedPaymentMethod}
					class="mr-2"
				/>
				<span class="font-bold">Apple Pay / Google Pay / Kreditkarte</span>
				{#if amount}
					{@const { fee, net } = calculateStripeFee(amount)}
					<p class="mt-1 text-sm">
						Von €{amount.toFixed(2)} zahlen wir €{fee.toFixed(2)} Gebühren und €{net.toFixed(2)} werden
						als Spende dem Klimadashboard gutgeschrieben. Du erhältst eine Spendenbestätigung über €
						{net.toFixed(2)} an deine E-Mail Adresse innerhalb von 7 Tagen nach Zahlungseingang.
					</p>
				{/if}
			</label>

			<div class="col-span-2">
				<label for="message" class="mb-1">Kommentar <span class="opacity-70">optional</span></label>
				<textarea id="message" class="input block w-full" bind:value={message}></textarea>
			</div>

			<div class="col-span-2">
				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full button bg-gradient-green! text-center appearance-none text-xl"
				>
					{isSubmitting ? 'Sending...' : 'Weiter zur Zahlung'}
				</button>
				<p class="text-center opacity-70 mt-2">
					Im nächsten Schritt erhältst du alle Daten für die Überweisung. <br />Deine Daten werden
					gemäß unserer Datenschutzrichtlinie verarbeitet und gespeichert.
				</p>
			</div>

			{#if error}
				<p>{error}</p>
			{/if}
		</form>

		<div class="bg-gray-50 max-w-xs p-4 rounded-2xl mt-4 flex flex-col items-center shadow-2xl">
			<h2 class="text-xl font-bold">Überweisung</h2>
			<div class="text-center">
				<p>{receiverName}</p>
				<p>{iban}</p>
				<p>{bic}</p>
				<p>{bank}</p>
			</div>
			{#if qrCodeUrl}
				<div class="flex flex-col items-center mt-2">
					<img src={qrCodeUrl} alt="Bank transfer QR code" class="w-36 h-36" />
					<p class="text-xs font-bold mt-1 opacity-70 max-w-28 text-center leading-none">
						mit deiner Banking-App scannen
					</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
