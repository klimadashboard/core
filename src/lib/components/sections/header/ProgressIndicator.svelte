<script>
	import { onMount } from 'svelte';

	let scrollPercentage = 0;

	const updateScrollPercentage = () => {
		const scrollTop = window.scrollY || document.documentElement.scrollTop;
		const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
		scrollPercentage = Math.max(0, (scrollTop / scrollHeight) * 100);
	};

	onMount(() => {
		window.addEventListener('scroll', updateScrollPercentage);
		return () => {
			window.removeEventListener('scroll', updateScrollPercentage);
		};
	});
</script>

<div class="h-0.5 bg-gray-100 dark:bg-gray-800">
	<div class="bg-[#40B189] h-full transition" style="width: {scrollPercentage}%;" />
</div>
