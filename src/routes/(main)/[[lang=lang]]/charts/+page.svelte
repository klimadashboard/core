<script>
	import { page } from '$app/stores';
	import dayjs from 'dayjs';

	export let data;

	$: langPrefix = $page.data.language?.code === 'de' ? '' : `/${$page.data.language?.code}`;
</script>

<div class="container my-12">
	<h1 class="text-3xl md:text-4xl font-bold mb-2">Charts</h1>
	<p class="text-gray-500 dark:text-gray-400 mb-8">
		{data.charts.length} Charts
	</p>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each data.charts as chart (chart.id)}
			{@const title = chart.translations?.[0]?.title || chart.id}
			{@const heading = chart.translations?.[0]?.heading}
			{@const updated = chart.date_updated}
			<a
				href="{langPrefix}/charts/{chart.id}"
				class="group relative flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 transition-all hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 hover:-translate-y-0.5"
			>
				<h2
					class="font-semibold text-gray-900 dark:text-white leading-snug group-hover:text-[#28A889] transition-colors"
				>
					{title}
				</h2>
				{#if heading}
					<p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
						{heading.replace(/<[^>]*>/g, '')}
					</p>
				{/if}
				{#if updated}
					<p class="mt-auto pt-3 text-xs text-gray-400 dark:text-gray-500">
						{dayjs(updated).format('DD.MM.YYYY')}
					</p>
				{/if}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					class="absolute top-5 right-5 text-gray-300 dark:text-gray-700 group-hover:text-[#28A889] transition-colors"
				>
					<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
				</svg>
			</a>
		{/each}
	</div>
</div>
