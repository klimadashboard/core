<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Chart from '$lib/components/charts/index.svelte';

	const bgColor = $page.url.searchParams.get('bgcolor');
	const showText = $page.url.searchParams.get('showtext');
	const isAuto = $page.url.searchParams.get('auto') === 'true';

	// Report height changes to parent window for auto-resizing embeds
	onMount(() => {
		if (!isAuto) return; // Only report height for auto-resize embeds

		let lastHeight = 0;

		function reportHeight() {
			// Get the actual content height
			const chartCard = document.querySelector('.chart-card');
			const height = chartCard
				? chartCard.getBoundingClientRect().height
				: Math.max(
						document.body.scrollHeight,
						document.body.offsetHeight,
						document.documentElement.scrollHeight
					);

			if (Math.abs(height - lastHeight) > 1 && height > 0) {
				lastHeight = height;
				window.parent.postMessage(
					{
						type: 'klimadashboard-resize',
						chartId: $page.data.id,
						height: Math.ceil(height)
					},
					'*'
				);
			}
		}

		// Report multiple times during initial load to catch content changes
		setTimeout(reportHeight, 100);
		setTimeout(reportHeight, 500);
		setTimeout(reportHeight, 1000);
		setTimeout(reportHeight, 2000);

		// Observe the chart card for size changes
		const observer = new ResizeObserver(reportHeight);
		observer.observe(document.body);

		// Also observe the chart card once it's available
		const checkForCard = setInterval(() => {
			const chartCard = document.querySelector('.chart-card');
			if (chartCard) {
				observer.observe(chartCard);
				clearInterval(checkForCard);
			}
		}, 100);

		// Watch for DOM mutations (new content added)
		const mutationObserver = new MutationObserver(reportHeight);
		mutationObserver.observe(document.body, { childList: true, subtree: true });

		// Listen for window resize
		window.addEventListener('resize', reportHeight);

		return () => {
			observer.disconnect();
			mutationObserver.disconnect();
			window.removeEventListener('resize', reportHeight);
			clearInterval(checkForCard);
		};
	});
</script>

<main style="background: #{bgColor}" class={isAuto ? 'w-full' : 'fixed-embed'}>
	<Chart id={$page.data.id} showText={showText == 'false' ? false : true} type="card" />
</main>

<style>
	.fixed-embed {
		height: 100vh;
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	.fixed-embed :global(.chart-card) {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	/* Content area scrolls */
	.fixed-embed :global(.chart-card > div:first-child) {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}

	/* Bottom bar stays fixed */
	.fixed-embed :global(.chart-card > div:last-child) {
		flex-shrink: 0;
	}
</style>
