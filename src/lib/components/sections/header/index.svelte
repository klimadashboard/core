<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	import LocaleSwitcher from './LocaleSwitcher.svelte';
	import Navigation from './Navigation.svelte';
	import LightSwitch from './LightSwitch.svelte';
	import ProgressIndicator from './ProgressIndicator.svelte';
	import Breadcrumb from './Breadcrumb.svelte';
	import { page } from '$app/state';
	import { clickOutside } from '$lib/utils/clickOutside';
	let showNavigation = false;
	let showSearch = false;

	// Function to handle closing the navigation menu
	function closeNavigation() {
		setTimeout(() => {
			showNavigation = false;
			showSearch = false;
		}, 100);
	}
</script>

<header class="fixed bg-white/90 dark:bg-gray-900/90 w-screen backdrop-blur-xs z-50">
	<div class="text-sm sm:text-base">
		<div class="flex items-center gap-2">
			<a href="/{page.data.language.code}" class="flex items-center gap-2">
				<img src="/logo.svg" alt="Klimadashboard" class="h-13 w-13" />
				<div class="font-bold">Klimadashboard.{PUBLIC_VERSION}</div>
			</a>
			<button
				class="button"
				aria-label={page.data.translations.navigation}
				on:mousedown={() => (showNavigation = !showNavigation)}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="icon icon-tabler icons-tabler-outline icon-tabler-menu-2"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 6l16 0" /><path
						d="M4 12l16 0"
					/><path d="M4 18l16 0" /></svg
				>
				<span class="hidden sm:block">{page.data.translations.navigation}</span>
			</button>

			<Breadcrumb />

			<span class="ml-auto"></span>
			<a
				href="https://donate.stripe.com/8wM03o9ZS0OX28U4gg"
				class=" button !bg-green-400 dark:!bg-green-600 hover:!bg-green-500 dark:hover:!bg-green-500 !hidden md:!block text-base"
				target="_blank"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="inline"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
						d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"
					/><path
						d="M12 6l-3.293 3.293a1 1 0 0 0 0 1.414l.543 .543c.69 .69 1.81 .69 2.5 0l1 -1a3.182 3.182 0 0 1 4.5 0l2.25 2.25"
					/><path d="M12.5 15.5l2 2" /><path d="M15 13l2 2" /></svg
				>
				Spenden
			</a>
			<LocaleSwitcher />

			<LightSwitch />
		</div>
		{#if showNavigation || showSearch}
			<div
				class="mt-4 pt-4 border-t border-current/20"
				use:clickOutside
				on:click_outside={closeNavigation}
			>
				{#if showNavigation}
					<Navigation on:linkClicked={closeNavigation} />
				{/if}
				{#if showSearch}
					<SearchBox />
				{/if}
			</div>
		{/if}
	</div>
	<ProgressIndicator />
</header>

<div class="h-14" />

{#if page.params.lang}
	<div class="text-yellow-600 dark:text-yellow-400 font-bold flex gap-1 p-2">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class=""
			><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
				d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"
			/><path d="M12 9h.01" /><path d="M11 12h1v4h1" /></svg
		>
		<p>{page.data.translations.translationsDisclaimer}</p>
	</div>
{/if}
