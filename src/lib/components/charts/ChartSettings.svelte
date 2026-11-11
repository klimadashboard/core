<!--
	Wrap a chart's own controls in <ChartSettings> to show them in the Card's settings area,
	together with the view switch and the download options:

		<ChartSettings>
			<RadioGroup label="Kennzahl" bind:value={metric} options={...} />
		</ChartSettings>

	Outside a Card (region overview tiles, Wrapper, small charts) the controls render in place.
	Card itself renders the collected controls with <ChartSettings outlet />.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getChartSettings } from './context/chartSettings';

	let { children, outlet = false }: { children?: Snippet; outlet?: boolean } = $props();

	const target = getChartSettings();

	$effect(() => {
		if (outlet || !target || !children) return;
		const snippet = children;
		target.update((list) => [...list, snippet]);
		return () => target.update((list) => list.filter((s) => s !== snippet));
	});
</script>

{#if outlet && target}
	{#each $target ?? [] as settings}
		{@render settings()}
	{/each}
{:else if !target}
	<div class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
		{@render children?.()}
	</div>
{/if}
