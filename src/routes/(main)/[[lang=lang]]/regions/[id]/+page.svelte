<script>
	import { onMount } from 'svelte';
	import Scroller from '@sveltejs/svelte-scroller';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import Intro from './Intro.svelte';
	import Contact from './Contact.svelte';
	import Policies from '$lib/components/blocks/Policies.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import Support from './Support.svelte';
	import Navigation from './Navigation.svelte';
	import ComingSoonChart from './ComingSoonChart.svelte';
	import RelatedRegions from './RelatedRegions.svelte';
	import Credits from './Credits.svelte';
	import Chart from '$lib/components/charts/index.svelte';
	import MapOverlay from './MapOverlay.svelte';

	export let data;

	// Track which charts have data available
	// undefined = not yet loaded, true = has data, false = no data
	let chartVisibility = {};

	function handleDataAvailable(chartId, event) {
		chartVisibility[chartId] = event.detail.hasData;
	}

	const coordinates = data.page?.center?.map((d) => parseFloat(d)).join(',') || [];

	onMount(() => {
		localStorage.setItem('kd_region_id', data.page.id);
		localStorage.setItem('kd_region_name', data.page.name);
		localStorage.setItem('kd_region_coordinates', coordinates);
	});

	let index, offset, progress;
	let mapOverlayOpen = false;

	$: currentSection = sections[index];

	$: {
		if (currentSection && browser) {
			// Update the URL hash without scrolling
			const url = new URL(window.location);
			url.hash = currentSection.id;
			history.replaceState(null, '', url.toString());
			sections.forEach((section) => (section.active = false));
			sections[index].active = true;
		}
	}

	$: sections = [
		{
			title: 'Emissionen',
			countries: ['at', 'de'],
			description: `Die Reduktion von Treibhausgasemissionen ist von entscheidender Bedeutung. Doch wie sieht es in deinem Bundesland aus? Erkunde, wie sich die Emissionen auf verschiedene Sektoren verteilen und wie sich diese über die letzten Jahre verändert haben.`,
			id: 'emissions',
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='1'  stroke-linecap='round'  stroke-linejoin='round'  class='w-5 h-5'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878' /></svg>",
			active: false,
			charts: [
				{
					id: 'cae6032b-86a9-45d0-bc11-17343845b25a',
					countries: ['at', 'de'],
					span: 6
				},
				{
					id: '19ad92e0-430d-4ba9-8009-f7add39c85bb',
					countries: ['at', 'de'],
					span: 6
				}
			]
		},
		{
			title: 'Energie',
			countries: ['de'],
			id: 'energy',
			description: `Erneuerbare Energien spielen eine zentrale Rolle für die Energiewende – doch wie weit ist der Ausbau vor Ort? Erkunde, wie viel Solar- und Windenergie in ${data.page.name} bereits installiert ist.`,
			active: false,
			charts: [
				{
					id: '4c15342e-c329-4ab2-9748-205f35613a7e',
					countries: ['at', 'de'],
					span: 6
				},
				{
					id: '5987865b-488b-44ed-87fe-b9fe54d965b8',
					countries: ['at', 'de'],
					span: 6
				},
				{
					id: 'ecb058fc-06c6-4092-b1a7-dccdf6736d46',
					countries: ['at', 'de'],
					span: 6
				},
				{
					id: '1e135ce2-06d2-4eae-b8f8-fdb4cbae910c',
					countries: ['at', 'de'],
					span: 6
				}
			],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='1'  stroke-linecap='round'  stroke-linejoin='round'  class='w-5 h-5 icons-tabler-outline icon-tabler-bolt'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11' /></svg>"
		},
		{
			title: 'Mobilität',
			id: 'mobility',
			description: `Der Verkehrsbereich verursacht einen großen Teil der Treibhausgasemissionen. Wie klimafreundlich Mobilität in ${data.page.name} ist, hängt unter anderem von Infrastruktur, Verkehrsangebot und Alltagsgewohnheiten ab – und hat direkten Einfluss auf das Klima.`,
			countries: ['at', 'de'],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='1'  stroke-linecap='round'  stroke-linejoin='round'  class='w-5 h-5 icons-tabler-outline icon-tabler-steering-wheel'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0' /><path d='M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0' /><path d='M12 14l0 7' /><path d='M10 12l-6.75 -2' /><path d='M14 12l6.75 -2' /></svg>",
			active: false,
			charts: [
				{
					id: '4895ac82-30f2-4afa-9fc5-76ef2c6eec55',
					countries: ['at', 'de'],
					span: 12
				},
				{
					id: '68b0f853-b1b1-4120-aedd-87de58ea3209',
					countries: ['at', 'de'],
					span: 6
				},
				{
					id: 'e8c13d08-089f-4782-844a-06b8f19e4d54',
					countries: ['at', 'de'],
					span: 6
				},
				{
					id: '1b519edc-a120-4519-a008-0e0cec99fe91',
					countries: ['at', 'de'],
					span: 6
				},
				{
					id: 'b3301d53-24e0-4171-be78-75882f602fe8',
					countries: ['at'],
					text: 'Wie ist deine Region an den Öffentlichen Verkehr angebunden? Wo sollten mehr Haltestellen errichtet werden? Dazu erfährst du hier bald mehr.',
					span: 12
				}
			]
		},
		{
			title: 'Heizungen',
			id: 'heating',
			description: '',
			countries: ['de'],
			active: false,
			charts: [
				{
					id: '8267b6b9-605d-4603-a8b4-4ad9e6a3c553',
					countries: ['de'],
					span: 12
				}
			],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='1'  stroke-linecap='round'  stroke-linejoin='round'  class='w-5 h-5 icons-tabler-outline icon-tabler-brand-walmart'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 8.04v-5.04' /><path d='M15.5 10l4.5 -2.5' /><path d='M15.5 14l4.5 2.5' /><path d='M12 15.96v5.04' /><path d='M8.5 14l-4.5 2.5' /><path d='M8.5 10l-4.5 -2.505' /></svg>"
		},
		{
			title: 'Temperatur',
			description: `Die Aufzeichnungen von Wetterstationen in deiner Nähe zeigen, wie sich die Temperaturen in der Region in den vergangenen Jahrzehnten entwickelt haben. Die Daten stammen von der geografisch nächstgelegenen Wetterstation für ${data.page.name} mit weitgehend vollständigen Aufzeichnungen seit 1960. Sie liegt nicht zwingend in der ausgewählten Region, erlaubt aber eine Einschätzung der regionalen Entwicklung.`,
			countries: ['at', 'de'],
			id: 'temperature',
			toggle: true,
			active: false,
			charts: [
				{
					id: '8378b7bc-10db-4373-9941-1ca014e70353',
					countries: ['at', 'de'],
					span: 12
				}
			],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='1'  stroke-linecap='round'  stroke-linejoin='round'  class='w-5 h-5 icons-tabler-outline icon-tabler-temperature'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M10 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 0 0 -4 0v8.5' /><path d='M10 9l4 0' /></svg>"
		},
		{
			title: 'Schnee',
			description: `Im Zusammenhang mit abnehmenden Frost- und Schneetagen lohnt auch ein Blick auf die Entwicklung der Tage, an denen mindestens 1 cm Schnee am Morgen gemessen wurde, den sogenannten Schneedeckentagen.`,
			id: 'snow',
			countries: ['at', 'de'],
			active: true,
			charts: [
				{
					id: 'd88601f8-40de-4753-beb1-a0e824aa048c',
					countries: ['at', 'de'],
					span: 12
				}
			],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='1'  stroke-linecap='round'  stroke-linejoin='round'  class='w-5 h-5 icons-tabler-outline icon-tabler-snowman'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 3a4 4 0 0 1 2.906 6.75a6 6 0 1 1 -5.81 0a4 4 0 0 1 2.904 -6.75z' /><path d='M17.5 11.5l2.5 -1.5' /><path d='M6.5 11.5l-2.5 -1.5' /><path d='M12 13h.01' /><path d='M12 16h.01' /></svg>"
		},
		{
			title: 'Klimazukunft',
			description: `Auf welche Veränderungen müssen wir uns in ${data.page.name} für die Zukunft einstellen? Klimaszenarien zeigen, welche Auswirkungen die globale Erwärmung in unserer Region hat.`,
			id: 'scenarios',
			countries: ['at'],
			active: false,
			charts: [
				{
					text: 'Wie viel heißer wird es bei mir vor Ort, wenn sich die Erde weiter erhitzt? Wo muss ich mit extremem Niederschlag rechnen? Die aktuellsten Klimaszenarien stehen in Kürze hier in einem interaktiven Explorer zu Verfügung.',
					countries: ['at'],
					span: 12
				}
			],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='1'  stroke-linecap='round'  stroke-linejoin='round'  class='w-5 h-5 icons-tabler-outline icon-tabler-circle-arrow-right'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18' /><path d='M16 12l-4 -4' /><path d='M16 12h-8' /><path d='M12 16l4 -4' /></svg>"
		},
		{
			title: 'Handlungen',
			id: 'actions',
			blocks: [Policies],
			icon: "<svg  xmlns='http://www.w3.org/2000/svg'  width='24'  height='24'  viewBox='0 0 24 24'  fill='none'  stroke='currentColor'  stroke-width='1'  stroke-linecap='round'  stroke-linejoin='round'  class='w-5 h-5 icons-tabler-outline icon-tabler-tool'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5' /></svg>"
		}
	];

	function handleChartClick(chartId) {
		goto(`/charts/${chartId}?region=${data.page.id}`);
	}
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
				<section id={section.id} class="mt-10 relative overflow-hidden">
					<div>
						<div class="p-4">
							{#if section.navigation !== false}
								<h2 class=" text-3xl text-center">{section.title}</h2>
								<p class="text-lg text-center max-w-2xl mx-auto mt-2 leading-snug text-balance">
									{section.description}
								</p>
							{/if}
						</div>

						{#if section.charts}
							<div class="grid md:grid-cols-12 gap-1 m-1">
								{#each section.charts.filter((c) => c.countries.includes(PUBLIC_VERSION)) as chart}
									{#if chart.id}
										{#if chartVisibility[chart.id] !== false}
											<Chart
												id={chart.id}
												span={chart.span || 12}
												type="card"
												on:dataAvailable={(e) => handleDataAvailable(chart.id, e)}
											/>
										{/if}
									{:else}
										<div class="" style="grid-column: span {chart.span || 12};">
											<ComingSoonChart text={chart.text} />
										</div>
									{/if}
								{/each}
							</div>
						{/if}

						{#if section.blocks}
							<div class="container space-y-4">
								{#each section.blocks as block}
									<svelte:component this={block} />
								{/each}
							</div>
						{/if}
					</div>
				</section>
			{/each}
		</div>
	</Scroller>

	<Credits />
	<RelatedRegions {data} />
</main>

<style>
</style>
