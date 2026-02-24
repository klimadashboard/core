<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import Chart from '$lib/components/charts/index.svelte';

	export let chartId;
	export let span = 12;
	export let mapLayerId = null;
	export let regionId;

	const dispatch = createEventDispatcher();

	let cardElement;
	let isVisible = false;
	let isLoading = true;

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !isVisible) {
						isVisible = true;
						observer.unobserve(entry.target);

						// Hide skeleton after a short delay to let chart render
						setTimeout(() => {
							isLoading = false;
						}, 800);
					}
				});
			},
			{
				rootMargin: '100px',
				threshold: 0.01
			}
		);

		if (cardElement) {
			observer.observe(cardElement);
		}

		return () => {
			if (cardElement) {
				observer.unobserve(cardElement);
			}
		};
	});

	function handleCardClick(e) {
		// Don't navigate if clicking the map button
		if (e.target.closest('.map-button')) {
			return;
		}
		dispatch('click');
	}

	function handleMapClick(e) {
		e.stopPropagation();
		dispatch('openMap');
	}
</script>

<div
	bind:this={cardElement}
	class="chart-card group relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer"
	style="grid-column: span {span}; --span: {span};"
	on:click={handleCardClick}
	on:keydown={(e) => e.key === 'Enter' && handleCardClick(e)}
	role="button"
	tabindex="0"
>
	{#if isVisible}
		<div class="p-4 min-h-[300px] relative" in:fade={{ duration: 300 }}>
			<!-- Skeleton Loader -->
			{#if isLoading}
				<div class="skeleton-loader absolute inset-0 p-4" transition:fade={{ duration: 200 }}>
					<div class="skeleton-title h-6 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-4"></div>
					<div class="skeleton-content h-48 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
					<div class="skeleton-footer h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
				</div>
			{/if}

			<!-- Chart Component -->
			<div class:opacity-0={isLoading} class="transition-opacity duration-300">
				<Chart id={chartId} hideWrapper />
			</div>

			<!-- Hover Overlay -->
			<div
				class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
			></div>

			<!-- Map -->
			{#if mapLayerId}
				<button
					class="map-button absolute bottom-2 right-2 z-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100"
					on:click={handleMapClick}
					aria-label="Auf Karte anzeigen"
					title="Auf Karte anzeigen"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
						<path d="M9 3v15" />
						<path d="M15 6v15" />
					</svg>
				</button>
			{/if}

			<!-- View Details Indicator -->
			<div
				class="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-gray-600 dark:text-gray-400"
				>
					<path d="M5 12h14" />
					<path d="M12 5l7 7-7 7" />
				</svg>
			</div>
		</div>
	{:else}
		<!-- Placeholder before intersection -->
		<div class="p-4 min-h-[300px] bg-gray-50 dark:bg-gray-900"></div>
	{/if}
</div>

<style>
	.chart-card {
		min-height: 300px;
	}

	.skeleton-title,
	.skeleton-content,
	.skeleton-footer {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.chart-card:hover {
		transform: translateY(-2px);
	}

	@media (max-width: 768px) {
		.map-button {
			opacity: 1 !important;
		}
	}
</style>
