<script>
	import { onMount } from 'svelte';
	import Scroller from '@sveltejs/svelte-scroller';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import Intro from './Intro.svelte';
	import Policies from '$lib/components/blocks/Policies.svelte';
	import { PUBLIC_VERSION } from '$env/static/public';
	import Navigation from './Navigation.svelte';
	import RelatedRegions from './RelatedRegions.svelte';
	import Credits from './Credits.svelte';
	import Chart from '$lib/components/charts/index.svelte';
	import { serializeJsonLd } from '$lib/utils/jsonld';

	export let data;

	// Map block names to components
	const blockComponents = {
		policies: Policies
	};

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

	// Get sections from regionConfig, apply {regionName} placeholder
	$: sections = (data.regionConfig?.sections || []).map((section, i) => ({
		...section,
		description: section.description?.replace('{regionName}', data.page.name) || '',
		active: i === index
	}));

	$: currentSection = sections[index];

	$: {
		if (currentSection && browser) {
			// Update the URL hash without scrolling
			const url = new URL(window.location);
			url.hash = currentSection.id;
			history.replaceState(null, '', url.toString());
		}
	}

	// JSON-LD: Place schema for the region
	$: langPrefix = $page.data.language?.code === 'de' ? '' : `/${$page.data.language?.code}`;
	$: placeLD = {
		'@context': 'https://schema.org',
		'@type': 'Place',
		name: data.page.name,
		description: data.page.description || '',
		url: $page.url.href,
		...(data.page.center?.length === 2
			? {
					geo: {
						'@type': 'GeoCoordinates',
						latitude: parseFloat(data.page.center[1]),
						longitude: parseFloat(data.page.center[0])
					}
				}
			: {}),
		...(data.page.parents?.length
			? {
					containedInPlace: {
						'@type': 'Place',
						name: data.page.parents[0].name
					}
				}
			: {})
	};

	// JSON-LD: BreadcrumbList
	$: breadcrumbLD = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{
				'@type': 'ListItem',
				position: 1,
				name: 'Home',
				item: $page.url.origin + (langPrefix || '/')
			},
			{
				'@type': 'ListItem',
				position: 2,
				name: data.page.name
			}
		]
	};

	// JSON-LD: Dataset for each chart
	$: allCharts = (data.regionConfig?.sections || []).flatMap((s) => s.charts || []);
	$: datasetsLD =
		allCharts.length > 0
			? {
					'@context': 'https://schema.org',
					'@type': 'ItemList',
					name: `Klimadaten ${data.page.name}`,
					itemListElement: allCharts
						.map((c, i) => {
							const meta = data.chartSnapshots?.[c.id];
							if (!meta?.title) return null;
							return {
								'@type': 'ListItem',
								position: i + 1,
								item: {
									'@type': 'Dataset',
									name: meta.title,
									description: meta.heading
										? meta.heading.replace(/<[^>]*>/g, '')
										: meta.title,
									url: `${$page.url.origin}${langPrefix}/charts/${c.id}?region=${data.page.id}`,
									spatialCoverage: data.page.name,
									creator: {
										'@type': 'Organization',
										name: 'Klimadashboard'
									},
									license: 'https://creativecommons.org/licenses/by/4.0/'
								}
							};
						})
						.filter(Boolean)
				}
			: null;
</script>

<svelte:head>
	<title>Klimadashboard {data.page.name} | Klimadashboard.{PUBLIC_VERSION}</title>
	<meta name="description" content={data.page.description} />
	<meta property="og:title" content="Klimadashboard {data.page.name}" />
	<meta property="og:description" content={data.page.description} />
	{@html serializeJsonLd(placeLD)}
	{@html serializeJsonLd(breadcrumbLD)}
	{#if datasetsLD}
		{@html serializeJsonLd(datasetsLD)}
	{/if}
</svelte:head>

<main class="">
	<Scroller bind:index bind:offset bind:progress>
		<div slot="background" />
		<div slot="foreground">
			<Intro {data} />

			<Navigation {sections} />

			{#each sections as section}
				<section id={section.id} class="mt-10 relative overflow-hidden">
					<div>
						<div class="p-4">
							<h2 class="text-3xl text-center">{section.title}</h2>
							{#if section.description}
								<p class="text-lg text-center max-w-2xl mx-auto mt-2 leading-snug text-balance">
									{section.description}
								</p>
							{/if}
						</div>

						{#if section.charts && section.charts.length > 0}
							{@const visibleCharts = section.charts.filter((c) => chartVisibility[c.id] !== false)}
							{@const allChartsLoaded = section.charts.every(
								(c) => chartVisibility[c.id] !== undefined
							)}
							{@const allChartsHidden = allChartsLoaded && visibleCharts.length === 0}
							{#if allChartsHidden}
								<p class="text-sm text-gray-500 text-center py-8">
									{data.translations?.['status.noDataAvailable'] || 'Keine Daten verfügbar.'}
								</p>
							{:else}
								<div class="grid grid-cols-1 md:grid-cols-12 gap-1 m-1">
									{#each section.charts as chart}
										{#if chartVisibility[chart.id] !== false}
											<Chart
												id={chart.id}
												span={chart.span || 12}
												type="card"
												snapshot={data.chartSnapshots?.[chart.id]}
												on:dataAvailable={(e) => handleDataAvailable(chart.id, e)}
											/>
										{/if}
									{/each}
								</div>
							{/if}
						{/if}

						{#if section.block && blockComponents[section.block]}
							<div class="container space-y-4">
								<svelte:component this={blockComponents[section.block]} />
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
