<script>
	import { fly } from 'svelte/transition';
	export let url = '';
	const pageTransitionDuration = 500;
</script>

{#key url}
	<div
		in:fly={{ x: -5, duration: pageTransitionDuration, delay: pageTransitionDuration }}
		out:fly={{ x: 5, duration: pageTransitionDuration }}
	>
		<slot />
	</div>
{/key}
