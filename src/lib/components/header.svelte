<script>
	import { error } from '@sveltejs/kit';
	import { PUBLIC_VERSION } from '$env/static/public';
	import Loader from './Loader.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import PageHeader from './PageHeader.svelte';
</script>

<header
	class="max-w-full w-full sm:w-max fixed bg-white sm:rounded-full left-1/2 -translate-x-1/2 sm:top-4 z-50 shadow-lg bg-opacity-90 backdrop-blur-sm"
>
	<div class="flex items-center gap-2">
		<a href="/" class="flex items-center gap-2 mr-auto sm:mr-8">
			<div class="w-10 h-10 bg-gray-500 rounded-full" />
			<div class="text-gray-800 font-bold">Klimadashboard.{PUBLIC_VERSION}</div>
		</a>
		<button class="flex items-center gap-1 font-bold">
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
				class="icon icon-tabler icons-tabler-outline icon-tabler-language"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 5h7" /><path
					d="M9 3v2c0 4.418 -2.239 8 -5 8"
				/><path d="M5 9c0 2.144 2.952 3.908 6.7 4" /><path d="M12 20l4 -9l4 9" /><path
					d="M19.1 18h-6.2"
				/></svg
			>
			<span>DE</span>
		</button>

		<button class="flex items-center gap-1 font-bold mx-4">
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
<PageHeader />
