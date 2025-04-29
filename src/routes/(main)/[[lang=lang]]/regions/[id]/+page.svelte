<script>
	import { onMount } from 'svelte';
	import Scroller from '@sveltejs/svelte-scroller';
	import { browser } from '$app/environment';
	import Map from './Map.svelte';
	import Intro from './Intro.svelte';
	import Chart from '$lib/components/charts/index.svelte';
	import Policies from '$lib/components/blocks/Policies.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import getDirectusInstance from '$lib/utils/directus';
	import { readItem } from '@directus/sdk';

	export let data;

	const coordinates = data.page.center.map((d) => parseFloat(d)).join(',');

	$: allowedHeight = 800;

	onMount(() => {
		localStorage.setItem('kd_region_id', data.page.id);
		localStorage.setItem('kd_region_name', data.page.name);
		localStorage.setItem('kd_region_coordinates', coordinates);
		setTimeout(() => {
			const sectionElements = document.querySelectorAll('section');
			console.log(sectionElements);
			sectionElements.forEach((element, i) => {
				if (sections[i]) {
					sections[i].height = element.clientHeight;
				}
			}, 2000);
			console.log(sections);
		});
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
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-cloud'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878' /></svg>",
			charts: [
				{
					id: 'cae6032b-86a9-45d0-bc11-17343845b25a',
					countries: ['at', 'de']
				}
			],
			height: 0,
			expanded: false
		},
		{
			title: 'Energie',
			id: 'energy',
			height: 0,
			expanded: false,
			charts: [
				{
					id: '31a5ca7c-08cf-487c-b2ab-aa04f9d2cd6f',
					countries: ['at', 'de']
				},
				{
					id: '8267b6b9-605d-4603-a8b4-4ad9e6a3c553',
					countries: ['de']
				}
			],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-bolt'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11' /></svg>"
		},
		{
			title: 'Mobilität',
			id: 'mobility',
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-steering-wheel'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0' /><path d='M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0' /><path d='M12 14l0 7' /><path d='M10 12l-6.75 -2' /><path d='M14 12l6.75 -2' /></svg>",
			height: 0,
			expanded: false,
			charts: [
				{
					id: '68b0f853-b1b1-4120-aedd-87de58ea3209',
					countries: ['at', 'de']
				},
				{
					id: 'b3301d53-24e0-4171-be78-75882f602fe8',
					countries: ['at']
				}
			]
		},
		{
			title: 'Zersiedelung',
			id: 'sprawl',
			height: 0,
			expanded: false,
			charts: [
				{
					id: '4b721d01-0598-48e4-ab3b-10d96ed46a53',
					countries: ['at']
				}
			]
		},
		{
			title: 'Temperatur',
			id: 'temperature',
			toggle: true,
			charts: [
				{
					id: '8378b7bc-10db-4373-9941-1ca014e70353',
					countries: ['at', 'de']
				}
			],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-temperature'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M10 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 0 0 -4 0v8.5' /><path d='M10 9l4 0' /></svg>",
			height: 0,
			expanded: false
		},
		{
			title: 'Schnee',
			id: 'snow',
			charts: [
				{
					id: 'd88601f8-40de-4753-beb1-a0e824aa048c',
					countries: ['at', 'de']
				}
			],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-snowman'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 3a4 4 0 0 1 2.906 6.75a6 6 0 1 1 -5.81 0a4 4 0 0 1 2.904 -6.75z' /><path d='M17.5 11.5l2.5 -1.5' /><path d='M6.5 11.5l-2.5 -1.5' /><path d='M12 13h.01' /><path d='M12 16h.01' /></svg>",
			height: 0,
			expanded: false
		},
		{
			title: 'Klimazukunft',
			id: 'scenarios',
			charts: [
				{
					id: '801a3cdf-1197-4b99-9ece-99113940c5fb',
					countries: ['at']
				}
			],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-circle-arrow-right'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18' /><path d='M16 12l-4 -4' /><path d='M16 12h-8' /><path d='M12 16l4 -4' /></svg>",
			height: 0,
			expanded: false
		},
		{
			title: 'Handlungen',
			id: 'actions',
			blocks: [Policies],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-tool'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5' /></svg>",
			height: 0,
			expanded: false
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
			<div class="container p-4 mt-4 opacity-70">
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
					class="inline -translate-y-1"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
						d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
					/><path
						d="M15.03 17.478a8.797 8.797 0 0 1 -3.03 .522c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6a20.48 20.48 0 0 1 -.258 .419"
					/><path d="M19 16v3" /><path d="M19 22v.01" /></svg
				>
				You are accessing a <b>beta version</b> of regional climate dashboards. Note that some data and
				visualisations might be incomplete or show incorrect readings.
			</div>
			<Intro {data} />
			<div class="sticky top-12 py-4 bg-white dark:bg-gray-900 z-50" id="top">
				<div class="container overflow-scroll">
					<div class="flex justify-between gap-4">
						{#each sections as section}
							<a href="#{section.id}" class="button">
								{@html section.icon}
								<span>{section.title}</span></a
							>
						{/each}
					</div>
				</div>
			</div>

			{#each sections as section}
				<section
					id={section.id}
					class="mt-16 relative {section.expanded ? '' : 'max-h-[600px]'} overflow-hidden"
				>
					<div bind:clientHeight={section.height}>
						<h2 class="text-2xl my-4 text-center max-w-2xl mx-auto">{section.title}</h2>
						<div class="container space-y-4">
							{#if section.charts}
								{#each section.charts.filter((c) => c.countries.includes(PUBLIC_VERSION)) as chart}
									<Chart id={chart.id} />
								{/each}
							{/if}
							{#if section.blocks}
								{#each section.blocks as block}
									<svelte:component this={block} />
								{/each}
							{/if}
						</div>
					</div>

					{#if section.height > allowedHeight}
						<div
							class="h-32 absolute bottom-0 left-0 right-0 bg-gradient-to-b from-transparent to-white dark:to-gray-950 z-50"
						>
							<div class="absolute bottom-0 left-1/2 -translate-x-1/2">
								<button on:mousedown={(section.expanded = !section.expanded)} class="button"
									>{#if section.expanded}
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
											class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-up"
											><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
												d="M6 15l6 -6l6 6"
											/></svg
										>
										<span>Weniger zeigen</span>{:else}
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
											class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-down"
											><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
												d="M6 9l6 6l6 -6"
											/></svg
										>
										<span>Mehr zeigen</span>
									{/if}</button
								>
							</div>
						</div>
					{:else}
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
					{/if}
				</section>
			{/each}
		</div></Scroller
	>

	<div class="my-16 flex flex-col items-center gap-2">
		<p class="opacity-80 max-w-sm text-center leading-tight">
			Regionale Klimadashboards werden gefördert durch die
		</p>
		<img
			src="https://base.klimadashboard.org/assets/e4b67105-06e9-405b-82cd-6ffac435f9c1"
			alt="Wirtschaftsagentur Wien"
			class="h-24"
		/>
	</div>
</main>
