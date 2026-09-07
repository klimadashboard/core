<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { Stripe, StripeElements, PaymentIntent } from '@stripe/stripe-js';
	import { getStripe } from '$lib/stripe-client';

	export let clientSecret: string;
	export let amountLabel: string;
	export let returnUrl: string;

	const dispatch = createEventDispatcher<{
		success: PaymentIntent;
		error: { message?: string };
	}>();

	let stripe: Stripe | null = null;
	let elements: StripeElements | null = null;
	let expressEl: HTMLDivElement;
	let paymentEl: HTMLDivElement;
	let loading = true;
	let submitting = false;
	let errorMessage = '';
	let hasExpressMethods = false;

	// Shared by both trigger points: the Express Checkout button (Apple Pay / Google
	// Pay / Link) and the manual "Spenden" button below the card fields.
	async function confirm(): Promise<boolean> {
		if (!stripe || !elements) return false;
		submitting = true;
		errorMessage = '';

		// redirect: 'if_required' keeps everything inline — only payment methods that
		// truly need a redirect (rare) will navigate away.
		const { error, paymentIntent } = await stripe.confirmPayment({
			elements,
			confirmParams: { return_url: returnUrl },
			redirect: 'if_required'
		});

		if (error) {
			errorMessage = error.message ?? 'Zahlung fehlgeschlagen. Bitte versuche es erneut.';
			submitting = false;
			dispatch('error', error);
			return false;
		}
		if (paymentIntent) dispatch('success', paymentIntent);
		return true;
	}

	async function handleCardSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (submitting) return;
		await confirm();
	}

	onMount(async () => {
		try {
			stripe = await getStripe();
			if (!stripe) throw new Error('empty stripe instance');

			elements = stripe.elements({
				clientSecret,
				locale: 'de',
				appearance: {
					theme: 'stripe',
					variables: {
						colorPrimary: '#16a34a',
						borderRadius: '12px'
					}
				}
			});

			const expressCheckout = elements.create('expressCheckout', { buttonHeight: 48 });
			expressCheckout.on('ready', ({ availablePaymentMethods }) => {
				hasExpressMethods = !!(
					availablePaymentMethods && Object.values(availablePaymentMethods).some(Boolean)
				);
				loading = false;
			});
			expressCheckout.on('confirm', async (event) => {
				const ok = await confirm();
				if (!ok) event.paymentFailed({ reason: 'fail' });
			});
			expressCheckout.mount(expressEl);

			const payment = elements.create('payment', { layout: 'tabs' });
			payment.mount(paymentEl);
			payment.on('ready', () => (loading = false));
		} catch (e) {
			console.error('Checkout mount failed', e);
			errorMessage = 'Zahlungsdienst konnte nicht geladen werden. Bitte lade die Seite neu.';
			loading = false;
		}
	});
</script>

<div class="flex flex-col gap-3">
	{#if loading}
		<div class="flex items-center gap-2 py-6 justify-center opacity-70 text-sm">
			<span
				class="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
			></span>
			Zahlung wird vorbereitet …
		</div>
	{/if}

	<div bind:this={expressEl}></div>

	{#if hasExpressMethods}
		<div class="flex items-center gap-3 text-xs uppercase tracking-wide opacity-50 my-1">
			<span class="h-px flex-1 bg-current/15"></span>
			oder mit Karte
			<span class="h-px flex-1 bg-current/15"></span>
		</div>
	{/if}

	<form on:submit={handleCardSubmit} class="flex flex-col gap-3">
		<div bind:this={paymentEl}></div>

		{#if errorMessage}
			<p class="text-red-600 text-sm">{errorMessage}</p>
		{/if}

		<button
			type="submit"
			disabled={submitting || loading || !elements}
			class="w-full py-3 rounded-full bg-green-700 text-white font-bold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
		>
			{submitting ? 'Wird verarbeitet …' : `Jetzt ${amountLabel} spenden`}
		</button>
	</form>
</div>
