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
				? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(epcData)}&format=svg`
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

	async function payWithStripeRedirect() {
		if (!name || !email || !amount || (amount as number) <= 0) {
			error = 'Please fill out all required fields with valid data.';
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
			window.location.href = data.url; // redirect to Stripe
		} catch (e: any) {
			error = e?.message || 'Something went wrong. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="max-w-3xl mx-auto m-1 pt-8">
	{#if success}
		<p>🎉 Thank you for your donation!</p>
	{:else}
		<h1 class="text-4xl font-bold mb-4">Gemeinsam für mehr Fakten in der Klimapolitik</h1>

		<p class="text-lg">
			Wir machen Klimawissenschaft mit deiner Hilfe zugänglich – für alle, kostenlos und immer
			aktuell.<br />
			Deine Spende wird in Österreich ans Finanzamt gemeldet und ist hier steuerlich absetzbar.
		</p>

		<p class="font-bold text-lg mt-4">
			Mit 7.000€ in diesem Jahr ist unsere Arbeit 2026 abgesichert.
		</p>

		<div class="rounded-full overflow-hidden mt-4 bg-green-200 h-10 w-full relative">
			<div class="absolute top-0 left-0 bottom-0 bg-green-700 rounded-full" style="width: 90%">
				<div class="w-full h-full animate-pulse bg-gray-900 opacity-50 rounded-full absolute"></div>
				<p class="text-white absolute right-2 text-lg p-1.5"><b>5.000€</b> von 7.000€ gesammelt</p>
			</div>
		</div>

		<div class="grid gap-4 mt-4">
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
				<label>Deine Spende</label>
				<div class="grid gap-4 grid-cols-4">
					{#each suggestedAmounts as amt}
						<label class="button">
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

			<div
				class="flex items-center gap-4 justify-between bg-white shadow-xl border-1 border-gray-200 p-4 rounded-2xl"
			>
				<div>
					<p class="text-lg text-balance">
						<b>Unser Favorit: Banküberweisung</b> 100% deiner Spende gehen an uns – Spendenbestätigung
						gibt’s per E-Mail.
					</p>
					<div class="font-mono text-sm mt-2">
						<p>{receiverName}</p>
						<p>{iban}</p>
						<p>{bic}</p>
						<p>{bank}</p>
						<p>€{amount.toFixed(2)}</p>
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

			<div class="border-t pt-4">
				{#if amount}
					{@const { fee, net } = calculateStripeFee(amount)}
					<p class="mt-1 text-lg">
						<b>Andere Zahlungsarten</b> Von €{amount.toFixed(2)} zahlen wir €{fee.toFixed(2)} Gebühren
						und €{net.toFixed(2)} werden als Spende dem Klimadashboard gutgeschrieben. Du erhältst eine
						Spendenbestätigung über €
						{net.toFixed(2)}.
					</p>
					<button
						type="button"
						class="button mt-2"
						on:click={payWithStripeRedirect}
						disabled={isSubmitting}
					>
						{isSubmitting ? 'Weiter zu Stripe …' : 'Jetzt mit Stripe zahlen'}
					</button>
				{/if}
			</div>

			{#if error}
				<p>{error}</p>
			{/if}
		</div>
	{/if}
</div>
