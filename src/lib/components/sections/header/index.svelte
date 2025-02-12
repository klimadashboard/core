<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	import LocaleSwitcher from './LocaleSwitcher.svelte';
	import Navigation from './Navigation.svelte';
	import LightSwitch from './LightSwitch.svelte';
	import ProgressIndicator from './ProgressIndicator.svelte';
	import Breadcrumb from './Breadcrumb.svelte';
	import { page } from '$app/stores';

	let showNavigation = false;
	let showSearch = false;

	// Function to handle closing the navigation menu
	function closeNavigation() {
		showNavigation = false;
	}
</script>

<header class="fixed bg-white/90 dark:bg-gray-900/90 w-screen backdrop-blur-xs z-50">
	<div class="p-1 sm:py-2 text-sm sm:text-base">
		<div class="flex items-center gap-2">
			<a href="/" class="flex items-center gap-2">
				<img src="/logo.svg" alt="Klimadashboard" class="h-13 w-13 -m-2 mr-1" />
				<div class="font-bold">Klimadashboard.{PUBLIC_VERSION}</div>
			</a>
			<button class="button" on:mousedown={() => (showNavigation = !showNavigation)}>
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
				<span class="hidden sm:block">Menü</span>
			</button>

			<Breadcrumb />

			<span class="ml-auto" />
			<LocaleSwitcher />

			<LightSwitch />
		</div>
		{#if showNavigation || showSearch}
			<div class="mt-4 pt-4 border-t border-current/20">
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

{#if $page.params.lang}
	<div class="bg-yellow-100 rounded-2xl p-3 m-1 flex gap-1">
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
			class="text-yellow-700"
			><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
				d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"
			/><path d="M12 9h.01" /><path d="M11 12h1v4h1" /></svg
		>
		<p>Please note that translations are currently in beta and sometimes incomplete.</p>
	</div>
{/if}
