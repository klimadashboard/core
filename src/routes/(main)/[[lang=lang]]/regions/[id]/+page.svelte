<script>
	import { onMount } from 'svelte';
	import Scroller from '@sveltejs/svelte-scroller';
	import { browser } from '$app/environment';
	import Intro from './Intro.svelte';
	import Contact from './Contact.svelte';
	import LazyChart from './LazyChart.svelte';
	import Chart from '$lib/components/charts/index.svelte';
	import Policies from '$lib/components/blocks/Policies.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import Support from './Support.svelte';
	import ComingSoon from '../ComingSoon.svelte';
	import Navigation from './Navigation.svelte';
	import ComingSoonChart from './ComingSoonChart.svelte';
	import RelatedRegions from './RelatedRegions.svelte';
	import Credits from './Credits.svelte';

	export let data;

	const coordinates = data.page?.center?.map((d) => parseFloat(d)).join(',') || [];

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

	const sections = [
		{
			title: 'Emissionen',
			countries: ['at', 'de'],
			description: `Die Reduktion von Treibhausgasemissionen ist von entscheidender Bedeutung. Doch wie sieht es in deinem Bundesland aus? Erkunde, wie sich die Emissionen auf verschiedene Sektoren verteilen und wie sich diese über die letzten Jahre verändert haben. `,
			id: 'emissions',
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-cloud'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878' /></svg>",
			charts: [
				{
					id: 'cae6032b-86a9-45d0-bc11-17343845b25a',
					countries: ['at', 'de']
				}
			]
		},
		{
			title: 'Erneuerbare Energie',
			countries: ['de'],
			id: 'energy',
			description: `Erneuerbare Energien spielen eine zentrale Rolle für die Energiewende – doch wie weit ist der Ausbau vor Ort? Erkunde, wie viel Solar- und Windenergie in ${data.page.name} bereits installiert ist.`,
			charts: [
				{
					id: '31a5ca7c-08cf-487c-b2ab-aa04f9d2cd6f',
					countries: ['at', 'de']
				}
			],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-bolt'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11' /></svg>"
		},
		{
			title: 'Mobilität',
			id: 'mobility',
			description: `Der Verkehrsbereich verursacht einen großen Teil der Treibhausgasemissionen. Wie klimafreundlich Mobilität in ${data.page.name} ist, hängt unter anderem von Infrastruktur, Verkehrsangebot und Alltagsgewohnheiten ab – und hat direkten Einfluss auf das Klima.`,
			countries: ['at', 'de'],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-steering-wheel'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0' /><path d='M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0' /><path d='M12 14l0 7' /><path d='M10 12l-6.75 -2' /><path d='M14 12l6.75 -2' /></svg>",
			charts: [
				{
					id: '68b0f853-b1b1-4120-aedd-87de58ea3209',
					countries: ['at', 'de']
				},
				{
					id: '01b74323-efc0-4ecc-bf3f-7e6d6a27a474',
					countries: ['at', 'de']
				},
				{
					id: 'b3301d53-24e0-4171-be78-75882f602fe8',
					countries: ['at'],
					text: 'Wie ist deine Region an den Öffentlichen Verkehr angebunden? Wo sollten mehr Haltestellen errichtet werden? Dazu erfährst du hier bald mehr.'
				}
			]
		},
		{
			title: 'Contact',
			id: 'contact',
			blocks: [Contact],
			countries: ['at', 'de'],
			navigation: false
		},
		{
			title: 'Heizungen',
			id: 'heating',
			description: '',
			countries: ['de'],
			charts: [
				{
					id: '8267b6b9-605d-4603-a8b4-4ad9e6a3c553',
					countries: ['de']
				}
			],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-brand-walmart'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 8.04v-5.04' /><path d='M15.5 10l4.5 -2.5' /><path d='M15.5 14l4.5 2.5' /><path d='M12 15.96v5.04' /><path d='M8.5 14l-4.5 2.5' /><path d='M8.5 10l-4.5 -2.505' /></svg>"
		},
		/*
		{
			title: 'Zersiedelung',
			description:
				'Zersiedelung bedeutet zunehmende Ausbreitung von Siedlungen und Infrastruktur auf unbebauten Flächen. Das führt zu mehr Flächenverbrauch, höheren Emissionen und erschwerten Bedingungen für klimafreundliche Mobilität und Klimaanpassung.',
			countries: ['at'],
			id: 'sprawl',
			charts: [
				{
					// id: '4b721d01-0598-48e4-ab3b-10d96ed46a53',
					countries: ['at']
				}
			]
		},
		*/
		{
			title: 'Temperatur',
			description: `Die Aufzeichnungen von Wetterstationen in deiner Nähe zeigen, wie sich die Temperaturen in der Region in den vergangenen Jahrzehnten entwickelt haben. Die Daten stammen von der geografisch nächstgelegenen Wetterstation für ${data.page.name} mit weitgehend vollständigen Aufzeichnungen seit 1960. Sie liegt nicht zwingend im Gemeindegebiet, erlaubt aber eine Einschätzung der regionalen Entwicklung.`,
			countries: ['at', 'de'],
			id: 'temperature',
			toggle: true,
			charts: [
				{
					id: '8378b7bc-10db-4373-9941-1ca014e70353',
					countries: ['at', 'de']
				}
			],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-temperature'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M10 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 0 0 -4 0v8.5' /><path d='M10 9l4 0' /></svg>"
		},

		{
			title: 'Support',
			id: 'support',
			blocks: [Support],
			countries: ['at', 'de'],
			navigation: false
		},
		{
			title: 'Schnee',
			description: `Im Zusammenhang mit abnehmenden Frost- und Schneetagen lohnt auch ein Blick auf die Entwicklung der Tage, an denen mindestens 1 cm Schnee am Morgen gemessen wurde, den sogenannten Schneedeckentagen.`,
			id: 'snow',
			countries: ['at', 'de'],
			charts: [
				{
					id: 'd88601f8-40de-4753-beb1-a0e824aa048c',
					countries: ['at', 'de']
				}
			],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-snowman'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 3a4 4 0 0 1 2.906 6.75a6 6 0 1 1 -5.81 0a4 4 0 0 1 2.904 -6.75z' /><path d='M17.5 11.5l2.5 -1.5' /><path d='M6.5 11.5l-2.5 -1.5' /><path d='M12 13h.01' /><path d='M12 16h.01' /></svg>"
		},
		{
			title: 'Klimazukunft',
			description: `Auf welche Veränderungen müssen wir uns in ${data.page.name} für die Zukunft einstellen? Klimaszenarien zeigen, welche Auswirkungen die globale Erwärmung in unserer Region hat.`,
			id: 'scenarios',
			countries: ['at'],
			charts: [
				{
					// id: '801a3cdf-1197-4b99-9ece-99113940c5fb',
					text: 'Wie viel heißer wird es bei mir vor Ort, wenn sich die Erde weiter erhitzt? Wo muss ich mit extremem Niederschlag rechnen? Die aktuellsten Klimaszenarien stehen in Kürze hier in einem interaktiven Explorer zu Verfügung.',
					countries: ['at']
				}
			],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-circle-arrow-right'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18' /><path d='M16 12l-4 -4' /><path d='M16 12h-8' /><path d='M12 16l4 -4' /></svg>"
		},
		{
			title: 'Handlungen',
			id: 'actions',
			blocks: [Policies],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='2'  stroke-linecap='round'  stroke-linejoin='round'  class='icon icon-tabler icons-tabler-outline icon-tabler-tool'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5' /></svg>"
		}
	];
