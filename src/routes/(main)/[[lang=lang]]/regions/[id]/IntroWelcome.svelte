<script>
	import { page } from '$app/stores';
	import formatNumber from '$lib/stores/formatNumber';
	import { getRegion } from '@/lib/utils/getRegion';
	import RegionOutline from './RegionOutline.svelte';

	export let name;
	export let introText;
	export let outline = null;
	export let isDesktop = false;

	$: parentStatePromise = (async () => {
		const parents = $page.data?.page?.parents;
		if (!parents) return null;
		const stateParent = parents.find((d) => d.layer === 'state');
		if (!stateParent?.id) return null;
		return getRegion(stateParent.id);
	})();
</script>

<div
	class="rounded-xl overflow-hidden relative bg-gradient-to-tr from-[#006E54] to-[#004636] text-white h-full"
	class:reg-card={!isDesktop}
	class:reg-card-half={isDesktop}
	class:row-span-2={isDesktop}
>
	<div class="p-4 flex flex-col h-full relative z-10">
		<h1 class="font-bold leading-none mb-4 hyphens-auto text-3xl md:text-4xl">
			Klimadashboard {name}
		</h1>
		<p class="leading-snug mb-auto" class:text-base={true} class:xl:text-lg={isDesktop}>
			{introText}
		</p>
		{#if outline}
			<RegionOutline {outline} />
		{/if}
		<div class="flex gap-2 mt-4 items-center flex-wrap leading-none text-sm">
			<div class="flex items-center gap-0.5">
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
					class="w-4 h-4"
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9z" />
					<path d="M5 21v-7" />
				</svg>
				<p>{$page.data.page.layer_label}</p>
			</div>
			<div class="flex items-center gap-1">
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
					class="w-4 h-4"
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
					<path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1" />
					<path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
					<path d="M17 10h2a2 2 0 0 1 2 2v1" />
					<path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
					<path d="M3 13v-1a2 2 0 0 1 2 -2h2" />
				</svg>
				<p>{formatNumber($page.data.page.population)}</p>
			</div>
			<div class="flex items-center gap-0.5">
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
					class="w-4 h-4"
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13" />
					<path d="M9 4v13" />
					<path d="M15 7v13" />
				</svg>
				<p>{formatNumber($page.data.page.area)} km²</p>
			</div>
			{#await parentStatePromise then parentState}
				{#if parentState?.name}
					<div class="flex gap-1">
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
							class="w-4 h-4"
							><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
								d="M12 18.5l-3 -1.5l-6 3v-13l6 -3l6 3l6 -3v8.5"
							/><path d="M9 4v13" /><path d="M15 7v7.5" /><path d="M19 22v-6" /><path
								d="M22 19l-3 -3l-3 3"
							/></svg
						>
						<span>{parentState.name}</span>
					</div>
				{/if}
			{/await}
			{#if $page.data.page.slug}
				<div>
					<a href="https://{$page.url.host}/{$page.data.page.slug.split(',')[0]}" target="_blank">
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
							class="inline w-4 h-4"
						>
							<path stroke="none" d="M0 0h24v24H0z" fill="none" />
							<path d="M9 15l6 -6" />
							<path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" />
							<path
								d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"
							/>
						</svg>
						{$page.url.host}/{$page.data.page.slug.split(',')[0]}
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>
