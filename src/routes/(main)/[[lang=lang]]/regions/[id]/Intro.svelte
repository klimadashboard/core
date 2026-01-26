<script>
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import { onMount, tick } from 'svelte';
	import '@splidejs/svelte-splide/css/core';
	import StaticMap from './StaticMap.svelte';
	import MapOverlay from './MapOverlay.svelte';
	import getDirectusInstance from '@/lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import formatNumber from '$lib/stores/formatNumber';
	import { page } from '$app/stores';
	import IntroPanel from './IntroPanel.svelte';
	import IntroIllustration from './IntroIllustration.svelte';
	import RegionOutline from './RegionOutline.svelte';

	export let data;

	// Region config with translated labels
	$: regionConfig = data.regionConfig;

	let place = '';
	let panels = [];
	let illustrationsSlider;
	let statisticsSliderTop;
	let statisticsSliderBottom;
	let mobileSlider;

	function handleSliderClick(event, slider) {
		if (!slider?.splide) return;
		const rect = event.currentTarget.getBoundingClientRect();
		const clickX = event.clientX - rect.left;
		const width = rect.width;

		if (clickX < width * 0.2) {
			slider.splide.go('<');
		} else {
			slider.splide.go('>');
		}
	}

	let illustrations = [];
	let combinedSlides = new Array(10).fill({ type: 'loading' });
	let showMapOverlay = false;
	let mounted = false;

	async function fetchPanels(lang) {
		const regionId = data.page.id;
		const res = await fetch(
			`https://base.klimadashboard.org/get-region-summary?region=${regionId}&lang=${lang}`
		);
		const result = await res.json();
		return result.panels;
	}

	async function updateCombinedSlides() {
		if (illustrations.length || panels.length) {
			const max = Math.max(illustrations.length, panels.length);
			let newSlides = [];
			for (let i = 0; i < max; i++) {
				if (illustrations[i]) newSlides.push({ type: 'illustration', data: illustrations[i] });
				if (panels[i]) newSlides.push({ type: 'panel', data: panels[i] });
			}
			combinedSlides = newSlides.slice(0, 9);
		}
		await tick();
		illustrationsSlider?.splide?.refresh();
		statisticsSliderTop?.splide?.refresh();
		statisticsSliderBottom?.splide?.refresh();
		mobileSlider?.splide?.refresh();
	}

	// Reactive: refetch panels when language changes
	$: currentLang = $page.data?.language?.code || 'de';
	$: if (mounted) {
		fetchPanels(currentLang).then(async (result) => {
			panels = result;
			await updateCombinedSlides();
		});
	}

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

		// Initial fetch
		panels = await fetchPanels($page.data?.language?.code || 'de');
		await updateCombinedSlides();
		mounted = true;
	});

	function openMapOverlay() {
		showMapOverlay = true;
	}

	function closeMapOverlay() {
		showMapOverlay = false;
	}
</script>

