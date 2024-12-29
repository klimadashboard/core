<script>
	import { error } from '@sveltejs/kit';
	import { PUBLIC_VERSION } from '$env/static/public';
	import Loader from './Loader.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import PageHeader from './PageHeader.svelte';
	import LocaleSwitcher from './LocaleSwitcher.svelte';
	import Navigation from './Navigation.svelte';

	let showNavigation = false;
</script>

<header
	class="max-w-full w-full sm:w-max fixed bg-white sm:rounded-full left-1/2 -translate-x-1/2 sm:top-4 z-50 shadow-lg bg-opacity-90 backdrop-blur-sm"
>
	<div class="flex items-center gap-2">
		<a href="/" class="flex items-center gap-2 mr-auto sm:mr-8">
			<div class="w-10 h-10 bg-gray-500 rounded-full" />
			<div class="text-gray-800 font-bold">Klimadashboard.{PUBLIC_VERSION}</div>
		</a>

		<LocaleSwitcher />

		<button
			class="flex items-center gap-1 font-bold mx-4"
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
</header>
{#if showNavigation}
	<Navigation />
{/if}
<PageHeader />
