<script>
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import { onMount, tick } from 'svelte';
	import '@splidejs/svelte-splide/css/core';
	import StaticMap from './StaticMap.svelte';
	import getDirectusInstance from '@/lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import formatNumber from '$lib/stores/formatNumber';
	import { page } from '$app/state';
	import IntroPanel from './IntroPanel.svelte';
	import IntroIllustration from './IntroIllustration.svelte';

	export let data;

	let place = '';
	let panels = [];
	let mainSlider;

	let illustrations = [];
	let combinedSlides = new Array(10).fill({ type: 'loading' });

	onMount(async () => {
		place = data.page.name;

		const directus = getDirectusInstance();
		illustrations = await directus.request(
			readItems('illustrations', {
				fields: ['files.*', 'translations.*', 'attributes']
			})
		);
		illustrations = illustrations.filter((i) =>
			i.attributes.some((attr) => data.page.attributes.includes(attr))
		);

		const regionId = data.page.id;

		const res = await fetch(
			`https://base.klimadashboard.org/get-region-summary?region=${regionId}`
		);
		const result = await res.json();

		panels = result.panels;
		if (illustrations.length || panels.length) {
			const max = Math.max(illustrations.length, panels.length);
			combinedSlides = [];
			for (let i = 0; i < max; i++) {
				if (illustrations[i]) combinedSlides.push({ type: 'illustration', data: illustrations[i] });
				if (panels[i]) combinedSlides.push({ type: 'panel', data: panels[i] });
			}
		}
		combinedSlides = combinedSlides.splice(0, 9);
		await tick(); // Wait for DOM to reflect updated panels
		mainSlider.splide?.refresh(); // Now safe to refresh
	});
</script>

<Splide
	bind:this={mainSlider}
	hasTrack={false}
	options={{
		autoWidth: true,
		pagination: false
	}}
>
	<div class="flex justify-between items-end p-3">
		<h1 class="font-bold text-2xl md:text-4xl leading-tight">Klimadashboard {data.page.name}</h1>
		<div class="flex items-end">
			<div class="splide__arrows flex">
				<button class="splide__arrow splide__arrow--prev"
					><svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M15 6l-6 6l6 6" /></svg
					></button
				>
				<button class="splide__arrow splide__arrow--next"
					><svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right"
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 6l6 6l-6 6" /></svg
					></button
				>
			</div>
		</div>
	</div>

	<SplideTrack>
		<SplideSlide>
			<div class="reg-card sm:max-w-[60vw]! relative">
				{#if data.page.center}
					<StaticMap
						center={data.page.center}
						zoom={data.page.population > 100000 ? 11 : 14}
						outline={data.page.outline}
					/>
				{/if}
				<div
					class="-z-40 absolute bottom-0 w-full h-1/2 bg-gradient-to-b from-transparent to-white dark:to-gray-950"
				></div>
				<div class="p-4 flex flex-col h-full absolute bottom-0 left-0 right-0">
					<div class="mt-auto flex flex-col gap-4 md:flex-row md:justify-between">
						<div class="">
							<p class="text-xl font-bold max-w-md leading-tight">
								Das Klimadashboard {data.page.name} zeigt die Auswirkungen der Klimakrise in deiner Region
								und begleitet die Umsetzung der Energie- und Mobilitätswende und weitere Klimaschutzmaßnahmen
								bei dir vor Ort.
							</p>
							<div class="flex gap-2 mt-2 items-center flex-wrap leading-none">
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
										><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
											d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9z"
										/><path d="M5 21v-7" /></svg
									>
									<p>{page.data.page.layer_label}</p>
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
										><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
											d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
										/><path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1" /><path
											d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
										/><path d="M17 10h2a2 2 0 0 1 2 2v1" /><path
											d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
										/><path d="M3 13v-1a2 2 0 0 1 2 -2h2" /></svg
									>
									<p>{formatNumber(page.data.page.population)}</p>
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
										><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
											d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13"
										/>
										<path d="M9 4v13" /><path d="M15 7v13" />
									</svg>
									<p>{formatNumber(page.data.page.area)} km²</p>
								</div>

								{#if page.data.page.slug}
									<div>
										<a
											href="https://{page.url.host}/{page.data.page.slug.split(',')[0]}"
											target="_blank"
										>
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
												><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
													d="M9 15l6 -6"
												/><path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" /><path
													d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"
												/></svg
											>
											{page.url.host}/{page.data.page.slug.split(',')[0]}</a
										>
									</div>
								{/if}
							</div>
						</div>

						<div class="flex items-center gap-2">
							<p class="leading-none w-20 text-right">Scrollen für mehr Daten</p>

							<div class="w-10 h-10">
								<div class="mousey">
									<div class="scroller"></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</SplideSlide>
		{#each combinedSlides as item}
			{#if item.type === 'loading'}
				<SplideSlide>
					<div
						class="reg-card animate-pulse flex flex-col border-l border-white dark:border-dark-950 bg-gray-50 dark:bg-gray-900 space-y-2 p-4"
					>
						<div class="bg-current/80 w-24 h-4 rounded"></div>
						<div class="mt-auto bg-current/80 w-24 h-32 rounded"></div>
						<div class="bg-current/80 w-2/3 h-16 rounded"></div>
						<div class="bg-current/80 w-1/3 h-8 rounded"></div>
					</div>
				</SplideSlide>
			{:else if item.type === 'illustration'}
				<SplideSlide>
					<IntroIllustration data={item.data} />
				</SplideSlide>
			{:else if item.type === 'panel'}
				<SplideSlide>
					<IntroPanel data={item.data} />
				</SplideSlide>
			{/if}
		{/each}
	</SplideTrack>
</Splide>

<style>
	@reference "tailwindcss/theme";
	:global(.reg-card) {
		@apply w-[90vw] max-w-[50vh] h-[70vh] shrink-0;
	}

	.mousey {
		width: 3px;
		padding: 10% 30%;
		height: 100%;
		border: 2px solid currentColor;
		border-radius: 20px;
		opacity: 0.75;
		box-sizing: content-box;
	}
	.scroller {
		width: 3px;
		height: 10px;
		border-radius: 25%;
		background-color: currentColor;
		animation-name: scroll;
		animation-duration: 2.2s;
		animation-timing-function: cubic-bezier(0.15, 0.41, 0.69, 0.94);
		animation-iteration-count: infinite;
	}
	@keyframes scroll {
		0% {
			opacity: 0;
		}
		10% {
			transform: translateY(0);
			opacity: 1;
		}
		100% {
			transform: translateY(15px);
			opacity: 0;
		}
	}
</style>