<!-- Desktop Layout: 4 Columns, 2 Rows -->
<div class="hidden lg:grid lg:grid-cols-4 lg:grid-rows-2 gap-1 p-1">
	<!-- Column 1: Welcome (spans both rows) -->
	<div
		class="reg-card-half rounded-xl overflow-hidden relative bg-gradient-green text-black/90 row-span-2"
	>
		<div class="p-4 flex flex-col h-full relative z-10">
			<h1 class="font-bold text-2xl xl:text-5xl leading-none mb-4">
				Klimadashboard {data.page.name}
			</h1>
			<p class="text-base xl:text-lg leading-snug mb-auto">
				{regionConfig.intro_text.replace('{regionName}', data.page.name)}
			</p>
			{#if data.page.outline}
				<RegionOutline outline={data.page.outline} />
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
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
							d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9z"
						/><path d="M5 21v-7" /></svg
					>
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
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
							d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
						/><path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1" /><path
							d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
						/><path d="M17 10h2a2 2 0 0 1 2 2v1" /><path
							d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
						/><path d="M3 13v-1a2 2 0 0 1 2 -2h2" /></svg
					>
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
						><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
							d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13"
						/>
						<path d="M9 4v13" /><path d="M15 7v13" />
					</svg>
					<p>{formatNumber($page.data.page.area)} km²</p>
				</div>

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
								><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 15l6 -6" /><path
									d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464"
								/><path
									d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"
								/></svg
							>
							{$page.url.host}/{$page.data.page.slug.split(',')[0]}</a
						>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Column 2: Statistics Slider (top half) -->
	<div
		class="reg-card-quarter rounded-xl overflow-hidden relative cursor-pointer"
		on:click={(e) => handleSliderClick(e, statisticsSliderTop)}
	>
		{#if panels.slice(0, Math.ceil(panels.length / 2)).length > 0}
			<Splide
				bind:this={statisticsSliderTop}
				hasTrack={false}
				class="splide--desktop"
				options={{
					type: 'loop',
					height: '100%',
					autoplay: true,
					interval: 7000,
					pagination: true,
					arrows: false,
					pauseOnHover: true
				}}
			>
				<SplideTrack class="h-full">
					{#each panels.slice(0, Math.ceil(panels.length / 2)) as panel}
						<SplideSlide class="h-full">
							<IntroPanel data={panel} />
						</SplideSlide>
					{/each}
				</SplideTrack>
				<div class="splide__pagination splide__pagination--custom"></div>
			</Splide>
		{/if}
	</div>

	<!-- Column 3: Illustrations Slider (spans both rows) -->
	<div class="reg-card-half rounded-xl overflow-hidden relative row-span-2">
		{#if illustrations.length > 0}
			<Splide
				bind:this={illustrationsSlider}
				hasTrack={false}
				class="splide--desktop"
				options={{
					type: 'loop',
					height: '100%',
					autoplay: true,
					interval: 7500,
					pagination: true,
					arrows: false,
					pauseOnHover: true
				}}
			>
				<SplideTrack class="h-full">
					{#each illustrations as illustration}
						<SplideSlide class="h-full">
							<IntroIllustration data={illustration} howWouldItBeBetterLabel={regionConfig.how_would_it_be_better_label} />
						</SplideSlide>
					{/each}
				</SplideTrack>
				<div class="splide__pagination splide__pagination--custom"></div>
			</Splide>
		{/if}
	</div>

	<!-- Column 4: Map (spans both rows) -->
	<div
		class="reg-card-half rounded-xl overflow-hidden relative cursor-pointer border border-current/10 row-span-2"
		on:click={openMapOverlay}
	>
		{#if data.page.center}
			<StaticMap
				center={data.page.center}
				zoom={data.page.population > 100000 ? 11 : 14}
				outline={data.page.outline}
			/>
		{/if}
		<div
			class="-z-40 absolute bottom-0 w-full h-1/3 bg-gradient-to-b from-transparent to-white dark:to-gray-950"
		></div>
		<div class="p-4 flex flex-col h-full absolute bottom-0 left-0 right-0 pointer-events-none">
			<div class="mt-auto">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="currentColor"
					class="inline -translate-y-0.5"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
						d="M8.887 6.748c-.163 0 -.337 .016 -.506 .057c-.172 .041 -.582 .165 -.838 .562l-.014 .02l-.607 1.05c-.307 .205 -.534 .46 -.693 .717l-.014 .02l-2.572 4.65a4.009 4.009 0 0 0 -.274 .494l-.006 .01a3.99 3.99 0 0 0 -.363 1.672a4 4 0 0 0 8 0v-1h2v1a4 4 0 1 0 7.635 -1.67l-.004 -.012a4.008 4.008 0 0 0 -.274 -.494l-2.572 -4.65l-.014 -.02a2.337 2.337 0 0 0 -.693 -.716l-.607 -1.051l-.014 -.02c-.256 -.397 -.667 -.52 -.838 -.562a2.225 2.225 0 0 0 -.664 -.051a2.06 2.06 0 0 0 -.68 .156c-.184 .081 -.638 .327 -.754 .889l-.007 .037l-.14 1.1c-.22 .283 -.374 .64 -.374 1.064v1h-2v-1c0 -.424 -.154 -.781 -.373 -1.064l-.14 -1.1l-.008 -.037c-.116 -.562 -.57 -.808 -.754 -.889a2.06 2.06 0 0 0 -.68 -.156a2.374 2.374 0 0 0 -.158 -.006zm-1.887 7.252a2 2 0 1 1 -1.838 1.209l.19 -.342c.36 -.523 .964 -.867 1.648 -.867zm10 0c.684 0 1.288 .344 1.648 .867l.19 .342a2 2 0 1 1 -1.838 -1.209z"
					/></svg
				>
				<span class="text-lg font-bold leading-tight">{regionConfig.explore_map_label}</span>
			</div>
		</div>
	</div>

	<!-- Row 2: Statistics Slider (bottom half) -->
	<div
		class="reg-card-quarter rounded-xl overflow-hidden relative cursor-pointer"
		on:click={(e) => handleSliderClick(e, statisticsSliderBottom)}
	>
		{#if panels.slice(Math.ceil(panels.length / 2)).length > 0}
			<Splide
				bind:this={statisticsSliderBottom}
				hasTrack={false}
				class="splide--desktop"
				options={{
					type: 'loop',
					height: '100%',
					autoplay: true,
					interval: 7200,
					pagination: true,
					arrows: false,
					pauseOnHover: true
				}}
			>
				<SplideTrack class="h-full">
					{#each panels.slice(Math.ceil(panels.length / 2)) as panel}
						<SplideSlide class="h-full">
							<IntroPanel data={panel} />
						</SplideSlide>
					{/each}
				</SplideTrack>
				<div class="splide__pagination splide__pagination--custom"></div>
			</Splide>
		{/if}
	</div>
</div>

<!-- Mobile Layout: Single Slider -->
<div class="lg:hidden">
	<Splide
		bind:this={mobileSlider}
		hasTrack={false}
		options={{
			autoWidth: true,
			pagination: true,
			arrows: true
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
				<div class="reg-card rounded-xl sm:max-w-[60vw]! relative overflow-hidden">
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
								{regionConfig.intro_text.replace('{regionName}', data.page.name)}
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
											><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
												d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
											/><path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1" /><path
												d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
											/><path d="M17 10h2a2 2 0 0 1 2 2v1" /><path
												d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"
											/><path d="M3 13v-1a2 2 0 0 1 2 -2h2" /></svg
										>
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
											><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
												d="M3 7l6 -3l6 3l6 -3v13l-6 3l-6 -3l-6 3v-13"
											/>
											<path d="M9 4v13" /><path d="M15 7v13" />
										</svg>
										<p>{formatNumber($page.data.page.area)} km²</p>
									</div>

									{#if $page.data.page.slug}
										<div>
											<a
												href="https://{$page.url.host}/{$page.data.page.slug.split(',')[0]}"
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
												{$page.url.host}/{$page.data.page.slug.split(',')[0]}</a
											>
										</div>
									{/if}
								</div>
							</div>

							<div class="flex items-center gap-2">
								<p class="leading-none w-20 text-right">{regionConfig.scroll_for_more_label}</p>

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
							class="reg-card rounded-xl animate-pulse flex flex-col border-l border-white dark:border-dark-950 bg-gray-50 dark:bg-gray-900 space-y-2 p-4"
						>
							<div class="bg-current/80 w-24 h-4 rounded"></div>
							<div class="mt-auto bg-current/80 w-24 h-32 rounded"></div>
							<div class="bg-current/80 w-2/3 h-16 rounded"></div>
							<div class="bg-current/80 w-1/3 h-8 rounded"></div>
						</div>
					</SplideSlide>
				{:else if item.type === 'illustration'}
					<SplideSlide>
						<div class="rounded-xl overflow-hidden">
							<IntroIllustration data={item.data} howWouldItBeBetterLabel={regionConfig.how_would_it_be_better_label} />
						</div>
					</SplideSlide>
				{:else if item.type === 'panel'}
					<SplideSlide>
						<div class="rounded-xl overflow-hidden">
							<IntroPanel data={item.data} />
						</div>
					</SplideSlide>
				{/if}
			{/each}
		</SplideTrack>
		<div class="splide__pagination px-3 pb-3"></div>
	</Splide>
</div>

<!-- Map Overlay -->
{#if showMapOverlay}
	<MapOverlay regionId={data.page.id} regionName={data.page.name} on:close={closeMapOverlay} />
{/if}

<style>
	@reference "tailwindcss/theme";
	:global(.reg-card) {
		@apply w-[90vw] max-w-[50vh] h-[70vh] shrink-0;
	}

	@media (min-width: 1024px) {
		:global(.reg-card) {
			@apply w-full max-w-full h-[60vh];
		}
		:global(.reg-card-half) {
			@apply w-full max-w-full h-[60vh];
		}
		:global(.reg-card-quarter) {
			@apply w-full max-w-full h-[calc(30vh-0.125rem)];
		}
	}

	/* Desktop sliders - ensure they take full height */
	:global(.splide--desktop) {
		height: 100%;
	}

	:global(.splide--desktop .splide__track) {
		height: 100%;
	}

	:global(.splide--desktop .splide__list) {
		height: 100%;
	}

	:global(.splide--desktop .splide__slide) {
		height: 100%;
	}

	/* Pagination positioning for desktop custom sliders - bottom right */
	:global(.splide__pagination--custom) {
		position: absolute;
		right: 1rem;
		bottom: 0rem;
		display: flex;
		gap: 0.5rem;
		width: auto;
		padding: 0;
	}

	:global(.splide__pagination--custom .splide__pagination__page) {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.5);
		border: none;
		padding: 0;
		margin: 0;
		transition: all 0.3s;
		cursor: pointer;
	}

	:global(.dark .splide__pagination--custom .splide__pagination__page) {
		background: rgba(255, 255, 255, 0.5);
	}

	:global(.splide__pagination--custom .splide__pagination__page.is-active) {
		background: rgba(255, 255, 255, 1);
		width: 24px;
		border-radius: 4px;
	}

	:global(.dark .splide__pagination--custom .splide__pagination__page.is-active) {
		background: rgba(255, 255, 255, 1);
	}

	/* Mobile pagination styling */
	:global(.splide__pagination) {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem 0;
	}

	:global(.splide__pagination__page) {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.3);
		border: none;
		padding: 0;
		transition: all 0.3s;
		cursor: pointer;
	}

	:global(.dark .splide__pagination__page) {
		background: rgba(255, 255, 255, 0.3);
	}

	:global(.splide__pagination__page.is-active) {
		background: rgba(0, 0, 0, 0.8);
		width: 24px;
		border-radius: 4px;
	}

	:global(.dark .splide__pagination__page.is-active) {
		background: rgba(255, 255, 255, 0.9);
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
