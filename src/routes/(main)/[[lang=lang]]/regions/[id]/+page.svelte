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
			toggle: true,
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
			<Intro />
			<div class="container" id="top">
				<div class="grid grid-cols-2 md:grid-cols-5 gap-1">
					{#each sections as section}
						<a href="#{section.id}" class="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-xl">{section.title}</a>
					{/each}
				</div>
			</div>

		<Image />

			{#each sections as section}
				<section id={section.id} class="mt-16">
					<h2 class="text-2xl my-4 text-center max-w-2xl mx-auto">{section.title}</h2>
					<div>
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
					</div>
					<button on:mousedown={scrollToTop} class=" mt-4 font-bold rounded-full py-1.5 px-3 border hover:bg-gray-100 dark:hover:bg-gray-800 mx-auto block">
						&uarr; Zurück zum Überblick
					</button>
				</section>
			{/each}
	</Scroller>
</main>
