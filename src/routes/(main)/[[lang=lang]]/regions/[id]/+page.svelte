<script>
	import { onMount } from 'svelte';
	import Scroller from '@sveltejs/svelte-scroller';
	import { browser } from '$app/environment';
	import Map from './Map.svelte';
	import Intro from './Intro.svelte';
	import Image from './Image.svelte';
	import Chart from '$lib/components/charts/index.svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItem } from '@directus/sdk';

	export let data;

	const coordinates = data.page.center.map((d) => parseFloat(d)).join(',');

	onMount(() => {
		localStorage.setItem('kd_region_id', data.page.id);
		localStorage.setItem('kd_region_name', data.page.name);
		localStorage.setItem('kd_region_coordinates', coordinates);
	});

	let index, offset, progress;

	$: currentSection = sections[index];

	$: {
		if (currentSection && browser) {
			// Update the URL hash without scrolling
			const url = new URL(window.location);
			url.hash = currentSection.id;
			history.replaceState(null, '', url.toString());
		}
	}

	let sections = [
		{
			title: 'Emissionen',
			id: 'emissions',
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-cloud'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878' /></svg>"
		},
		{
			title: 'Energie',
			id: 'energy',
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-bolt'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11' /></svg>"
		},
		{
			title: 'Mobilität',
			id: 'mobility',
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-steering-wheel'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0' /><path d='M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0' /><path d='M12 14l0 7' /><path d='M10 12l-6.75 -2' /><path d='M14 12l6.75 -2' /></svg>"
		},
		{
			title: 'Temperatur',
			id: 'temperature',
			toggle: true,
			charts: [
				{
					id: '8378b7bc-10db-4373-9941-1ca014e70353'
				}
			],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-temperature'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M10 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 0 0 -4 0v8.5' /><path d='M10 9l4 0' /></svg>"
		},
		{
			title: 'Schnee',
			id: 'snow',
			charts: [
				{
					id: 'd88601f8-40de-4753-beb1-a0e824aa048c'
				}
			],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-snowman'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 3a4 4 0 0 1 2.906 6.75a6 6 0 1 1 -5.81 0a4 4 0 0 1 2.904 -6.75z' /><path d='M17.5 11.5l2.5 -1.5' /><path d='M6.5 11.5l-2.5 -1.5' /><path d='M12 13h.01' /><path d='M12 16h.01' /></svg>"
		}
	];

	const scrollToTop = function (event) {
		event.preventDefault(); // Prevent default anchor behavior
		window.scrollTo({ top: 600, behavior: 'smooth' }); // Smooth scroll to top
	};
</script>

<main class="">
	<Scroller bind:index bind:offset bind:progress>
		<div slot="background" />
		<div slot="foreground">
			<div class="h-80">
				<Map {data} />
			</div>
			<Intro {data} />
			<div class="sticky top-12 py-4 bg-white dark:bg-dark-950 z-50" id="top">
				<div class="container flex justify-between">
					{#each sections as section}
						<a href="#{section.id}" class="button">
							{@html section.icon}
							<span>{section.title}</span></a
						>
					{/each}
				</div>
			</div>

			<Image />

			{#each sections as section}
				<section id={section.id} class="mt-16">
					<h2 class="text-2xl my-4 text-center max-w-2xl mx-auto">{section.title}</h2>
					<div class="container">
						{#if section.charts}
							{#each section.charts as chart}
								<Chart id={chart.id} />
							{/each}
						{:else}
							<div class="bg-current/10 p-4">coming soon</div>
						{/if}
					</div>
					<button on:mousedown={scrollToTop} class="button my-4 mx-auto">
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
							class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-up"
							><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 5l0 14" /><path
								d="M18 11l-6 -6"
							/><path d="M6 11l6 -6" /></svg
						>
						<span>Zurück zum Überblick</span>
					</button>
				</section>
			{/each}
		</div></Scroller
	>
</main>
