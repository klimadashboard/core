<script>
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { PUBLIC_VERSION } from '$env/static/public';
	import { page } from '$app/state';
	import PaymentMethods from '$lib/components/PaymentMethods.svelte';

	const COOKIE_NAME = 'hide_donation_banner';
	const suggestedAmounts = [30, 50, 100, 200];
	let amount = 50;

	let hidden = true; // start hidden, will show after 20s if no cookie

	onMount(() => {
		// Check cookie
		const cookieValue = document.cookie
			.split('; ')
			.find((row) => row.startsWith(`${COOKIE_NAME}=`))
			?.split('=')[1];

		if (cookieValue === 'true') {
			hidden = true;
			return;
		}

		// Show after 10 seconds on the page
		const timer = setTimeout(() => {
			hidden = false;
		}, 10000);

		return () => clearTimeout(timer);
	});

	// Anywhere in the donation flow — the form, the thank-you page, the management
	// page. Asking someone to donate while they're mid-donation (or just after, or
	// while cancelling) reads badly. Matches lang-prefixed paths too.
	$: inDonateFlow = /\/donate(\/|$)/.test(page.url.pathname);

	const hideForever = () => {
		hidden = true;

		// Set cookie for 7 days
		const expires = new Date();
		expires.setDate(expires.getDate() + 7);
		document.cookie = `${COOKIE_NAME}=true; expires=${expires.toUTCString()}; path=/`;
	};
</script>

<!--
	Never inside an embed: those are iframed into other people's sites, where a
	fixed-position banner would hijack their layout. Embed routes live outside the
	(main) group and so normally render no footer at all — but the error page does
	render one, which is how this would otherwise slip through.
-->
{#if !hidden && !inDonateFlow && !page.url.pathname.startsWith('/embed/')}
	<div
		in:fly={{ y: 40, duration: 300 }}
		out:fly={{ y: 40, duration: 200 }}
		class="z-[100] fixed bottom-0 left-0 right-0 py-4 bg-amber-400 text-black 0 shadow-2xl border-t border-t-current/10"
	>
		<div class="container relative">
			<h2 class="font-bold text-xl max-w-2xl w-[80%] leading-tight">
				Fakten statt Fake News – hilf uns, unabhängig zu bleiben!
			</h2>
			<p class="leading-snug max-w-3xl text-sm md:text-base text-balance my-1">
				Das Klimadashboard bleibt <b>kostenlos, werbefrei und unabhängig</b> – für alle, die
				verlässliche Klimadaten brauchen. Möglich ist das nur, weil Menschen wie du uns direkt
				unterstützen. Deine Spende ermöglicht <b>neue Projekte und regelmäßige Datenupdates</b>.
				{#if PUBLIC_VERSION == 'at'}
					In Österreich ist deine Spende an uns <b>steuerlich absetzbar</b>.
				{/if} Danke, dass du dabei bist!
			</p>
			<div class="flex flex-wrap items-center gap-2 mt-3">
				{#each suggestedAmounts as amt}
					<button
						type="button"
						class="px-3 py-1.5 rounded-full border text-sm cursor-pointer {amount === amt
							? 'bg-black font-bold text-white border-transparent'
							: 'border-current/20 hover:bg-gray-50 dark:hover:bg-gray-900'}"
						on:click={() => (amount = amt)}
					>
						€{amt}
					</button>
				{/each}
				<a
					class="block flex-shrink-0 py-1.5 bg-black text-white px-4 rounded-full font-bold hover:bg-white hover:text-black transition"
					href="https://klimadashboard.org/donate?amount={amount}"
					aria-label="Jetzt spenden"
				>
					Jetzt spenden
				</a>
				<PaymentMethods size={22} />
			</div>
			<button
				class="relative mt-4 md:mt-0 md:absolute md:top-2 md:right-4 text-sm flex items-center gap-0.5 cursor-pointer opacity-70 hover:opacity-100"
				on:mousedown={hideForever}
			>
				<p>nicht mehr anzeigen</p>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="w-5 h-5 translate-y-0.5"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M18 6l-12 12" /><path
						d="M6 6l12 12"
					/></svg
				></button
			>
		</div>
	</div>
{/if}
