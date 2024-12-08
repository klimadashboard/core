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

<header>
	<div class="flex items-center gap-2">
		<a href="/" class="flex items-center gap-2">
			<div class="w-10 h-10 bg-green-700" />
			<div class="text-green-700 font-bold">Klimadashboard</div>
		</a>
		<button class="ml-auto"
			><svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="icon icon-tabler icons-tabler-outline icon-tabler-map-2"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M12 18.5l-3 -1.5l-6 3v-13l6 -3l6 3l6 -3v7.5"
				/><path d="M9 4v13" /><path d="M15 7v5.5" /><path
					d="M21.121 20.121a3 3 0 1 0 -4.242 0c.418 .419 1.125 1.045 2.121 1.879c1.051 -.89 1.759 -1.516 2.121 -1.879z"
				/><path d="M19 18v.01" /></svg
			></button
		>
		<button>
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
		</button>
		<button>
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
				class="icon icon-tabler icons-tabler-outline icon-tabler-search"
				><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
					d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"
				/><path d="M21 21l-6 -6" /></svg
			>
		</button>
		<button class="flex">
			<span>Navigation</span>
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
		</button>
	</div>
	<div class="overflow-scroll border-t p-2 bg-gray-200">
		<div class="flex gap-2 items-center text-sm">
			<h3 class="uppercase font-bold tracking-wider">Beliebt</h3>
			<a href="#" class="flex-shrink-0">Emissionen</a>
			<a href="#" class="flex-shrink-0">CO2-Preis</a>
			<a href="#" class="flex-shrink-0">Temperatur</a>
		</div>
	</div>
</header>
<PageHeader />
