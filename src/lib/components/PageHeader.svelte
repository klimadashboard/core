<script>
	import { page } from '$app/stores';
	import Search from './Search.svelte';
	import PopularPages from './PopularPages.svelte';
	import dayjs from 'dayjs';
	import RelativeTime from 'dayjs/plugin/relativeTime';

	dayjs.extend(RelativeTime);
	dayjs.locale('de-at');

	$: tags = $page.data.content.tags || [];
</script>

<div class="m-1 py-8 rounded-2xl">
	<div class="container">
		{#if $page.data.content}
			<!--
		<h1 class="font-bold tracking-wide uppercase">{$page.data.content.title}</h1>
		-->

			<h2 class="text-3xl md:text-5xl font-bold max-w-2xl text-balance">
				{$page.data.content.heading ? $page.data.content.heading : $page.data.content.title}
			</h2>
		{/if}

		<div class="opacity-80 mt-4 text-lg leading-snug max-w-xl text">
			<p>
				{#each tags as tag}
					{tag}
				{/each}
			</p>

			{#if $page.data.content?.description}
				<div class="mb-4 mt-2 saturate-0">
					{@html $page.data.content.description}
				</div>
			{/if}

			{#if $page.data.page?.date_updated && $page.data.page?.showUpdated}
				<p class="text-sm">
					{$page.data.translations.lastUpdated}
					<span class="underline underline-offset-2 decoration-gray-400 group relative">
						<span class="group-hover:hidden">
							{dayjs().to(dayjs($page.data.page.date_updated))}</span
						>
						<span class="hidden group-hover:inline"
							>{dayjs($page.data.page.date_updated).format('DD.MM.YYYY HH:m')}</span
						></span
					>.
				</p>
			{/if}
		</div>

		{#if $page.params.slug == ''}
			<Search />
			<PopularPages />
		{/if}
	</div>
</div>
