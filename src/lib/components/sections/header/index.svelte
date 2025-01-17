<script>
	import { PUBLIC_VERSION } from '$env/static/public';
	import LocaleSwitcher from './LocaleSwitcher.svelte';
	import Navigation from './Navigation.svelte';
	import LightSwitch from './LightSwitch.svelte';
	import ProgressIndicator from './ProgressIndicator.svelte';
	import Breadcrumb from './Breadcrumb.svelte';

	let showNavigation = false;
</script>

<header
	class="font-display fixed bg-white dark:bg-gray-900 w-screen bg-opacity-90 backdrop-blur-sm z-50"
>
	<div class="flex items-center gap-4 p-4">
		<a href="/" class="flex items-center gap-2">
			<div class=" font-bold">Klimadashboard.{PUBLIC_VERSION}</div>
		</a>

		<Breadcrumb />

		<span class="ml-auto" />
		<LocaleSwitcher />

		<LightSwitch />

		<button
			class="flex items-center gap-1 font-bold mr-4"
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
			<span>Menü</span>
		</button>
	</div>
	<ProgressIndicator />
</header>
<Navigation {showNavigation} />
