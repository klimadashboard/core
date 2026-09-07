<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getStripe } from '$lib/stripe-client';

	type Status = 'checking' | 'success' | 'processing' | 'failed';
	let status: Status = 'checking';
	let portalUrl: string | null = null;
	let showConfetti = false;

	// Display-only: decides whether the manage link is offered. Everything that
	// actually matters is gated on the verified PaymentIntent below.
	$: recurring = page.url.searchParams.get('type') === 'recurring';

	const confettiPieces = Array.from({ length: 40 }, (_, i) => ({
		left: Math.random() * 100,
		delay: Math.random() * 0.7,
		duration: 2.4 + Math.random() * 1.6,
		rotate: Math.random() * 360,
		color: ['#41AB5D', '#A1D99B', '#F5AF4A', '#4880A8', '#E5F5E0'][i % 5]
	}));

	onMount(async () => {
		const clientSecret = page.url.searchParams.get('payment_intent_client_secret');
		if (!clientSecret) {
			status = 'failed';
			return;
		}

		// Never congratulate anyone on the strength of a URL alone — ask Stripe.
		const stripe = await getStripe();
		const result = await stripe?.retrievePaymentIntent(clientSecret);
		const state = result?.paymentIntent?.status;

		if (state === 'succeeded') {
			status = 'success';
		} else if (state === 'processing') {
			status = 'processing';
		} else {
			status = 'failed';
			return;
		}

		// Respect people who asked their OS for less movement.
		showConfetti =
			status === 'success' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (recurring) {
			try {
				const res = await fetch('/donate/api/create-portal-session', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ clientSecret })
				});
				if (res.ok) portalUrl = (await res.json()).url ?? null;
			} catch (e) {
				console.error('Failed to create portal session', e);
			}
		}

		// Drop the secret from the address bar once it has done its job.
		const url = new URL(window.location.href);
		url.searchParams.delete('payment_intent_client_secret');
		url.searchParams.delete('payment_intent');
		url.searchParams.delete('redirect_status');
		window.history.replaceState({}, '', url.toString());
	});
</script>

<svelte:head><title>Danke für deine Spende | Klimadashboard</title></svelte:head>

{#if showConfetti}
	<div class="confetti" aria-hidden="true">
		{#each confettiPieces as p}
			<span
				style="left:{p.left}%; background:{p.color}; animation-delay:{p.delay}s; animation-duration:{p.duration}s; --r:{p.rotate}deg"
			></span>
		{/each}
	</div>
{/if}

<div class="max-w-xl mx-auto p-4 text-center min-h-[60vh] flex flex-col justify-center">
	{#if status === 'checking'}
		<p class="opacity-70">Wir bestätigen deine Zahlung …</p>
	{:else if status === 'success'}
		<p class="text-6xl mb-4">💚</p>
		<h1 class="text-4xl mb-4 text-balance">Danke für deine Spende!</h1>
		<p class="text-lg">
			{#if recurring}
				Deine monatliche Spende ist eingerichtet. Damit sicherst du unsere Arbeit langfristig ab —
				das bedeutet uns sehr viel.
			{:else}
				Deine Spende ist bei uns angekommen. Damit ermöglichst du neue Datenvisualisierungen und
				unabhängige Klimadaten für alle.
			{/if}
		</p>
		<p class="text-base mt-4 opacity-80">
			Bist du in Österreich steuerpflichtig, melden wir deine Spende automatisch ans Finanzamt. Eine
			Bestätigung schicken wir dir per E-Mail.
		</p>

		{#if recurring}
			<p class="mt-6 text-sm">
				{#if portalUrl}
					<a href={portalUrl} class="underline underline-offset-2 font-medium">
						Monatliche Spende verwalten oder kündigen
					</a>
				{:else}
					Du kannst deine monatliche Spende jederzeit über die
					<a href="/donate/manage" class="underline underline-offset-2">Spendenverwaltung</a>
					ändern oder beenden.
				{/if}
			</p>
		{/if}

		<div class="mt-8 flex flex-wrap gap-3 justify-center">
			<a href="/" class="px-5 py-3 rounded-full bg-green-700 text-white font-bold"
				>Zurück zum Klimadashboard</a
			>
			<a
				href="/finance"
				class="px-5 py-3 rounded-full border border-gray-200 dark:border-gray-700 font-medium"
				>Wohin dein Geld fließt</a
			>
		</div>
	{:else if status === 'processing'}
		<h1 class="text-3xl mb-3">Deine Zahlung wird verarbeitet …</h1>
		<p class="text-lg opacity-80">
			Das dauert bei manchen Zahlungsarten einen Moment. Sobald sie bestätigt ist, bekommst du eine
			E-Mail von uns.
		</p>
	{:else}
		<h1 class="text-3xl mb-3">Zahlung nicht abgeschlossen</h1>
		<p class="text-lg opacity-80">
			Wir konnten deine Zahlung nicht bestätigen — es wurde nichts abgebucht.
		</p>
		<div class="mt-6">
			<a href="/donate" class="px-5 py-3 rounded-full bg-green-700 text-white font-bold"
				>Nochmal versuchen</a
			>
		</div>
	{/if}
</div>

<style>
	.confetti {
		position: fixed;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 50;
	}
	.confetti span {
		position: absolute;
		top: -12px;
		width: 9px;
		height: 14px;
		border-radius: 2px;
		opacity: 0.9;
		animation-name: fall;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
	}
	@keyframes fall {
		to {
			transform: translateY(105vh) rotate(var(--r));
			opacity: 0;
		}
	}
</style>
