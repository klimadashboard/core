<script>
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import { onMount, tick } from 'svelte';
	import '@splidejs/svelte-splide/css/core';
	import MapOverlay from './MapOverlay.svelte';
	import getDirectusInstance from '@/lib/utils/directus';
	import { readItems } from '@directus/sdk';
	import { page } from '$app/stores';
	import IntroPanel from './IntroPanel.svelte';
	import IntroIllustration from './IntroIllustration.svelte';
	import IntroWelcome from './IntroWelcome.svelte';
	import IntroMapCard from './IntroMapCard.svelte';

	export let data;

	$: regionConfig = data.regionConfig;
	$: introText = regionConfig.intro_text.replace('{regionName}', data.page.name);

	let panels = [];
	let illustrationsSlider;
	let statisticsSliderTop;
	let statisticsSliderBottom;
	let mobileSlider;

	function handleSliderClick(event, slider) {
		if (!slider?.splide) return;
		const rect = event.currentTarget.getBoundingClientRect();
		const clickX = event.clientX - rect.left;
		if (clickX < rect.width * 0.2) {
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
		const res = await fetch(
			`https://base.klimadashboard.org/get-region-summary?region=${data.page.id}&lang=${lang}`
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

	$: currentLang = $page.data?.language?.code || 'de';
	$: if (mounted) {
		fetchPanels(currentLang).then(async (result) => {
			panels = result;
			await updateCombinedSlides();
		});
	}

	onMount(async () => {
		const directus = getDirectusInstance();
		illustrations = await directus.request(
			readItems('illustrations', {
				fields: ['files.*', 'translations.*', 'attributes']
			})
		);
		illustrations = illustrations.filter((i) =>
			i.attributes.some((attr) => data.page.attributes.includes(attr))
		);

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

	function handleScrollToChart(event) {
		showMapOverlay = false;
		setTimeout(() => {
			const chartElement = document.querySelector(`[data-chart-id="${event.detail.chartId}"]`);
			if (chartElement) {
				chartElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
				chartElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
				setTimeout(() => {
					chartElement.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
				}, 2000);
			}
		}, 400);
	}

	const desktopSliderOptions = {
		type: 'loop',
		height: '100%',
		autoplay: true,
		pagination: true,
		arrows: false,
		pauseOnHover: true
	};
</script>

<!-- Desktop Layout -->
<div class="hidden lg:grid lg:grid-cols-4 lg:grid-rows-2 gap-1 p-1">
	<IntroWelcome name={data.page.name} {introText} outline={data.page.outline} isDesktop />

	<!-- Statistics Slider Top -->
	<div
		class="reg-card-quarter rounded-xl overflow-hidden relative cursor-pointer"
		on:click={(e) => handleSliderClick(e, statisticsSliderTop)}
	>
		{#if panels.slice(0, Math.ceil(panels.length / 2)).length > 0}
			<Splide
				bind:this={statisticsSliderTop}
				hasTrack={false}
				class="splide--desktop"
				options={{ ...desktopSliderOptions, interval: 7000 }}
			>
				<SplideTrack class="h-full">
					{#each panels.slice(0, Math.ceil(panels.length / 2)) as panel}
						<SplideSlide class="h-full"><IntroPanel data={panel} /></SplideSlide>
					{/each}
				</SplideTrack>
				<div class="splide__pagination splide__pagination--custom"></div>
			</Splide>
		{/if}
	</div>

	<!-- Illustrations Slider -->
	<div class="reg-card-half rounded-xl overflow-hidden relative row-span-2">
		{#if illustrations.length > 0}
			<Splide
				bind:this={illustrationsSlider}
				hasTrack={false}
				class="splide--desktop"
				options={{ ...desktopSliderOptions, interval: 7500 }}
			>
				<SplideTrack class="h-full">
					{#each illustrations as illustration}
						<SplideSlide class="h-full">
							<IntroIllustration
								data={illustration}
								howWouldItBeBetterLabel={regionConfig.how_would_it_be_better_label}
							/>
						</SplideSlide>
					{/each}
				</SplideTrack>
				<div class="splide__pagination splide__pagination--custom"></div>
			</Splide>
		{/if}
	</div>

	<IntroMapCard
		center={data.page.center}
		population={data.page.population}
		outline={data.page.outline}
		exploreMapLabel={regionConfig.explore_map_label}
		isDesktop
		on:openMap={openMapOverlay}
	/>

	<!-- Statistics Slider Bottom -->
	<div
		class="reg-card-quarter rounded-xl overflow-hidden relative cursor-pointer"
		on:click={(e) => handleSliderClick(e, statisticsSliderBottom)}
	>
		{#if panels.slice(Math.ceil(panels.length / 2)).length > 0}
			<Splide
				bind:this={statisticsSliderBottom}
				hasTrack={false}
				class="splide--desktop"
				options={{ ...desktopSliderOptions, interval: 7200 }}
			>
				<SplideTrack class="h-full">
					{#each panels.slice(Math.ceil(panels.length / 2)) as panel}
						<SplideSlide class="h-full"><IntroPanel data={panel} /></SplideSlide>
					{/each}
				</SplideTrack>
				<div class="splide__pagination splide__pagination--custom"></div>
			</Splide>
		{/if}
	</div>
</div>

<!-- Mobile Layout -->
<div class="lg:hidden">
	<Splide
		bind:this={mobileSlider}
		hasTrack={false}
		options={{ autoWidth: true, pagination: true, arrows: false }}
	>
		<SplideTrack>
			<SplideSlide>
				<IntroWelcome name={data.page.name} {introText} outline={data.page.outline} />
			</SplideSlide>

			{#if illustrations[0]}
				<SplideSlide>
					<div class="reg-card rounded-xl overflow-hidden">
						<IntroIllustration
							data={illustrations[0]}
							howWouldItBeBetterLabel={regionConfig.how_would_it_be_better_label}
						/>
					</div>
				</SplideSlide>
			{/if}

			{#if panels[0]}
				<SplideSlide>
					<div class="reg-card rounded-xl overflow-hidden">
						<IntroPanel data={panels[0]} />
					</div>
				</SplideSlide>
			{/if}

			<SplideSlide>
				<IntroMapCard
					center={data.page.center}
					population={data.page.population}
					outline={data.page.outline}
					exploreMapLabel={regionConfig.explore_map_label}
					on:openMap={openMapOverlay}
				/>
			</SplideSlide>

			{#each combinedSlides.slice(2) as item}
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
						<div class="reg-card rounded-xl overflow-hidden">
							<IntroIllustration
								data={item.data}
								howWouldItBeBetterLabel={regionConfig.how_would_it_be_better_label}
							/>
						</div>
					</SplideSlide>
				{:else if item.type === 'panel'}
					<SplideSlide>
						<div class="reg-card rounded-xl overflow-hidden">
							<IntroPanel data={item.data} />
						</div>
					</SplideSlide>
				{/if}
			{/each}
		</SplideTrack>
		<div class="splide__pagination px-3 pb-3"></div>
	</Splide>
</div>

{#if showMapOverlay}
	<MapOverlay
		regionId={data.page.id}
		regionName={data.page.name}
		regionCode={data.page.code}
		regionCodeShort={data.page.code_short}
		regionLayer={data.page.layer}
		on:close={closeMapOverlay}
		on:scrollToChart={handleScrollToChart}
	/>
{/if}

<style>
	@reference "tailwindcss/theme";

	:global(.reg-card) {
		@apply w-[90vw] max-w-[50vh] h-[70vh] shrink-0;
	}

	@media (min-width: 1024px) {
		:global(.reg-card),
		:global(.reg-card-half) {
			@apply w-full max-w-full h-[60vh];
		}
		:global(.reg-card-quarter) {
			@apply w-full max-w-full h-[calc(30vh-0.125rem)];
		}
	}

	:global(.splide--desktop),
	:global(.splide--desktop .splide__track),
	:global(.splide--desktop .splide__list),
	:global(.splide--desktop .splide__slide) {
		height: 100%;
	}

	:global(.splide__pagination--custom) {
		position: absolute;
		right: 1rem;
		bottom: 0;
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

	:global(.splide__pagination--custom .splide__pagination__page.is-active) {
		background: rgba(255, 255, 255, 1);
		width: 24px;
		border-radius: 4px;
	}

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
</style>
