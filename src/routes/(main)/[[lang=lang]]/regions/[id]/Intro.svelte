<script>
	import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
	import { Splide, SplideSlide, SplideTrack } from '@splidejs/svelte-splide';
	import { onMount, tick } from 'svelte';
	import '@splidejs/svelte-splide/css/core';
	import Time from './Time.svelte';
	import formatNumber from '$lib/stores/formatNumber';
	import { page } from '$app/state';

	export let data;

	let place = '';
	let panels = [];
	let intro = '';
	let loading = true;
	let mainSlider;

	onMount(async () => {
		place = data.page.name;

		const regionId = data.page.id;

		const res = await fetch(
			`https://base.klimadashboard.org/get-region-summary?region=${regionId}`
		);
		const result = await res.json();

		panels = result.panels;
		console.log(panels);
		intro = result.intro;
		await tick(); // Wait for DOM to reflect updated panels
		mainSlider.splide?.refresh(); // Now safe to refresh
		loading = false;
	});

	let chartWidth = 0;
	let chartHeight = 0;
	let staticMapUrl = '';
	let markerOffsetX = 0;
	let markerOffsetY = 0;

	$: getImage = () => {
		// Extract center coordinates and zoom level
		const centerLng = parseFloat(data.page.center[0]);
		const centerLat = parseFloat(data.page.center[1]);
		const zoom = 7; // Adjust zoom level as needed

		// Generate the Mapbox Static Image API URL
		staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${centerLng},${centerLat},${zoom}/${Math.round(chartWidth / 2)}x${Math.round(chartHeight / 2)}?access_token=${PUBLIC_MAPBOX_TOKEN}`;

		// Marker position relative to the map center
		markerOffsetX = chartWidth / 2; // Center of the image (X-axis)
		markerOffsetY = chartHeight / 2; // Center of the image (Y-axis)
	};

	$: if (chartWidth) {
		getImage();
	}
</script>

<Splide
	bind:this={mainSlider}
	hasTrack={false}
	options={{
		autoWidth: true
	}}
>
	<div class="flex justify-between items-end p-3">
		<h1 class="font-bold text-2xl md:text-4xl">Klimadashboard {data.page.name}</h1>
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
			<div
				class="reg-card sm:max-w-[60vw]! relative"
				bind:clientWidth={chartWidth}
				bind:clientHeight={chartHeight}
			>
				<img class="-z-50 absolute h-full w-full opacity-50" src={staticMapUrl} alt="Static Map" />
				<div class="marker" style="top: {markerOffsetY}px; left: {markerOffsetX}px;" />
				<div
					class="-z-40 absolute bottom-0 w-full h-1/2 bg-gradient-to-b from-transparent to-white dark:to-black"
				></div>
				<div class="p-4 flex flex-col h-full">
					<div class="mt-auto flex flex-col gap-4 md:flex-row md:justify-between">
						<div>
							<p class="text-xl font-bold max-w-md leading-snug">{intro}</p>
							<div class="flex gap-2 mt-2">
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
								<div>
									<p>{formatNumber(page.data.page.area)} km²</p>
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
											d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"
										/><path d="M12 12l-2 3" /><path d="M12 7v5" /></svg
									>
									<Time />
								</div>
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
		<SplideSlide>
			<div class="reg-card flex flex-col">
				<div class="relative flex-1 w-full">
					<div
						class="absolute top-2 left-3 -rotate-12 w-28 h-28 rounded-full grid place-items-center bg-white z-20 font-bold"
					>
						Preview
					</div>
					<img src="/images/image1.jpeg" class="absolute object-cover w-full h-full" alt="" />
					<img
						src="/images/image0.jpeg"
						class="absolute object-cover hover:opacity-0 transition w-full h-full"
						alt=""
					/>
				</div>
				<div class="p-4">
					Die Klimakrise führt in Städten zunehmend zu intensiveren und häufigeren Hitzewellen, da
					versiegelte Flächen und fehlende Begrünung die Temperaturen zusätzlich ansteigen lassen.
					Maßnahmen wie die Entsiegelung von Flächen, mehr Stadtgrün und kühlende Wasserelemente
					können helfen, urbane Hitzeinseln zu reduzieren und die Lebensqualität zu verbessern.
				</div>
			</div></SplideSlide
		>

		{#each panels as panel}
			<SplideSlide>
				<div
					class="reg-card flex flex-col p-4"
					style="background: {panel.colorBackground}; color: {panel.colorText}"
				>
					<h3 class="font-bold uppercase">{panel.title}</h3>

					<p class="text-6xl font-light mt-auto">{panel.number}</p>
					<p class="text-lg">{panel.unit} {panel.subtitle}</p>
					<ul class="mt-2">
						{#if panel.list}
							{#each panel.list as item}
								<li class="border-t py-1">{item.text}</li>
							{/each}
						{/if}
					</ul>
					<p class="text-sm opacity-80">
						{panel.source}
					</p>
				</div>
			</SplideSlide>
		{/each}
	</SplideTrack>
</Splide>

<style>
	@reference "tailwindcss/theme";
	.reg-card {
		@apply w-[90vw] max-w-[50vh] h-[70vh] shrink-0 border-t border-b border-r;
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

	.marker {
		position: absolute;
		width: 20px;
		height: 20px;
		background-color: green;
		border-radius: 50%;
		animation: pulse 2s infinite;
		transform: translate(-50%, -50%); /* Center the marker */
	}

	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.4);
		}
		70% {
			box-shadow: 0 0 0 20px rgba(0, 255, 0, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(0, 255, 0, 0);
		}
	}
</style>
