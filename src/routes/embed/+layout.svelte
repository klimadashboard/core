<script>
	import { page } from '$app/state';
	import { getSkin, skinStyle } from '$lib/skins';

	let { children } = $props();

	// ?skin=<id> (or data-skin via embed.js); unknown ids fall back to the default look
	const skin = $derived(getSkin(page.url.searchParams.get('skin')));
</script>

<svelte:head>
	{#if skin?.fonts?.stylesheet}
		<link rel="stylesheet" href={skin.fonts.stylesheet} />
	{/if}
</svelte:head>

{#if skin}
	<div class="kd-skin" data-skin={skin.id} style={skinStyle(skin)}>
		{@render children()}
	</div>
{:else}
	{@render children()}
{/if}