</script>

<svelte:head>
	<title>Klimadashboard {data.page.name} | Klimadashboard.{PUBLIC_VERSION}</title>
	<meta name="description" content={data.page.description} />
	<meta property="og:title" content="Klimadashboard {data.page.name}" />
	<meta property="og:description" content={data.page.description} />
</svelte:head>

<main class="">
	<Scroller bind:index bind:offset bind:progress>
		<div slot="background" />
		<div slot="foreground">
			<Intro {data} />

			<Navigation {sections} />
			{#each sections.filter((d) => d.countries?.includes(PUBLIC_VERSION)) as section}
				<section id={section.id} class="mt-16 relative overflow-hidden">
					<div>
						{#if section.navigation !== false}
							<h2 class="container text-3xl">{section.title}</h2>
						{/if}
						{#if section.description}
							<div class="container text-lg mt-2 mb-4">
								<p class="max-w-xl">{section.description}</p>
							</div>
						{/if}
						<div class="container space-y-4">
							{#if section.charts}
								{#each section.charts.filter((c) => c.countries.includes(PUBLIC_VERSION)) as chart}
									{#if chart.id}
										<Chart id={chart.id} />
									{:else}
										<ComingSoonChart text={chart.text} />
									{/if}
								{/each}
							{/if}
							{#if section.blocks}
								{#each section.blocks as block}
									<svelte:component this={block} />
								{/each}
							{/if}
						</div>
					</div>
				</section>
			{/each}
		</div></Scroller
	>

	<Credits />
	<RelatedRegions {data} />
</main>
