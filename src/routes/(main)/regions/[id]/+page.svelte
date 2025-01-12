<script>
	import { onMount } from 'svelte';
	import Scroller from '@sveltejs/svelte-scroller';
	import { browser } from '$app/environment';
	import Chart from '$lib/components/charts/index.svelte';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItem } from '@directus/sdk';

	export let data;

	onMount(() => {
		localStorage.setItem('kd_region_id', data.page.id);
		localStorage.setItem('kd_region_name', data.page.name);
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
			id: 'emissions'
		},
		{
			title: 'Energie',
			id: 'energy'
		},
		{
			title: 'Mobilität',
			id: 'mobility'
		},
		{
			title: 'Temperatur',
			id: 'temperature',
			charts: [
				{
					id: '8378b7bc-10db-4373-9941-1ca014e70353'
				}
			]
		},
		{
			title: 'Schnee',
			id: 'snow'
		}
	];

	const getChart = async function (id) {
		const directus = getDirectusInstance(fetch);
		const chart = await directus.request(readItem('charts', id, { fields: ['*.*'] }));
		return chart;
	};

	// Store chart data for each section
	let chartData = {};

	// Load charts for all sections with charts
	onMount(async () => {
		for (const section of sections) {
			if (section.charts) {
				for (const chart of section.charts) {
					chartData[chart.id] = await getChart(chart.id);
				}
			}
		}
	});

	const scrollToTop = function (event) {
		event.preventDefault(); // Prevent default anchor behavior
		window.scrollTo({ top: 0, behavior: 'smooth' }); // Smooth scroll to top
	};
</script>

<main class="top">
	<Scroller bind:index bind:offset bind:progress>
		<div slot="background" />
		<div slot="foreground">
			<div class="my-8">
				<h2 class="uppercase opacity-70 font-bold tracking-wide text-sm">Auf einen Blick</h2>
				<div class="grid md:grid-cols-3 gap-4 mt-2">
					<div class="bg-gray-50 p-4 rounded flex gap-4">
						<p class="font-light text-6xl">35%</p>
						<p class="text-lg leading-tight">eine erste Statistik, <br />live aus der Region</p>
					</div>
					<div class="bg-gray-50 p-4 rounded flex gap-4">
						<p class="font-light text-6xl">14</p>
						<p class="text-lg leading-tight">Hitzetage bisher in diesem Jahr</p>
					</div>
					<div class="bg-gray-50 p-4 rounded flex gap-4">
						<p class="font-light text-6xl">70%</p>
						<p class="text-lg leading-tight">der Wege im Bezirk werden mit dem Auto zurückgelegt</p>
					</div>
				</div>
			</div>

			<div>
				<h2 class="uppercase opacity-70 font-bold tracking-wide text-sm">Themen im Überblick</h2>
				<div class="flex justify-between">
					{#each sections as section}
						<a href="#{section.id}">{section.title}</a>
					{/each}
				</div>
			</div>

			{#each sections as section}
				<section id={section.id} class="mt-16">
					<h2 class="text-2xl my-4 text-center max-w-2xl mx-auto">{section.title}</h2>
					{#if section.charts}
						{#each section.charts as chart}
							{#if chartData[chart.id]}
								<Chart chart={chartData[chart.id]} />
							{:else}
								<p>Loading chart...</p>
							{/if}
						{/each}
					{:else}
						<div class="bg-gray-100 h-96">Charts</div>
					{/if}
					<button on:mousedown={scrollToTop} class="my-4 mx-auto w-max text-center block">
						&uarr; Zurück zum Überblick
					</button>
				</section>
			{/each}
		</div>
	</Scroller>
</main>
