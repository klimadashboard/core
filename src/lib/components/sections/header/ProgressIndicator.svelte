<script>
	import { onMount } from 'svelte';

	let scrollPercentage = 0;

	const updateScrollPercentage = () => {
		const scrollTop = window.scrollY || document.documentElement.scrollTop;
		const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
		scrollPercentage = (scrollTop / scrollHeight) * 100;
	};

	onMount(() => {
		window.addEventListener('scroll', updateScrollPercentage);
		return () => {
			window.removeEventListener('scroll', updateScrollPercentage);
		};
	});
</script>

<div class="h-0.5">
	<div class="bg-energy h-full transition" style="width: {scrollPercentage}%;" />
</div>
