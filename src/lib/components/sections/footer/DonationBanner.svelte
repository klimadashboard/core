<script>
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { PUBLIC_VERSION } from '$env/static/public';
	import DonationStatusBar from '$lib/components/DonationStatusBar.svelte';
	import { page } from '$app/state';

	const COOKIE_NAME = 'hide_donation_banner';

	let hidden = true; // start hidden, will show after 5s if no cookie

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

		// Show after 5 seconds
		const timer = setTimeout(() => {
			hidden = false;
		}, 5000);

		return () => clearTimeout(timer);
	});

	const hideForever = () => {
		hidden = true;

		// Set cookie for 10 days
		const expires = new Date();
		expires.setDate(expires.getDate() + 10);
		document.cookie = `${COOKIE_NAME}=true; expires=${expires.toUTCString()}; path=/`;
	};
</script>

{#if !hidden && page.url.pathname !== '/donate'}
	<div
		in:fly={{ y: 40, duration: 300 }}
		out:fly={{ y: 40, duration: 200 }}
		class="z-[100] fixed bottom-0 left-0 right-0 py-4 bg-white dark:bg-gray-950 shadow-2xl border-t border-t-current/10"
	>
		<div class="container relative">
			<h2 class="font-bold text-xl max-w-2xl w-[80%] leading-tight">
				Deine Spende für <em class="not-italic underline underline-offset-2 decoration-green-600"
					>mehr Fakten</em
				>
				und <em class="not-italic underline underline-offset-2 decoration-green-600">mehr Tempo</em>
				in der Klimawende
			</h2>
			<p class="leading-snug max-w-3xl text-balance">
				Das Klimadashboard ist und bleibt frei zugänglich für alle. <b
					>Keine Paywall, keine Werbung</b
				>. Wenn du unsere Arbeit hilfreich findest, bitten wir dich um eine Spende, um 2026 noch
				mehr Datenvisualisierungen umsetzen zu können.
				{#if PUBLIC_VERSION == 'at'}
					In Österreich ist deine Spende an uns <b>steuerlich absetzbar</b>.
				{/if}
			</p>
			<a
				class="flex gap-2 mt-2"
				href="https://klimadashboard.org/donate"
				aria-label="Jetzt spenden"
			>
				<DonationStatusBar />
				<span
					class="block flex-shrink-0 py-2 bg-green-600 text-white px-4 rounded-full h-10 font-bold"
					>Jetzt spenden</span
				>
			</a>
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
