<script>
	import { onMount, onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';
	import Chart from '$lib/components/charts/index.svelte';

	export let id;

	let visible = false;
	let observer;
	let el;

	function observe() {
		if (observer) return;

		observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					visible = true;
					observer.disconnect();
					observer = null;
				}
			},
			{
				rootMargin: '200px',
				threshold: 0.1
			}
		);

		observer.observe(el);
	}

	onMount(() => {
		observe();
	});

	onDestroy(() => {
		if (observer) observer.disconnect();
	});
</script>

<div bind:this={el} class="relative min-h-[300px] flex flex-col items-center justify-center">
	{#if visible}
		<div class="w-full">
			<Chart {id} />
		</div>
	{:else}
		<div class="animate-pulse h-[50vh] w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
	{/if}
</div>
