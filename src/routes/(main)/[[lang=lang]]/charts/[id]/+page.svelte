<script>
	/** @type {import('./$types').PageData} */
	import { page } from '$app/stores';
	import Chart from '$lib/components/charts/index.svelte';
	import { serializeJsonLd } from '$lib/utils/jsonld';
	export let data;

	$: langPrefix = $page.data.language?.code === 'de' ? '' : `/${$page.data.language?.code}`;

	$: datasetLD = {
		'@context': 'https://schema.org',
		'@type': 'Dataset',
		name: data.content.title,
		description: data.content.description || '',
		url: $page.url.href,
		...(data.date_updated ? { dateModified: data.date_updated } : {}),
		inLanguage: $page.data.language?.code || 'de',
		creator: {
			'@type': 'Organization',
			name: 'Klimadashboard'
		},
		license: 'https://creativecommons.org/licenses/by/4.0/'
	};

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
				name: 'Charts',
				item: `${$page.url.origin}${langPrefix}/charts`
			},
			{
				'@type': 'ListItem',
				position: 3,
				name: data.content.title
			}
		]
	};
</script>

<svelte:head>
	{@html serializeJsonLd(datasetLD)}
	{@html serializeJsonLd(breadcrumbLD)}
</svelte:head>

<div>
	<div class="container my-16">
		<nav aria-label="Breadcrumb" class="text-sm text-gray-500 dark:text-gray-400 mb-6">
			<ol class="flex items-center gap-1.5">
				<li><a href="{langPrefix || '/'}" class="hover:text-gray-700 dark:hover:text-gray-200">Home</a></li>
				<li aria-hidden="true">/</li>
				<li><a href="{langPrefix}/charts" class="hover:text-gray-700 dark:hover:text-gray-200">Charts</a></li>
				<li aria-hidden="true">/</li>
				<li aria-current="page" class="text-gray-700 dark:text-gray-200">{data.content.title}</li>
			</ol>
		</nav>

		<Chart id={data.id} type="card" expandContent={true} snapshot={data.chartSnapshot} />
	</div>
</div>
